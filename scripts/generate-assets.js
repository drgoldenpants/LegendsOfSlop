import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const presetFile = path.join(repoRoot, "assets", "prompts", "league-of-shapes.yaml");
const localConfigFile = path.join(repoRoot, "config", "local", "openai.yaml");
const defaultOutputDir = path.join(repoRoot, "public", "generated-assets");
const fallbackModel = "gpt-image-1.5";

function printUsage() {
  console.log(`Usage:
  node scripts/generate-assets.js --list
  node scripts/generate-assets.js --preset circle-diver-splash
  node scripts/generate-assets.js --preset lane-key-art --count 2
  node scripts/generate-assets.js --all
  node scripts/generate-assets.js --prompt "Your prompt" --name custom-scene

Options:
  --preset <slug>        Generate one preset from assets/prompts/league-of-shapes.yaml
  --all                  Generate all presets
  --prompt <text>        Generate from a one-off prompt instead of a preset
  --name <slug>          Output filename prefix for one-off prompts
  --count <n>            Number of images to request (default 1)
  --size <WxH>           Override output size
  --quality <value>      low | medium | high | auto
  --background <value>   transparent | opaque | auto
  --format <value>       png | webp | jpeg
  --out <dir>            Output directory (default public/generated-assets)
  --list                 Print available presets
  --dry-run              Print request payloads without calling the API

Environment:
  OPENAI_API_KEY         Optional if config/local/openai.yaml contains openai.apiKey
  OPENAI_IMAGE_MODEL     Optional, overrides YAML config imageModel, defaults to ${fallbackModel}`);
}

