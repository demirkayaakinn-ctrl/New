"""OGM Ormanı · Tohumix kalem etiketi – baskıya hazır PDF üretir.

- Bıçak izi: orijinal Tohumix-Tekli.pdf'ten birebir (Artios_Cut / Artios_Crease spot, overprint)
- Renk: tamamı DeviceCMYK (görseller CMYK raster, yazılar ve QR vektörel CMYK)
- Taşma: zemin sayfa kenarına kadar (bıçak izinin her yönünde ≥ 3,5 mm)
- Yazılar eğriye çevrilmiş (font gömme gerektirmez)
"""
import io
import sys
import numpy as np
import qrcode
from PIL import Image
from scipy import ndimage
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from reportlab.pdfgen import canvas
from reportlab.lib.colors import CMYKColor
from reportlab.lib.utils import ImageReader

from die import page_size_pt, UU
from dieonly import draw_die, die_ops

SCR = '/tmp/claude-0/-home-user-New/3e8f1084-1d86-5cb6-a53a-b4330781fa06/scratchpad/'
UP = '/root/.claude/uploads/3e8f1084-1d86-5cb6-a53a-b4330781fa06/'
FONTS = '/home/user/New/app/node_modules/@fontsource/poppins/files/'
W, H = page_size_pt()            # 128.356 x 253.687 pt (45,3 x 89,5 mm)
DPI = 800
PX_W, PX_H = round(W / 72 * DPI), round(H / 72 * DPI)
CX = W / 2

# ---- CMYK renkler (0-1) ----
FOREST = (0.85, 0.35, 1.0, 0.45)
GREEN = (0.75, 0.15, 1.0, 0.10)
LEAF = (0.55, 0.0, 1.0, 0.0)
SUN = (0.0, 0.22, 0.92, 0.0)
WHITE = (0, 0, 0, 0)


def col(c):
    return CMYKColor(*c)


# ------------------------------------------------------------------ #
# RGB -> CMYK (GCR, toplam mürekkep ≤ %300)                            #
# ------------------------------------------------------------------ #
def rgb_to_cmyk(rgb):
    rgb = rgb.astype(np.float32) / 255.0
    c, m, y = 1 - rgb[..., 0], 1 - rgb[..., 1], 1 - rgb[..., 2]
    k = np.minimum(np.minimum(c, m), y)
    kk = k * 0.85
    d = np.maximum(1 - kk, 1e-6)
    c, m, y = (c - kk) / d, (m - kk) / d, (y - kk) / d
    out = np.stack([c, m, y, kk], -1)
    tac = out.sum(-1, keepdims=True)
    out = out * np.minimum(1.0, 3.0 / np.maximum(tac, 1e-6))
    return np.clip(out, 0, 1)


# ------------------------------------------------------------------ #
# Bıçak izi maskesi (yerleşim + iç çerçeve için)                       #
# ------------------------------------------------------------------ #
def die_masks():
    import subprocess
    subprocess.run(['pdftoppm', '-r', str(DPI), '-gray', '-singlefile', '-png', SCR + 'dieonly.pdf', SCR + 'diemask'], check=True)
    g = np.asarray(Image.open(SCR + 'diemask.png').convert('L').resize((PX_W, PX_H)))
    line = g < 128
    lab, _ = ndimage.label(~line)
    outside = lab == lab[0, 0]
    inside = ~outside & ~line
    # delik: üst kulaktaki iç bölge (merkez ~ (6.418, 22.92) birim)
    hx, hy = int(6.418 * UU / W * PX_W), int((H - 21.77 * UU) / H * PX_H)
    hole = lab == lab[hy, hx]
    shape = ~outside                       # bıçak izinin içi (çizgi dahil)
    dist_in = ndimage.distance_transform_edt(shape & ~hole)
    dist_hole = ndimage.distance_transform_edt(~hole)
    return shape, hole, dist_in, dist_hole


# ------------------------------------------------------------------ #
# Raster katman: kraft zemin + çerçeve + görseller (CMYK)              #
# ------------------------------------------------------------------ #
def kraft_base():
    im = Image.open('kraft_cmyk.tif')            # orijinal dosyadaki CMYK kraft doku
    a = np.asarray(im).astype(np.float32) / 255.0
    ih, iw = a.shape[:2]
    # orijinal yerleşim: 21.5599 x 32.3654 birim, sol-alt (-3.4158, -2.6886)
    sx, sy = iw / 21.5598606, ih / 32.3653964
    x0 = 3.4157517 * sx
    ytop = (32.3653964 - 2.6885814 - H / UU) * sy
    crop = im.crop((round(x0), round(ytop), round(x0 + W / UU * sx), round(ytop + H / UU * sy)))
    crop = crop.resize((PX_W, PX_H), Image.LANCZOS)
    return np.asarray(crop).astype(np.float32) / 255.0


