"""打包成 Chrome Web Store 上傳用 zip。用法：python scripts/pack.py"""
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REQUIRED = [
    "lib/ort/ort.wasm.min.js",
    "lib/ort/ort-wasm-simd-threaded.wasm",
    "lib/ort/ort-wasm-simd-threaded.mjs",
    "models/detectra.onnx",
]
FILES = [
    "manifest.json", "background.js", "content.js", "offscreen.html", "offscreen.js",
    "preprocess.js", "options.html", "options.js", "LICENSE", "THIRD_PARTY_NOTICES.md",
] + REQUIRED


def main():
    missing = [f for f in REQUIRED if not (ROOT / f).is_file()]
    if missing:
        sys.exit("缺少檔案：\n  " + "\n  ".join(missing) + "\n先執行 sh setup.sh")
    files = list(FILES) + sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "icons").glob("*.png"))
    absent = [f for f in files if not (ROOT / f).is_file()]
    if absent:
        sys.exit("缺少檔案：" + ", ".join(absent))
    version = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))["version"]
    out = ROOT / "dist" / f"ai-image-detector-{version}.zip"
    out.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(ROOT / f, f)
    total = 0
    for f in files:
        size = (ROOT / f).stat().st_size
        total += size
        print(f"{size:>12,}  {f}")
    print(f"未壓縮合計 {total:,} bytes；zip {out.stat().st_size:,} bytes -> {out}")


if __name__ == "__main__":
    main()
