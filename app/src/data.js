// Demo verileri: iller, bölgeler, tohum türleri ve Türkiye geneli istatistikler.
// NOT: Ülke geneli sayılar sunum amaçlı temsili verilerdir.

export const REGIONS = {
  MAR: 'Marmara',
  EGE: 'Ege',
  AKD: 'Akdeniz',
  IC: 'İç Anadolu',
  KAR: 'Karadeniz',
  DOG: 'Doğu Anadolu',
  GD: 'Güneydoğu Anadolu',
};

// [ad, enlem, boylam, bölge, ağırlık]
export const PROVINCES = [
  ['Adana', 37.0, 35.32, 'AKD', 7], ['Adıyaman', 37.76, 38.28, 'GD', 3], ['Afyonkarahisar', 38.76, 30.54, 'EGE', 4],
  ['Ağrı', 39.72, 43.05, 'DOG', 2], ['Amasya', 40.65, 35.83, 'KAR', 3], ['Ankara', 39.93, 32.86, 'IC', 14],
  ['Antalya', 36.89, 30.71, 'AKD', 10], ['Artvin', 41.18, 41.82, 'KAR', 3], ['Aydın', 37.85, 27.85, 'EGE', 5],
  ['Balıkesir', 39.65, 27.88, 'MAR', 6], ['Bilecik', 40.14, 29.98, 'MAR', 2], ['Bingöl', 38.88, 40.5, 'DOG', 2],
  ['Bitlis', 38.4, 42.11, 'DOG', 2], ['Bolu', 40.74, 31.61, 'KAR', 5], ['Burdur', 37.72, 30.29, 'AKD', 3],
  ['Bursa', 40.19, 29.06, 'MAR', 9], ['Çanakkale', 40.15, 26.41, 'MAR', 5], ['Çankırı', 40.6, 33.62, 'IC', 2],
  ['Çorum', 40.55, 34.95, 'KAR', 3], ['Denizli', 37.78, 29.09, 'EGE', 5], ['Diyarbakır', 37.91, 40.24, 'GD', 5],
  ['Edirne', 41.68, 26.56, 'MAR', 3], ['Elazığ', 38.68, 39.22, 'DOG', 3], ['Erzincan', 39.75, 39.49, 'DOG', 2],
  ['Erzurum', 39.9, 41.27, 'DOG', 4], ['Eskişehir', 39.78, 30.52, 'IC', 5], ['Gaziantep', 37.07, 37.38, 'GD', 6],
  ['Giresun', 40.91, 38.39, 'KAR', 3], ['Gümüşhane', 40.46, 39.48, 'KAR', 2], ['Hakkari', 37.58, 43.74, 'DOG', 1],
  ['Hatay', 36.2, 36.16, 'AKD', 5], ['Isparta', 37.76, 30.55, 'AKD', 4], ['Mersin', 36.81, 34.64, 'AKD', 7],
  ['İstanbul', 41.01, 28.98, 'MAR', 16], ['İzmir', 38.42, 27.14, 'EGE', 11], ['Kars', 40.6, 43.1, 'DOG', 2],
  ['Kastamonu', 41.38, 33.78, 'KAR', 5], ['Kayseri', 38.73, 35.48, 'IC', 6], ['Kırklareli', 41.73, 27.22, 'MAR', 3],
  ['Kırşehir', 39.15, 34.16, 'IC', 2], ['Kocaeli', 40.77, 29.92, 'MAR', 6], ['Konya', 37.87, 32.48, 'IC', 9],
  ['Kütahya', 39.42, 29.98, 'EGE', 4], ['Malatya', 38.35, 38.31, 'DOG', 4], ['Manisa', 38.61, 27.43, 'EGE', 6],
  ['Kahramanmaraş', 37.58, 36.94, 'AKD', 5], ['Mardin', 37.31, 40.74, 'GD', 3], ['Muğla', 37.22, 28.36, 'EGE', 6],
  ['Muş', 38.75, 41.5, 'DOG', 2], ['Nevşehir', 38.62, 34.71, 'IC', 2], ['Niğde', 37.97, 34.68, 'IC', 2],
  ['Ordu', 40.98, 37.88, 'KAR', 4], ['Rize', 41.03, 40.52, 'KAR', 2], ['Sakarya', 40.78, 30.4, 'MAR', 5],
  ['Samsun', 41.29, 36.33, 'KAR', 6], ['Siirt', 37.93, 41.94, 'GD', 2], ['Sinop', 42.03, 35.15, 'KAR', 2],
  ['Sivas', 39.75, 37.02, 'IC', 4], ['Tekirdağ', 40.98, 27.51, 'MAR', 5], ['Tokat', 40.31, 36.55, 'KAR', 3],
  ['Trabzon', 41.0, 39.72, 'KAR', 5], ['Tunceli', 39.11, 39.55, 'DOG', 1], ['Şanlıurfa', 37.16, 38.79, 'GD', 6],
  ['Uşak', 38.68, 29.41, 'EGE', 2], ['Van', 38.49, 43.38, 'DOG', 4], ['Yozgat', 39.82, 34.81, 'IC', 3],
  ['Zonguldak', 41.45, 31.79, 'KAR', 4], ['Aksaray', 38.37, 34.03, 'IC', 2], ['Bayburt', 40.26, 40.23, 'KAR', 1],
  ['Karaman', 37.18, 33.22, 'IC', 2], ['Kırıkkale', 39.85, 33.51, 'IC', 2], ['Batman', 37.88, 41.13, 'GD', 3],
  ['Şırnak', 37.52, 42.46, 'GD', 2], ['Bartın', 41.63, 32.34, 'KAR', 2], ['Ardahan', 41.11, 42.7, 'DOG', 1],
  ['Iğdır', 39.92, 44.04, 'DOG', 1], ['Yalova', 40.65, 29.27, 'MAR', 2], ['Karabük', 41.2, 32.62, 'KAR', 2],
  ['Kilis', 36.72, 37.12, 'GD', 1], ['Osmaniye', 37.07, 36.25, 'AKD', 2], ['Düzce', 40.84, 31.16, 'KAR', 2],
];