def paste(base, img_rgba, x_pt, y_pt, w_pt):
    """RGBA görseli CMYK'ya çevirip (x,y = sol-alt, pt) tabana yerleştirir."""
    h_pt = w_pt * img_rgba.height / img_rgba.width
    pw, ph = round(w_pt / 72 * DPI), round(h_pt / 72 * DPI)
    im = img_rgba.convert('RGBA').resize((pw, ph), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    alpha = a[..., 3:4] / 255.0
    cmyk = rgb_to_cmyk(a[..., :3])
    px = round(x_pt / 72 * DPI)
    py = round((H - y_pt - h_pt) / 72 * DPI)
    region = base[py:py + ph, px:px + pw]
    region[:] = region * (1 - alpha) + cmyk * alpha
    return h_pt


def draw_frame(base, masks, color, d1=7.0, d2=9.4):
    """Bıçak izinin içine, kenardan d1–d2 pt mesafede renkli çerçeve."""
    shape, hole, dist_in, dist_hole = masks
    pxpt = DPI / 72
    ring = (dist_in > d1 * pxpt) & (dist_in <= d2 * pxpt)
    hring = (dist_hole > 3.2 * pxpt) & (dist_hole <= 5.6 * pxpt) & shape
    m = (ring | hring).astype(np.float32)
    m = ndimage.gaussian_filter(m, 0.7)[..., None]
    base[:] = base * (1 - m) + np.array(color, np.float32) * m


def raster_to_reader(base):
    a = (np.clip(base, 0, 1) * 255).round().astype(np.uint8)
    im = Image.fromarray(a, 'CMYK')
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=95, subsampling=0, dpi=(DPI, DPI))
    buf.seek(0)
    return ImageReader(buf)


# ------------------------------------------------------------------ #
# Yazıları eğriye çevirerek çizme                                      #
# ------------------------------------------------------------------ #
class CanvasPen(BasePen):
    def __init__(self, glyphset, path, sx, ox, oy):
        super().__init__(glyphset)
        self.p, self.s, self.ox, self.oy = path, sx, ox, oy

    def _t(self, pt):
        return self.ox + pt[0] * self.s, self.oy + pt[1] * self.s

    def _moveTo(self, pt):
        self.p.moveTo(*self._t(pt))

    def _lineTo(self, pt):
        self.p.lineTo(*self._t(pt))

    def _curveToOne(self, a, b, c):
        self.p.curveTo(*self._t(a), *self._t(b), *self._t(c))

    def _closePath(self):
        self.p.close()


_fonts = {}


def font(weight):
    if weight not in _fonts:
        _fonts[weight] = [TTFont(f'{FONTS}poppins-{sub}-{weight}-normal.woff') for sub in ('latin', 'latin-ext')]
    return _fonts[weight]


def _glyph(weight, ch):
    for f in font(weight):
        cm = f.getBestCmap()
        if ord(ch) in cm:
            return f, cm[ord(ch)]
    raise KeyError(ch)


def text_width(s, size, weight=600, track=0):
    w = 0
    for ch in s:
        f, g = _glyph(weight, ch)
        w += f['hmtx'][g][0] / f['head'].unitsPerEm * size + track
    return w - (track if s else 0)


def draw_text(c, s, x, y, size, color, weight=600, anchor='middle', track=0):
    tw = text_width(s, size, weight, track)
    if anchor == 'middle':
        x -= tw / 2
    elif anchor == 'end':
        x -= tw
    p = c.beginPath()
    for ch in s:
        f, g = _glyph(weight, ch)
        upm = f['head'].unitsPerEm
        gs = f.getGlyphSet()
        gs[g].draw(CanvasPen(gs, p, size / upm, x, y))
        x += f['hmtx'][g][0] / upm * size + track
    c.setFillColor(col(color))
    c.drawPath(p, stroke=0, fill=1)


# ------------------------------------------------------------------ #
# QR (vektörel)                                                        #
# ------------------------------------------------------------------ #
def draw_qr(c, data, x, y, size, color):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
    q.add_data(data)
    q.make(fit=True)
    m = q.get_matrix()
    n = len(m)
    cell = size / n
    c.setFillColor(col(color))
    p = c.beginPath()
    for r, row in enumerate(m):
        cidx = 0
        while cidx < n:
            if row[cidx]:
                start = cidx
                while cidx < n and row[cidx]:
                    cidx += 1
                # küçük bindirme: hücreler arası beyaz çizgi oluşmasın
                p.rect(x + start * cell, y + size - (r + 1) * cell - 0.02, (cidx - start) * cell + 0.02, cell + 0.04)
            else:
                cidx += 1
    c.drawPath(p, stroke=0, fill=1)


