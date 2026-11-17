"""Orijinal Tohumix PDF'inden bıçak izini (Artios_Cut / Artios_Crease) çıkarır."""
import re
from pypdf import PdfReader

SRC = '/root/.claude/uploads/3e8f1084-1d86-5cb6-a53a-b4330781fa06/16ae089f-Tohumix-Tekli.pdf'
UU = 10.0  # /UserUnit


def die_ops():
    r = PdfReader(SRC)
    pg = r.pages[0]
    data = pg.get_contents().get_data().decode('latin1')
    start = data.index('/OC /MC1 BDC')
    body = data[start:].split('\n', 1)[1]
    body = body[body.index('/CS0 CS'):]          # baştaki dengesiz Q'yu at
    body = body[:body.rindex('EMC')]
    lines = [l.strip() for l in body.split('\n') if l.strip()]
    depth = sum(1 for l in lines if l == 'q') - sum(1 for l in lines if l == 'Q')
    lines += ['Q'] * depth
    return lines


def page_size_pt():
    r = PdfReader(SRC)
    mb = [float(x) for x in r.pages[0].mediabox]
    return mb[2] * UU, mb[3] * UU


if __name__ == '__main__':
    ops = die_ops()
    print(len(ops), 'ops; size', page_size_pt())
    print(sorted(set(re.sub(r'[-\d. ]+', '#', l) for l in ops)))
