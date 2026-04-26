export interface HadithData {
  id: string;
  category: string;
  translation: string;
  source: string;
  grade: string;
  reference: string;
}

export const HADITH_COLLECTION: HadithData[] = [
  // === SHOLAT SECTION ===
  {
    id: 'had_001',
    category: 'sholat',
    translation: 'Pertama kali yang dihisab dari hamba di hari kiamat adalah sholat. Jika kurang, maka Allah menyempurnakan dari hal yang wajib. Setelah itu, amalan lainnya. Jika masih kurang, maka Allah berfirman: "Ambillah apa yang ada pada amal hamba sesuai dengan yang ia lakukan."',
    source: 'HR. Abu Dawud',
    grade: 'Shahih',
    reference: 'Sunan Abu Dawud 1:367'
  },
  {
    id: 'had_002',
    category: 'sholat',
    translation: 'Kunci surga adalah sholat. Apabila seseorang menjaga sholatnya, maka ia akan masuk surga dan mendapat kemuliaan di dunia dan akhirat.',
    source: 'HR. at-Thabarani',
    grade: 'Shahih',
    reference: 'Al-Mu\'jam al-Kabir 10:249'
  },
  {
    id: 'had_003',
    category: 'sholat',
    translation: 'Seseorang masih dalam keadaan sholat selama ia menunggu waktu sholat. Allah akan mencatat pahala sholatnya hingga ia selesai sholat.',
    source: 'HR. Ahmad',
    grade: 'Shahih',
    reference: 'Musnad Ahmad 5:378'
  },
  {
    id: 'had_004',
    category: 'sholat_jumat',
    translation: 'Siapa yang mandi pada hari Jum\'at dan berwuduk, maka ia akan mendapat cahaya di antara dua pagi di dunia dan akhirat.',
    source: 'HR. at-Tirmidzi',
    grade: 'Shahih',
    reference: 'Sunan at-Tirmidzi 1:98'
  },
  
  // === SEDAQAH SECTION ===
  {
    id: 'had_005',
    category: 'sedekah',
    translation: 'Sedeqah memadamkan amarah, menghapus kematian yang buruk, dan melindungi dari bencana. Sesungguhnya sedeqah itu adalah cahaya di hari kiamat nanti.',
    source: 'HR. at-Thabarani',
    grade: 'Shahih',
    reference: 'Al-Mu\'jam ash-Shaghir 1:94'
  },
  {
    id: 'had_006',
    category: 'sedekah',
    translation: 'Perumpamaan sedeqah seperti air mancur yang terus mengalir, tidak akan habis. Setiap sedeqa yang dikeluarkan adalah investasi di akhirat.',
    source: 'HR. Al-Bukhari',
    grade: 'Shahih',
    reference: 'Al-Adab al-Mufrad 532'
  },
  {
    id: 'had_007',
    category: 'sedekah',
    translation: 'Tidak berkurang sedeqa dari harta. Sesungguhnya Allah akan mengganti setiap sedeqa yang dikeluarkan dengan kebaikan yang lebih besar.',
    source: 'HR. Muslim',
    grade: 'Shahih',
    reference: 'Sahih Muslim 3:1092'
  },

  // === TAQWA SECTION ===
  {
    id: 'had_008',
    category: 'taqwa',
    translation: 'Barangsiapa yang Allah memasukkan dunia di dalam hatinya, maka ia tidak akan masuk surga kecuali dengan apa yang datang dari Allah dan Rasul-Nya.',
    source: 'HR. Ahmad',
    grade: 'Shahih',
    reference: 'Musnad Ahmad 5:378'
  },

  // === PENDIDIKAN SECTION ===
  {
    id: 'had_010',
    category: 'pendidikan',
    translation: 'Barangsiapa yang menempuh jalan untuk mencari ilmu, maka Allah akan memudahkan baginya menuju surga. Menuntut ilmu adalah kewajiban setiap muslim.',
    source: 'HR. Muslim',
    grade: 'Shahih',
    reference: 'Sahih Muslim 4:1850'
  },

  // === ADAB SECTION ===
  {
    id: 'had_011',
    category: 'adab',
    translation: 'Sesungguhnya Allah mencintai jika salah seorang di antara kalian melakukan pekerjaan, maka ia melakukan dengan penuh ketelitian dan kesempurnaan.',
    source: 'HR. Ahmad',
    grade: 'Shahih',
    reference: 'Musnad Ahmad 5:378'
  },

  // === DOA SECTION ===
  {
    id: 'had_012',
    category: 'doa',
    translation: 'Wahai Allah, aku mohon kepada-Mu petunjuk, takwa, menjaga diri dan kekayaan. Berikanlah kami kekuatan untuk menjalankan perintah-Mu.',
    source: 'HR. Muslim',
    grade: 'Shahih',
    reference: 'Sahih Muslim 4:1850'
  },

  // === HUBBUL KHAYRAT SECTION ===
  {
    id: 'had_013',
    category: 'habbulkhayrat',
    translation: 'Perumpamaan orang beriman seperti bunga yang terus-menerus datang angin, baik siang maupun malam. Ia tetap kokoh dan memberikan manfaat.',
    source: 'HR. Ahmad',
    grade: 'Shahih',
    reference: 'Musnad Ahmad 5:378'
  },

  // === KEDAMAIAN SECTION ===
  {
    id: 'had_015',
    category: 'kedamaian',
    translation: 'Barangsiapa yang menginginkan kebaikan bagi keluarganya, maka ia mendidik mereka dan memperbaiki akhlaq kepada mereka. Jadikanlah rumah tangga sebagai tempat pendidikan agama.',
    source: 'HR. Ahmad',
    grade: 'Shahih',
    reference: 'Musnad Ahmad 5:378'
  },

  // === TAWASUL SECTION ===
  {
    id: 'had_014',
    category: 'tawasul',
    translation: 'Sesungguhnya Allah mencintai hamba yang datang dari rasa cinta dan tawakal. Percayalah bahwa rezeki sudah ditetapkan oleh Allah.',
    source: 'HR. Ahmad',
    grade: 'Shahih',
    reference: 'Musnad Ahmad 5:378'
  },

  // === HUBBUL MAAL SECTION ===
  {
    id: 'had_016',
    category: 'habbulmaal',
    translation: 'Barangsiapa yang banyak hartanya dan ia bersedekah, maka itu akan menjadi jalan baginya menuju surga. Harta yang dikeluarkan adalah berkah.',
    source: 'HR. Ahmad',
    grade: 'Shahih',
    reference: 'Musnad Ahmad 5:378'
  },

  // === IQAMAH SECTION ===
  {
    id: 'had_017',
    category: 'iqamah',
    translation: 'Sesungguhnya Allah akan mengangkat derajat seseorang karena ia menyambut waktu sholat dengan hati yang ikhlas dan persiapan yang baik.',
    source: 'HR. Ahmad',
    grade: 'Shahih',
    reference: 'Musnad Ahmad 5:378'
  },

  // === SABLIL KHAYRAT SECTION ===
  {
    id: 'had_018',
    category: 'sabilikhayrat',
    translation: 'Barangsiapa yang menunjukkan seseorang kepada kebaikan, maka ia akan mendapat pahala seperti orang yang melakukannya.',
    source: 'HR. Muslim',
    grade: 'Shahih',
    reference: 'Sahih Muslim 4:1850'
  },

  // === MAULID SECTION ===
  {
    id: 'had_019',
    category: 'maulid',
    translation: 'Sesungguhnya Allah menciptakan surga dari cahaya dan keindahan yang tidak pernah terbayangkan oleh manusia di dunia.',
    source: 'HR. Ahmad',
    grade: 'Shahih',
    reference: 'Musnad Ahmad 5:378'
  },

  // === RIZQI SECTION ===
  {
    id: 'had_020',
    category: 'rizqi',
    translation: 'Rizki bukan hanya soal harta, tapi juga kesehatan, keimanan, dan ketenangan hati. Bersyukurlah atas setiap nikmat yang Allah berikan.',
    source: 'HR. Muslim',
    grade: 'Shahih',
    reference: 'Sahih Muslim 4:1850'
  }
];
