"""產生擴充功能圖示與商店宣傳圖。需要 Pillow。用法：python scripts/make_icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = Path("C:/Windows/Fonts")
TOP, BOT = (0x25, 0x63, 0xEB), (0x43, 0x38, 0xCA)
S = 1024


def font(names, size):
    for n in names:
        p = FONTS / n
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def gradient(w, h):
    col = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(h - 1, 1)
        col.putpixel((0, y), tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOT)))
    return col.resize((w, h))


def rounded_bg(w, h, radius):
    img = gradient(w, h).convert("RGBA")
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius, fill=255)
    img.putalpha(mask)
    return img


def artwork(with_text=True):
    """1024x1024 圖示本體（圓角方形 + 放大鏡 + AI）。"""
    img = rounded_bg(S, S, int(S * 0.22))
    d = ImageDraw.Draw(img)
    cx, cy, r = 430, 430, 270           # 鏡片中心與外半徑
    w = 78                               # 環寬
    # 把手：從鏡片外緣朝右下
    import math
    a = math.radians(45)
    x0, y0 = cx + (r - 10) * math.cos(a), cy + (r - 10) * math.sin(a)
    x1, y1 = cx + 520 * math.cos(a), cy + 520 * math.sin(a)
    d.line((x0, y0, x1, y1), fill="white", width=110)
    for x, y in ((x1, y1),):
        d.ellipse((x - 55, y - 55, x + 55, y + 55), fill="white")
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill="white")
    d.ellipse((cx - r + w, cy - r + w, cx + r - w, cy + r - w), fill=None)
    # 鏡片內挖空成漸層（重貼背景）
    inner = (cx - r + w, cy - r + w, cx + r - w, cy + r - w)
    bg = rounded_bg(S, S, int(S * 0.22))
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).ellipse(inner, fill=255)
    img.paste(bg, (0, 0), m)
    if with_text:
        d = ImageDraw.Draw(img)
        f = font(["arialbd.ttf", "segoeuib.ttf", "msjhbd.ttc"], 215)
        d.text((cx, cy + 4), "AI", font=f, fill="white", anchor="mm")
    return img


def save_icons():
    out = ROOT / "icons"
    out.mkdir(exist_ok=True)
    big = artwork(True)
    big_notext = artwork(False)
    big.resize((48, 48), Image.LANCZOS).save(out / "icon48.png")
    # 16px 文字會糊掉，只保留鏡片
    big_notext.resize((16, 16), Image.LANCZOS).save(out / "icon16.png")
    canvas = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    canvas.paste(big.resize((96, 96), Image.LANCZOS), (16, 16))
    canvas.save(out / "icon128.png")
    return big


def promo(big):
    W, H = 440, 280
    sc = 4  # 超取樣
    img = rounded_bg(W * sc, H * sc, 0).convert("RGB")  # 商店圖不需圓角
    # 左側圖示：白色底方塊上放漸層圖示會看不到，改為淡色外框
    icon = big.resize((150 * sc, 150 * sc), Image.LANCZOS)
    img.paste(icon, (28 * sc, 65 * sc), icon)
    d = ImageDraw.Draw(img)
    f1 = font(["msjhbd.ttc"], 38 * sc)
    f2 = font(["msjh.ttc"], 15 * sc)
    d.text((196 * sc, 112 * sc), "AI 圖片偵測", font=f1, fill="white", anchor="lm")
    d.text((196 * sc, 160 * sc), "右鍵即可判斷圖片", font=f2, fill=(224, 231, 255), anchor="lm")
    d.text((196 * sc, 182 * sc), "是否為 AI 生成", font=f2, fill=(224, 231, 255), anchor="lm")
    out = ROOT / "store"
    out.mkdir(exist_ok=True)
    img.resize((W, H), Image.LANCZOS).save(out / "promo-small-440x280.png")


if __name__ == "__main__":
    promo(save_icons())
    print("done")