def sun_art(c, color, lw=0.26):
    """Alt kulaktaki güneş kesimini baskıda da koyu yeşil olarak gösterir (orijinal tasarımdaki gibi)."""
    ops = die_ops()
    # ilk blok: güneş ışınları + daire (ilk /CS0 bloğundan, "0 25.369 ..." kırpmasına kadar ve sonraki 1. daire)
    c.saveState()
    c.setStrokeColor(col(color))
    c._code.append(f'{UU:g} 0 0 {UU:g} 0 0 cm')
    c._code.append(f'{lw} w 1 J 1 j')
    take = False
    count_circles = 0
    buf = []
    for l in ops:
        if l.startswith('/CS0') and not take:
            take = True
            continue
        if not take:
            continue
        if l.startswith('/CS') or l.endswith(' gs') or l.endswith(' w 1 j') or l.endswith(' d'):
            continue
        if l == '0 25.369 12.836 -25.369 re' or l == 'W n':
            continue
        buf.append(l)
        if l.startswith('q 1 0 0 1 6.4178 20.6218 cm'):
            buf.pop()
            break
    # buf: 12 ışın + iç daire (+ son açık q'lar)
    depth = sum(1 for l in buf if l == 'q' or l.startswith('q ')) - sum(1 for l in buf if l == 'Q')
    for l in buf:
        c._code.append(l)
    c._code.extend(['Q'] * max(depth, 0))
    c.restoreState()


# ------------------------------------------------------------------ #
# ÖN YÜZ                                                               #
# ------------------------------------------------------------------ #
def front_page(c, masks, base_kraft):
    base = base_kraft.copy()
    draw_frame(base, masks, FOREST)
    logo = Image.open(UP + '0f73b355-image.png').convert('RGBA')
    sq = Image.open('/home/user/New/app/www/img/sincap.png').convert('RGBA')
    # OGM logosu (beyaz daire içinde)
    d = 48.0
    ly = 151.0
    paste(base, logo, CX - d / 2, ly, d)
    # sincap
    sw = 51.0
    sh = sw * sq.height / sq.width
    paste(base, sq, CX - sw / 2 + 2, 52.5, sw)
    c.drawImage(raster_to_reader(base), 0, 0, W, H)
    # "OGM ORMANI" bandı
    bw, bh, by = 80.0, 14.5, 133.0
    c.setFillColor(col(FOREST))
    c.roundRect(CX - bw / 2, by, bw, bh, bh / 2, stroke=0, fill=1)
    draw_text(c, 'OGM ORMANI', CX, by + 4.2, 8.8, WHITE, 800, track=0.25)
    draw_text(c, 'Her kalem bir fidan', CX, 123.6, 6.2, FOREST, 700)
    sun_art(c, FOREST)
    return sh


# ------------------------------------------------------------------ #
# ARKA YÜZ                                                             #
# ------------------------------------------------------------------ #
SPECIES = {'KARACAM': 'Karaçam', 'SARICAM': 'Sarıçam', 'KIZILCAM': 'Kızılçam', 'HALEP': 'Halep Çamı'}


def back_page(c, masks, base_kraft, pen_id, sp):
    base = base_kraft.copy()
    draw_frame(base, masks, FOREST)
    tx = Image.open('/home/user/New/app/www/img/tohumix-logo.png').convert('RGBA')
    tw = 64.0
    paste(base, tx, CX - tw / 2 - 1, 167.5, tw)
    c.drawImage(raster_to_reader(base), 0, 0, W, H)
    # QR kutusu
    bs = 66.0
    bx, by = CX - bs / 2, 89.0
    c.setFillColor(col(WHITE))
    c.roundRect(bx, by, bs, bs + 9, 6, stroke=0, fill=1)
    qs = 54.0
    draw_qr(c, f'TOHUMIX:{pen_id}:{sp}', CX - qs / 2, by + 15.0, qs, FOREST)
    draw_text(c, pen_id, CX, by + 5.4, 6.2, FOREST, 800, track=0.3)
    # tohum etiketi
    label = f'Tohum: {SPECIES[sp]}'
    pw = text_width(label, 6.6, 700) + 14
    c.setFillColor(col(SUN))
    c.roundRect(CX - pw / 2, 74.5, pw, 11.5, 5.75, stroke=0, fill=1)
    draw_text(c, label, CX, 78.0, 6.4, FOREST, 700)
    draw_text(c, 'Kalemin bitince dik,', CX, 65.5, 5.3, FOREST, 600)
    draw_text(c, "QR'ı okut, ormana katıl!", CX, 58.8, 5.3, FOREST, 800)
    # üst kulak: "OGM ORMANI" küçük yazı yok (delik alanı); alt kulak güneş
    sun_art(c, FOREST)