function parseArgs(argv) {
  const args = {
    count: 1,
    out: defaultOutputDir,
    dryRun: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case "--preset":
        args.preset = next;
        i += 1;
        break;
      case "--all":
        args.all = true;
        break;
      case "--prompt":
        args.prompt = next;
        i += 1;
        break;
      case "--name":
        args.name = next;
        i += 1;
        break;
      case "--count":
        args.count = Number(next);
        i += 1;
        break;
      case "--size":
        args.size = next;
        i += 1;
        break;
      case "--quality":
        args.quality = next;
        i += 1;
        break;
      case "--background":
        args.background = next;
        i += 1;
        break;
      case "--format":
        args.format = next;
        i += 1;
        break;
      case "--out":
        args.out = path.resolve(repoRoot, next);
        i += 1;
        break;
      case "--list":
        args.list = true;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function slugify(value) {
  return String(value || "asset")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "asset";
}

function parseScalar(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (trimmed === "null") {
    return null;
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

function nextMeaningfulLine(lines, startIndex) {
  for (let index = startIndex; index < lines.length; index += 1) {
    const raw = lines[index];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    return {
      indent: raw.match(/^ */)[0].length,
      trimmed
    };
  }

  return null;
}

function parseSimpleYaml(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const root = {};
  const stack = [{ indent: -1, value: root }];

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const indent = raw.match(/^ */)[0].length;
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].value;

    if (trimmed.startsWith("- ")) {
      if (!Array.isArray(parent)) {
        throw new Error(`Invalid YAML list structure near line ${index + 1}.`);
      }

      const itemText = trimmed.slice(2).trim();
      if (!itemText) {
        const item = {};
        parent.push(item);
        stack.push({ indent, value: item });
        continue;
      }

      if (!itemText.includes(":")) {
        parent.push(parseScalar(itemText));
        continue;
      }

      const separatorIndex = itemText.indexOf(":");
      const key = itemText.slice(0, separatorIndex).trim();
      const rawValue = itemText.slice(separatorIndex + 1).trim();
      const item = {};
      parent.push(item);

      if (rawValue) {
        item[key] = parseScalar(rawValue);
      } else {
        const upcoming = nextMeaningfulLine(lines, index + 1);
        const child = upcoming && upcoming.indent > indent && upcoming.trimmed.startsWith("- ") ? [] : {};
        item[key] = child;
        stack.push({ indent, value: item });
        stack.push({ indent: indent + 1, value: child });
      }

      if (rawValue) {
        stack.push({ indent, value: item });
      }
      continue;
    }

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) {
      throw new Error(`Invalid YAML mapping near line ${index + 1}.`);
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (rawValue) {
      parent[key] = parseScalar(rawValue);
      continue;
    }

    const upcoming = nextMeaningfulLine(lines, index + 1);
    const child = upcoming && upcoming.indent > indent && upcoming.trimmed.startsWith("- ") ? [] : {};
    parent[key] = child;
    stack.push({ indent, value: child });
  }

  return root;
}

async function loadPresetFile() {
  const raw = await readFile(presetFile, "utf8");
  return parseSimpleYaml(raw);
}

async function loadLocalConfig() {
  try {
    const raw = await readFile(localConfigFile, "utf8");
    return parseSimpleYaml(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

function buildPrompt(styleGuide, prompt) {
  return `${styleGuide}\n\nAsset request:\n${prompt}`;
}

function buildJobs(config, args) {
  if (args.prompt) {
    return [
      {
        slug: slugify(args.name || "custom-asset"),
        description: "One-off prompt",
        prompt: buildPrompt(config.styleGuide, args.prompt),
        size: args.size || "1024x1024",
        quality: args.quality || "high",
        background: args.background || "opaque",
        outputFormat: args.format || "png",
        count: args.count
      }
    ];
  }

  if (args.all) {
    return config.presets.map((preset) => ({
      ...preset,
      prompt: buildPrompt(config.styleGuide, preset.prompt),
      count: args.count || 1,
      size: args.size || preset.size,
      quality: args.quality || preset.quality,
      background: args.background || preset.background,
      outputFormat: args.format || preset.outputFormat
    }));
  }

  if (args.preset) {
    const preset = config.presets.find((entry) => entry.slug === args.preset);
    if (!preset) {
      throw new Error(`Preset not found: ${args.preset}`);
    }

    return [
      {
        ...preset,
        prompt: buildPrompt(config.styleGuide, preset.prompt),
        count: args.count || 1,
        size: args.size || preset.size,
        quality: args.quality || preset.quality,
        background: args.background || preset.background,
        outputFormat: args.format || preset.outputFormat
      }
    ];
  }

  throw new Error("Choose one of --list, --preset, --all, or --prompt.");
}

async function requestImages(job) {
  const apiKey = job.apiKey;
  if (!apiKey) {
    throw new Error("OpenAI API key is required. Set OPENAI_API_KEY or add openai.apiKey to config/local/openai.yaml.");
  }

  const body = {
    model: job.model,
    prompt: job.prompt,
    n: job.count,
    size: job.size,
    quality: job.quality,
    background: job.background,
    output_format: job.outputFormat
  };

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`API returned non-JSON response (${response.status}): ${text}`);
  }

  if (!response.ok) {
    throw new Error(`Image API error (${response.status}): ${payload.error?.message || text}`);
  }

  return { body, payload };
}

async function saveImages(job, result, outDir) {
  await mkdir(outDir, { recursive: true });

  const writtenFiles = [];
  const extension = job.outputFormat === "jpeg" ? "jpg" : job.outputFormat;
  const createdAt = new Date().toISOString().replace(/[:.]/g, "-");

  for (let index = 0; index < result.payload.data.length; index += 1) {
    const image = result.payload.data[index];
    const baseName = `${job.slug}-${createdAt}${result.payload.data.length > 1 ? `-${index + 1}` : ""}`;
    const imagePath = path.join(outDir, `${baseName}.${extension}`);
    await writeFile(imagePath, Buffer.from(image.b64_json, "base64"));
    writtenFiles.push(imagePath);
  }

  const metaPath = path.join(outDir, `${job.slug}-${createdAt}.json`);
  const metadata = {
    job: {
      slug: job.slug,
      description: job.description,
      model: job.model,
      size: job.size,
      quality: job.quality,
      background: job.background,
      outputFormat: job.outputFormat,
      count: job.count
    },
    request: result.body,
    usage: result.payload.usage || null,
    created: result.payload.created || null,
    files: writtenFiles
  };
  await writeFile(metaPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  return { writtenFiles, metaPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  const config = await loadPresetFile();
  const localConfig = await loadLocalConfig();
  const model = process.env.OPENAI_IMAGE_MODEL || localConfig.openai?.imageModel || fallbackModel;
  const apiKey = process.env.OPENAI_API_KEY || localConfig.openai?.apiKey;

  if (args.list) {
    for (const preset of config.presets) {
      console.log(`${preset.slug} - ${preset.description}`);
    }
    return;
  }

  if (!Number.isInteger(args.count) || args.count < 1 || args.count > 10) {
    throw new Error("--count must be an integer between 1 and 10.");
  }

  const jobs = buildJobs(config, args);

  for (const job of jobs) {
    const summary = {
      slug: job.slug,
      size: job.size,
      quality: job.quality,
      background: job.background,
      format: job.outputFormat,
      count: job.count,
      model
    };

    if (args.dryRun) {
      console.log(JSON.stringify(summary, null, 2));
      console.log(job.prompt);
      continue;
    }

    console.log(`Generating ${job.slug}...`);
    const result = await requestImages({ ...job, apiKey, model });
    const saved = await saveImages({ ...job, model }, result, args.out);
    for (const file of saved.writtenFiles) {
      console.log(`Wrote ${path.relative(repoRoot, file)}`);
    }
    console.log(`Metadata ${path.relative(repoRoot, saved.metaPath)}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
