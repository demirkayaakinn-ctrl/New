# OGM Ormanı · Tohumix kalem etiketi (baskı dosyaları)

`out/` klasörü:
- **OGM-Ormani-Etiket-ON-YUZ.pdf**: ön yüz (OGM logosu + sincap). Tek sayfa, 12 etikette ortak.
- **OGM-Ormani-Etiket-ARKA-YUZ-12-QR.pdf**: arka yüz. 12 sayfa, her sayfada farklı QR (TX26-004181 … 004192).
- **OGM-Ormani-Etiket-ON-ARKA-24-Sayfa.pdf**: çift taraflı baskı için ön ve arka sırayla (ön, arka, ön, arka…).

Teknik özellikler:
- **Katmanlar:** `Baskı` (tüm grafik), `Kesim` (dış kontur + delik + güneş kesimi), `Kırım` (kırım çizgileri). Montajda katmanlar ayrı ayrı açılıp kapatılabilir.
- **Bıçak izi:** Orijinal `Tohumix-Tekli.pdf` dosyasından birebir alındı. `Artios_Cut` (kesim) ve `Artios_Crease` (kırım) spot renkleri overprint olarak ayarlı, çizgi kalınlığı 1 pt.
- **Kontur:** Baskı katmanında kesime yakın çerçeve, halka ya da çizgi yok.
- **Ölçüler:** Sayfa 45,3 × 89,5 mm. Kesim (TrimBox) 38,7 × 82,7 mm. Zemin sayfa kenarına kadar uzanıyor, yani her yönde en az 3,3 mm taşma var.
- **Renk:** Tamamı CMYK. Görseller CMYK raster (800 dpi). Yazılar ve QR vektörel, yazılar eğriye çevrili (font gömülü değil).
- **Kraft doku:** Orijinal dosyadaki CMYK kraft görseli kullanıldı.

Yeniden üretmek için: `python3 make_labels.py` (gereken paketler: reportlab, pypdf, fonttools, qrcode, scipy, numpy, pillow).