TRIM = None


def page_boxes(c):
    # Kesim (trim) kutusu: bıçak izinin sınırları; taşma kutusu: sayfanın tamamı
    c.setTrimBox(TRIM)
    c.setBleedBox((0, 0, W, H))


def build():
    from die import SRC  # noqa
    sys.path.insert(0, '/home/user/New/app/src')
    pens = [
        ('TX26-004181', 'KARACAM'), ('TX26-004182', 'KARACAM'), ('TX26-004183', 'KARACAM'), ('TX26-004184', 'KARACAM'),
        ('TX26-004185', 'SARICAM'), ('TX26-004186', 'SARICAM'), ('TX26-004187', 'KARACAM'), ('TX26-004188', 'KARACAM'),
        ('TX26-004189', 'KIZILCAM'), ('TX26-004190', 'HALEP'), ('TX26-004191', 'KARACAM'), ('TX26-004192', 'SARICAM'),
    ]
    global TRIM
    masks = die_masks()
    kraft = kraft_base()
    ys, xs = np.nonzero(masks[0])
    k = 72 / DPI
    TRIM = tuple(float(v) for v in (round(xs.min() * k, 2), round(H - (ys.max() + 1) * k, 2), round((xs.max() + 1) * k, 2), round(H - ys.min() * k, 2)))
    print('trim box (pt):', TRIM, 'mm:', [round(v / 72 * 25.4, 1) for v in TRIM])

    def new(path, title):
        c = canvas.Canvas(path, pagesize=(W, H), pageCompression=1)
        c.setTitle(title)
        c.setAuthor('Tohumix')
        return c

    # 1) Ön yüz (tek sayfa, tüm etiketlerde ortak)
    c = new('out/OGM-Ormani-Etiket-ON-YUZ.pdf', 'OGM Ormanı – Etiket ön yüz')
    page_boxes(c)
    front_page(c, masks, kraft)
    draw_die(c)
    c.showPage()
    c.save()

    # 2) Arka yüzler (12 sayfa, her biri farklı QR)
    c = new('out/OGM-Ormani-Etiket-ARKA-YUZ-12-QR.pdf', 'OGM Ormanı – Etiket arka yüz (12 QR)')
    for pid, sp in pens:
        page_boxes(c)
        back_page(c, masks, kraft, pid, sp)
        draw_die(c)
        c.showPage()
    c.save()

    # 3) Çift taraflı baskı için sıralı: ön, arka, ön, arka… (24 sayfa)
    c = new('out/OGM-Ormani-Etiket-ON-ARKA-24-Sayfa.pdf', 'OGM Ormanı – Etiket ön/arka (12 adet)')
    for pid, sp in pens:
        page_boxes(c)
        front_page(c, masks, kraft)
        draw_die(c)
        c.showPage()
        page_boxes(c)
        back_page(c, masks, kraft, pid, sp)
        draw_die(c)
        c.showPage()
    c.save()
    print('ok')


if __name__ == '__main__':
    import os
    os.makedirs('out', exist_ok=True)
    build()


def strip_unused_fonts(path):
    """ReportLab'ın eklediği kullanılmayan Helvetica referansını kaldırır (yazılar eğri)."""
    from pypdf import PdfReader, PdfWriter
    r = PdfReader(path)
    w = PdfWriter(clone_from=r)
    import re
    from pypdf.generic import NameObject
    for p in w.pages:
        res = p['/Resources']
        if '/Font' in res:
            del res['/Font']
        data = p.get_contents().get_data()
        data = re.sub(rb'BT\s*/F1\s+[\d.]+\s+Tf\s+[\d.]+\s+TL\s*ET', b'', data)
        assert b'/F1' not in data
        from pypdf.generic import DecodedStreamObject
        st = DecodedStreamObject()
        st.set_data(data)
        st = st.flate_encode()
        p[NameObject('/Contents')] = w._add_object(st)
    w.compress_identical_objects()
    with open(path, 'wb') as f:
        w.write(f)


if __name__ == '__main__':
    import glob
    for f in glob.glob('out/*.pdf'):
        strip_unused_fonts(f)
