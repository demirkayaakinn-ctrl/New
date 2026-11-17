// Demo QR etiketleri (A4, yazdırılabilir) üretir.
import QRCode from 'qrcode';
import fs from 'node:fs';
import { DEMO_PENS, SPECIES } from '../src/data.js';

const b64 = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
const ogm = b64('www/img/ogm-logo.png');
const tx = b64('www/img/tohumix-logo.png');
const labels = await Promise.all(DEMO_PENS.map(async ([id, sp]) => {
  const svg = await QRCode.toString(`TOHUMIX:${id}:${sp}`, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#1c4d29' } });
  return `<div class="lbl">
    <div class="qr">${svg}<div class="id">${id}</div></div>
    <div class="info">
      <div class="pill"><img src="${ogm}"><b>OGM ORMANI</b></div>
      <img class="tx" src="${tx}">
      <div class="sp">Tohum: <b>${SPECIES[sp].name}</b></div>
      <div class="cta">Kalemin bitince dik,<br><b>QR'ı okut, ormana katıl!</b></div>
    </div></div>`;
}));
const pages = [];
for (let i = 0; i < labels.length; i += 8) pages.push(`<section class="page">${labels.slice(i, i + 8).join('')}</section>`);
const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<link rel="stylesheet" href="../node_modules/@fontsource/poppins/600.css">
<link rel="stylesheet" href="../node_modules/@fontsource/poppins/800.css">
<style>
@page { size: A4; margin: 0; }
body { margin: 0; font-family: Poppins, sans-serif; color: #1c4d29; }
.page { width: 210mm; height: 297mm; padding: 12mm 10mm; box-sizing: border-box; display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 66mm; gap: 4mm; page-break-after: always; }
.lbl { border: 0.4mm dashed #9aa79a; border-radius: 5mm; display: flex; gap: 4mm; padding: 5mm; box-sizing: border-box; background: #f7f1e3; }
.qr { width: 40mm; flex: none; text-align: center; background: #fff; border-radius: 3mm; padding: 3mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; }
.qr svg { width: 100%; height: auto; display: block; }
.id { font-size: 8.5pt; font-weight: 800; margin-top: 2mm; letter-spacing: .3px; }
.info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
.pill { display: flex; align-items: center; gap: 2mm; background: #1c4d29; color: #fff; border-radius: 99px; padding: 1mm 3mm 1mm 1mm; }
.pill img { width: 8mm; height: 8mm; border-radius: 50%; background: #fff; }
.pill b { font-weight: 800; font-size: 9.5pt; white-space: nowrap; }
.tx { width: 100%; }
.sp { font-size: 9pt; font-weight: 600; background: #f4c534; border-radius: 99px; padding: 1mm 3mm; align-self: flex-start; }
.cta { font-size: 8.5pt; font-weight: 600; line-height: 1.35; }
.cta b { font-weight: 800; }
</style></head><body>${pages.join('')}</body></html>`;
fs.writeFileSync('print/etiketler.html', html);
console.log('ok', DEMO_PENS.length);
