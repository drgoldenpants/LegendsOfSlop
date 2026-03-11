from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "game-assets"
CELL_SIZE = 256
COLS = 4
ROWS = 2
SHEET_SIZE = (CELL_SIZE * COLS, CELL_SIZE * ROWS)


SHEETS = [
    ("hero-circle.png", "hero-circle-sheet.png", "hero"),
    ("hero-square.png", "hero-square-sheet.png", "hero"),
    ("hero-triangle.png", "hero-triangle-sheet.png", "hero"),
    ("hero-hex.png", "hero-hex-sheet.png", "hero"),
    ("hero-diamond.png", "hero-diamond-sheet.png", "hero"),
    ("hero-nova.png", "hero-nova-sheet.png", "hero"),
    ("hero-onyx.png", "hero-onyx-sheet.png", "hero"),
    ("creep-blue-melee.png", "creep-blue-melee-sheet.png", "unit"),
    ("creep-blue-ranged.png", "creep-blue-ranged-sheet.png", "unit"),
    ("creep-blue-siege.png", "creep-blue-siege-sheet.png", "unit"),
    ("creep-red-melee.png", "creep-red-melee-sheet.png", "unit"),
    ("creep-red-ranged.png", "creep-red-ranged-sheet.png", "unit"),
    ("creep-red-siege.png", "creep-red-siege-sheet.png", "unit"),
    ("neutral-creep.png", "neutral-creep-sheet.png", "neutral"),
    ("neutral-elite.png", "neutral-elite-sheet.png", "neutral"),
]


def trim_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    return rgba.crop(bbox) if bbox else rgba


def fit_to_cell(image: Image.Image, scale: float = 0.82) -> Image.Image:
    trimmed = trim_alpha(image)
    max_dim = int(CELL_SIZE * scale)
    ratio = min(max_dim / trimmed.width, max_dim / trimmed.height)
    size = (max(1, int(trimmed.width * ratio)), max(1, int(trimmed.height * ratio)))
    return trimmed.resize(size, Image.Resampling.LANCZOS)


def paste_centered(canvas: Image.Image, sprite: Image.Image, x: int, y: int) -> None:
    canvas.alpha_composite(sprite, (x - sprite.width // 2, y - sprite.height // 2))


def transform_frame(base: Image.Image, kind: str, row: int, frame: int) -> Image.Image:
    bob = [0, -8, -3, -10][frame]
    scale_x = [1.0, 0.97, 1.04, 0.98][frame]
    scale_y = [1.0, 1.05, 0.95, 1.06][frame]
    if row == 1:
      bob = [-4, -14, -8, -2][frame]
      scale_x = [0.98, 1.08, 1.12, 1.0][frame]
      scale_y = [1.02, 0.92, 0.9, 1.0][frame]

    resized = base.resize(
        (max(1, int(base.width * scale_x)), max(1, int(base.height * scale_y))),
        Image.Resampling.LANCZOS,
    )
    angle = [-2.5, 1.5, -1.5, 2.2][frame] if row == 0 else [-4.0, 6.0, -3.0, 0.5][frame]
    transformed = resized.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)

    frame_image = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_width = int(CELL_SIZE * (0.28 if kind == "hero" else 0.24))
    shadow_height = int(CELL_SIZE * (0.08 if kind == "hero" else 0.07))
    if kind == "neutral":
        shadow_width = int(CELL_SIZE * 0.3)
    shadow_draw.ellipse(
        (
            CELL_SIZE // 2 - shadow_width,
            int(CELL_SIZE * 0.74) - shadow_height,
            CELL_SIZE // 2 + shadow_width,
            int(CELL_SIZE * 0.74) + shadow_height,
        ),
        fill=(0, 0, 0, 95),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    frame_image.alpha_composite(shadow)

    paste_centered(frame_image, transformed, CELL_SIZE // 2, int(CELL_SIZE * 0.54) + bob)
    return frame_image


def build_sheet(source_name: str, target_name: str, kind: str) -> None:
    source_path = ASSET_DIR / source_name
    target_path = ASSET_DIR / target_name
    base = fit_to_cell(Image.open(source_path))
    sheet = Image.new("RGBA", SHEET_SIZE, (0, 0, 0, 0))
    for row in range(ROWS):
        for col in range(COLS):
            frame = transform_frame(base, kind, row, col)
            sheet.alpha_composite(frame, (col * CELL_SIZE, row * CELL_SIZE))
    sheet.save(target_path)
    print(target_path.name)


def main() -> None:
    for source_name, target_name, kind in SHEETS:
        build_sheet(source_name, target_name, kind)


if __name__ == "__main__":
    main()
