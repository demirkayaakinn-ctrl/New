from reportlab.pdfgen import canvas
from reportlab.lib.colors import CMYKColorSep
from die import die_ops, page_size_pt, UU

CUT = CMYKColorSep(0, 0, 0, 1, spotName='Artios_Cut', density=1)
CREASE = CMYKColorSep(0, 1, 1, 0, spotName='Artios_Crease', density=1)


def draw_die(c, overprint=True):
    c.saveState()
    if overprint:
        c.setStrokeOverprint(True)
        c.setOverprintMask(True)
    c._code.append(f'{UU:g} 0 0 {UU:g} 0 0 cm')
    for l in die_ops():
        if l.startswith('/CS0'):
            c.setStrokeColor(CUT)
        elif l.startswith('/CS1'):
            c.setStrokeColor(CREASE)
        elif l.endswith(' gs'):
            continue
        else:
            c._code.append(l)
    c.restoreState()


if __name__ == '__main__':
    W, H = page_size_pt()
    c = canvas.Canvas('/tmp/claude-0/-home-user-New/3e8f1084-1d86-5cb6-a53a-b4330781fa06/scratchpad/dieonly.pdf', pagesize=(W, H))
    draw_die(c, overprint=False)
    c.showPage(); c.save()
