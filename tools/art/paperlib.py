"""Helpers to put real handwriting onto paper notes inside a photo:
clean the scribbles off a note (keeping its light and shading) and write new text
in perspective. Used once to make the hero pictures; not part of the site build."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont


def homography(src, dst):
    A = []
    for (x, y), (u, v) in zip(src, dst):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y, -u])
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y, -v])
    _, _, vt = np.linalg.svd(np.array(A, float))
    h = vt[-1].reshape(3, 3)
    return h / h[2, 2]


def quad_mask(size, quad, shrink=0):
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in quad], fill=255)
    if shrink:
        m = m.filter(ImageFilter.MinFilter(shrink * 2 + 1))
    return m


def clean(img, quad, keep=(), strength=9, shrink=3):
    """Remove dark strokes inside quad. keep: list of (x, y, r) circles left untouched (pins)."""
    xs = [p[0] for p in quad]; ys = [p[1] for p in quad]
    box = (int(min(xs)) - 30, int(min(ys)) - 30, int(max(xs)) + 30, int(max(ys)) + 30)
    reg = img.crop(box)
    # paper colour field: grow the light paper over the dark ink, then smooth
    paper = reg.filter(ImageFilter.MaxFilter(strength)).filter(ImageFilter.MaxFilter(strength))
    paper = paper.filter(ImageFilter.GaussianBlur(strength))
    # keep the paper's own grain: add back high-frequency light noise of the original where it is not ink
    mask = quad_mask(img.size, quad, shrink).crop(box)
    d = ImageDraw.Draw(mask)
    for (x, y, r) in keep:
        d.ellipse((x - box[0] - r, y - box[1] - r, x - box[0] + r, y - box[1] + r), fill=0)
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    reg.paste(paper, (0, 0), mask)
    img.paste(reg, box[:2])
    return img


def write(img, quad, lines, font_path, size, ink=(30, 30, 34), alpha=0.86, tex=(600, 600),
          pad=(40, 40), line_gap=1.05, rotate=0, align='left', blur=0.6, colors=None):
    """Write lines on a tex-sized virtual sheet and map it onto quad (TL, TR, BR, BL)."""
    W, H = tex
    sheet = Image.new('L', tex, 0)
    d = ImageDraw.Draw(sheet)
    font = ImageFont.truetype(font_path, size)
    y = pad[1]
    color_layer = Image.new('RGB', tex, ink)
    cd = ImageDraw.Draw(color_layer)
    for i, line in enumerate(lines):
        if isinstance(line, tuple):
            line, lsize = line
            f = ImageFont.truetype(font_path, lsize)
        else:
            f = font
        if line == '':
            y += f.size * 1.0 * line_gap
            continue
        bb = d.textbbox((0, 0), line, font=f)
        x = pad[0] if align == 'left' else (W - (bb[2] - bb[0])) / 2
        d.text((x, y), line, font=f, fill=255)
        if colors and i in colors:
            cd.rectangle((0, y, W, y + (bb[3] - bb[1]) * 1.4), fill=colors[i])
        y += (bb[3] - bb[1] + f.size * 0.35) * line_gap
    if rotate:
        sheet = sheet.rotate(rotate, resample=Image.BICUBIC)
        color_layer = color_layer.rotate(rotate, resample=Image.BICUBIC)
    src = [(0, 0), (W, 0), (W, H), (0, H)]
    hmat = homography(quad, src)          # destination -> sheet
    coeffs = (hmat / hmat[2, 2]).flatten()[:8]
    warped = sheet.transform(img.size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    cwarp = color_layer.transform(img.size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    if blur:
        warped = warped.filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(warped).astype(float)[..., None] / 255 * alpha
    base = np.asarray(img).astype(float)
    inkc = np.asarray(cwarp).astype(float)
    # ink takes the paper's light: darker where the paper is darker
    lum = base.mean(axis=2, keepdims=True) / 255
    ink_lit = inkc * (0.35 + 0.65 * lum)
    out = base * (1 - a) + ink_lit * a
    return Image.fromarray(np.clip(out, 0, 255).astype('uint8'))


def place(img, quad, art, alpha=1.0, blur=0.0):
    """Map an RGB(A) picture onto quad."""
    W, H = art.size
    hmat = homography(quad, [(0, 0), (W, 0), (W, H), (0, H)])
    coeffs = (hmat / hmat[2, 2]).flatten()[:8]
    art = art.convert('RGBA')
    warped = art.transform(img.size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    if blur:
        warped = warped.filter(ImageFilter.GaussianBlur(blur))
    if alpha < 1:
        r, g, b, a = warped.split(); a = a.point(lambda v: int(v * alpha)); warped = Image.merge('RGBA', (r, g, b, a))
    out = img.convert('RGBA'); out.alpha_composite(warped)
    return out.convert('RGB')