export const SPECIES = {
  KARACAM: {
    key: 'KARACAM',
    name: 'Karaçam',
    latin: 'Pinus nigra',
    color: '#2f6b3a',
    regions: ['IC', 'MAR', 'EGE', 'AKD', 'KAR'],
    altitude: '400 – 1.800 m',
    germination: '3 – 5 hafta',
    season: 'Sonbahar sonu – ilkbahar başı',
    desc: "Anadolu'nun bozkırlarından dağlarına uzanan dayanıklı çam. Kuraklığa ve soğuğa karşı çok güçlüdür, erozyonu önler.",
    share: 38,
  },
  SARICAM: {
    key: 'SARICAM',
    name: 'Sarıçam',
    latin: 'Pinus sylvestris',
    color: '#c47a2c',
    regions: ['KAR', 'DOG', 'IC'],
    altitude: '1.000 – 2.700 m',
    germination: '2 – 4 hafta',
    season: 'İlkbahar başı',
    desc: 'Kuzeyin ve yüksek dağların çamı. Turuncu kabuğuyla tanınır, sert kışlara çok dayanıklıdır.',
    share: 22,
  },
  KIZILCAM: {
    key: 'KIZILCAM',
    name: 'Kızılçam',
    latin: 'Pinus brutia',
    color: '#a8432a',
    regions: ['AKD', 'EGE', 'MAR', 'GD'],
    altitude: '0 – 1.200 m',
    germination: '3 – 6 hafta',
    season: 'Sonbahar – kış',
    desc: 'Akdeniz ve Ege kıyılarının simgesi. Sıcağa ve kuraklığa dayanıklıdır, yangın sonrası hızla yenilenir.',
    share: 31,
  },
  HALEP: {
    key: 'HALEP',
    name: 'Halep Çamı',
    latin: 'Pinus halepensis',
    color: '#7d8f2a',
    regions: ['GD', 'AKD'],
    altitude: '0 – 800 m',
    germination: '3 – 5 hafta',
    season: 'Sonbahar – kış',
    desc: "Kurak ve sıcak bölgelerin öncü ağacı. Güneydoğu Anadolu'daki ağaçlandırmalarda kullanılır.",
    share: 9,
  },
};

// Her bölge için en iyi sonuç veren tür
export const REGION_BEST = {
  MAR: 'KARACAM', EGE: 'KIZILCAM', AKD: 'KIZILCAM', IC: 'KARACAM',
  KAR: 'SARICAM', DOG: 'SARICAM', GD: 'HALEP',
};

export const STEPS = [
  { t: 'Yerini seç', d: 'OGM ekibinin gösterdiği alanda güneş alan, su birikmeyen bir nokta seç.' },
  { t: 'Toprağı hazırla', d: 'Otları temizle, toprağı 10–15 cm gevşet.' },
  { t: 'Kalemi göm', d: 'Kalemin kalan gövdesini 2–3 cm derinliğe yerleştir, üstünü ince toprakla ört.' },
  { t: 'Can suyunu ver', d: 'Bol su ver. Kraft gövde suyla buluşunca çözülür, tohumlar serbest kalır.' },
  { t: 'QR ile kaydet', d: 'Fotoğrafını çek; konumun OGM Ormanı haritasına işlensin.' },
];

export const STAGES = [
  { key: 'dikildi', name: 'Dikildi', day: 0, tip: 'Tohumlar toprakla buluştu. Toprağı nemli tut.' },
  { key: 'cimlendi', name: 'Çimlendi', day: 21, tip: 'İlk kökler oluştu. Toprağın kurumasına izin verme.' },
  { key: 'filiz', name: 'Filiz', day: 35, tip: 'Filiz topraktan çıktı! Çevresindeki otları temizle.' },
  { key: 'fidan', name: 'Fidan', day: 180, tip: 'İlk iğne yaprak demetleri belirdi. Yaz kuraklığında sula.' },
  { key: 'agac', name: 'Genç Ağaç', day: 365, tip: 'Bir yaşında! Artık ormanın bir parçası.' },
];

export const NATIONAL = {
  trees: 1127760,
  schools: 14097,
  students: 586214,
  teachers: 31560,
  provinces: 81,
  target: 2000000,
};

// Demo etiketlerinde basılan kalemler
export const DEMO_PENS = [
  ['TX26-004181', 'KARACAM'], ['TX26-004182', 'KARACAM'], ['TX26-004183', 'KARACAM'], ['TX26-004184', 'KARACAM'],
  ['TX26-004185', 'SARICAM'], ['TX26-004186', 'SARICAM'], ['TX26-004187', 'KARACAM'], ['TX26-004188', 'KARACAM'],
  ['TX26-004189', 'KIZILCAM'], ['TX26-004190', 'HALEP'], ['TX26-004191', 'KARACAM'], ['TX26-004192', 'SARICAM'],
];

// OGM Genel Müdürlüğü (Ankara) – konum alınamazsa kullanılacak yaklaşık nokta
export const FALLBACK_LOC = { lat: 39.9445, lng: 32.8063, acc: null, approx: true };
