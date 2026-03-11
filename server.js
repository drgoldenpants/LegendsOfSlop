import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { GameServer } from "./src/game.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

async function serveStatic(res, relativePath) {
  const safePath = relativePath === "/" ? "/index.html" : relativePath;
  const targetPath = path.join(publicDir, safePath);
  const ext = path.extname(targetPath);
  const file = await readFile(targetPath);

  res.writeHead(200, {
    "Content-Type": contentTypes[ext] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  res.end(file);
}

function getLanAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        addresses.push(entry.address);
      }
    }
  }

  return addresses;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && url.pathname === "/meta") {
      const body = JSON.stringify({
        ok: true,
        port,
        lanUrls: getLanAddresses().map((address) => `http://${address}:${port}`)
      });
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Length": Buffer.byteLength(body)
      });
      res.end(body);
      return;
    }

    if (req.method === "GET" && url.pathname === "/lobby-state") {
      const body = JSON.stringify({
        ok: true,
        roster: game.getLobbyRoster()
      });
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Length": Buffer.byteLength(body)
      });
      res.end(body);
      return;
    }

    if (req.method === "GET") {
      await serveStatic(res, url.pathname);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "not-found" }));
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "not-found" }));
      return;
    }
    const statusCode = error instanceof SyntaxError ? 400 : 500;
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: false,
      error: statusCode === 400 ? "bad-request" : "server-error",
      detail: error.message
    }));
  }
});

const wss = new WebSocketServer({ server });
const game = new GameServer();

wss.on("connection", (ws) => {
  let connectionToken = null;
  const socketId = Math.random().toString(36).slice(2, 8);
  console.log(`[ws-open] socket=${socketId}`);

  ws.on("message", (message) => {
    try {
      const payload = JSON.parse(message.toString());

      if (payload.type === "join") {
        console.log(
          `[ws-join-attempt] socket=${socketId} name=${String(payload.name || "").slice(0, 16)} hero=${payload.heroType || "circle"} preferredTeam=${payload.preferredTeam || "auto"}`
        );
        const session = game.joinPlayer(payload.name, payload.heroType, {
          preferredTeam: payload.preferredTeam
        });
        if (!session.ok) {
          console.log(`[ws-join-denied] socket=${socketId} error=${session.error} message="${session.message}"`);
          ws.send(JSON.stringify({ type: "join-error", ...session }));
          return;
        }
        if (game.clients.has(session.token) && game.clients.get(session.token) !== ws) {
          console.log(`[ws-client-replaced] socket=${socketId} token=${session.token.slice(0, 8)}`);
        }
        connectionToken = session.token;
        game.clients.set(connectionToken, ws);
        console.log(
          `[ws-joined] socket=${socketId} token=${session.token.slice(0, 8)} player=${session.name} team=${session.team} hero=${session.heroType}`
        );
        ws.send(JSON.stringify({ type: "joined", ...session }));
        return;
      }

      if (payload.type === "reconnect") {
        console.log(`[ws-reconnect-attempt] socket=${socketId} token=${String(payload.token || "").slice(0, 8)}`);
        const session = game.reconnectPlayer(payload.token);
        if (!session.ok) {
          console.log(`[ws-reconnect-denied] socket=${socketId} error=${session.error} message="${session.message}"`);
          ws.send(JSON.stringify({ type: "reconnect-error", ...session }));
          return;
        }
        if (game.clients.has(session.token) && game.clients.get(session.token) !== ws) {
          console.log(`[ws-client-replaced] socket=${socketId} token=${session.token.slice(0, 8)}`);
        }
        connectionToken = session.token;
        game.clients.set(connectionToken, ws);
        console.log(
          `[ws-rejoined] socket=${socketId} token=${session.token.slice(0, 8)} player=${session.name} team=${session.team} hero=${session.heroType} resumed=${!!session.resumed}`
        );
        ws.send(JSON.stringify({ type: "joined", ...session }));
        return;
      }

      if (payload.type === "input" && connectionToken) {
        game.handleInput(connectionToken, payload);
      }
    } catch (e) {
      console.error("Failed parsing message:", e);
    }
  });

  ws.on("close", () => {
    console.log(`[ws-close] socket=${socketId} token=${connectionToken ? connectionToken.slice(0, 8) : "none"}`);
    if (connectionToken && game.clients.get(connectionToken) === ws) {
      game.clients.delete(connectionToken);
      game.disconnectPlayer(connectionToken);
    }
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Legends of Slop server running on http://localhost:${port}`);

  for (const address of getLanAddresses()) {
    console.log(`LAN: http://${address}:${port}`);
  }
});
