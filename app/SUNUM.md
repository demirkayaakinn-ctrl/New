# OGM Ormanı · Tohumix Demo

## Telefona kurulum (Android)
1. `OGM-Ormani-Demo.apk` dosyasını telefona gönderin (WhatsApp, e-posta, Drive ya da USB).
2. Dosyaya dokunun. "Bilinmeyen kaynaklardan yüklemeye izin ver" uyarısı çıkarsa izin verin.
3. **OGM Ormanı** uygulamasını açın. İlk QR okutmada **kamera**, ilk fotoğrafta **konum** iznine "İzin ver" deyin.

Sunumdan önce bir deneme dikimi yapın, sonra **Profil → Demo verilerini sıfırla** ile temiz başlayın.

## Sunum akışı (~2 dakika)
1. **Ana sayfa:** Sincap karşılıyor; Türkiye geneli sayaç (1.127.760 / hedef 2.000.000).
2. **Ortadaki sarı QR butonu:** Basılı etiketteki QR'ı okutun. Kalem ve tohum tanınır.
3. **Giriş:** Öğretmen / Öğrenci (rumuz, sınıf kodu, öğrenci no) / Veli sekmelerini gösterin. Öğretmen olarak girin.
4. **Tohum kartı:** "Karaçam", yetiştiği bölgeler, 5 adımda dikim talimatı. → **Diktim! Fotoğrafını çek**
5. **Fotoğraf + konum:** Fotoğraf çekilir, GPS alınır, il ve bölge otomatik bulunur. "Bu tür bölgeye uygun ✓".
   Öğretmen girişinde öğrencinin rumuzunu ekleyin (ör. Yıldız-07). → **OGM Ormanı'na işle**
6. **Tebrikler ekranı:** Sayaç 1 artar. → **Haritada gör**: harita Türkiye'den dikim noktasına uçar.
7. **Fidanlarım → fidan:** Gelişim zaman çizelgesi. **"Zamanı ileri sar"** ile Çimlendi → Filiz → Fidan → Genç Ağaç aşamalarını gösterin.
8. **Paylaş:** Sosyal medya için hazır görsel kartı.
9. Öğretmen: **"Sıradaki öğrencinin kalemini okut"**. Bir sınıfın tüm kalemleri tek telefondan kaydedilebilir.

## İpuçları
- QR etiketi yoksa tarama ekranındaki **"Demo kalem kullan"** düğmesiyle akış yine ilerler.
- Aynı QR ikinci kez okutulursa uygulama o fidanın takip sayfasını açar (QR'ı çeken kişi takip eder).
- Kapalı alanda GPS zayıfsa ağ konumu kullanılır. O da yoksa Ankara (OGM) yaklaşık konumu kullanılır.
- Harita altlığı internet ister. İnternet yoksa Türkiye sınırı ve dikim noktaları yine görünür.
- Ülke geneli sayılar temsili demo verisidir. Telefonda yapılan dikimler gerçek konumla işlenir.

## Geliştirici notları
- Web uygulaması: `src/` (vanilla JS + Leaflet + jsQR), `npm run build` ile `www/` klasörüne derlenir.
- Android: Capacitor 7. Komutlar: `npm run sync`, ardından `cd android && ./gradlew assembleDebug`.
- QR etiketleri: `node scripts/labels.mjs` ile `print/etiketler.html` üretilir. QR formatı: `TOHUMIX:<KALEM-KODU>:<TÜR>`.
- Gerçek sürümde aynı kod web'de (uygulama indirmeden) çalışacak. `localStorage` yerine bir sunucu/API bağlanacak.
