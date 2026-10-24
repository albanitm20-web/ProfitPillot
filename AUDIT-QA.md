# Audit dan pengujian ProfitPilot V3

Tanggal: 24 Oktober 2026. Pekerjaan melanjutkan folder sumber ProfitPilot V2 yang sama. Salinan sumber V2 disimpan terpisah sebagai titik pemulihan sebelum perubahan; data browser pengguna tidak dihapus.

## Hasil audit V2

| Area | Kondisi awal | Keputusan |
|---|---|---|
| Kalkulator V1 | Harga, biaya, fee, kuantitas, margin, target harga, reset/salin bekerja | Dipertahankan dalam Shadow DOM |
| Buku pribadi/bisnis | Sudah terpisah; jenis usaha mengatur label/kategori | Dipertahankan |
| Transaksi | Tambah/edit/hapus lunak/pulihkan sudah ada | Diperkuat konfirmasi dan validasinya |
| Dashboard | Sudah berdasarkan transaksi, bukan simulasi | Tidak dibuat ulang |
| Stok | Rata-rata tertimbang, pembelian, penjualan, pemakaian sudah dihitung | Diperluas dengan retur penuh |
| Utang/piutang | Tempo, pinjaman, pelunasan sebagian sudah ada | Dipertahankan dan diuji ulang |
| Penyimpanan | localStorage `profitpilot.v2`, tanpa akun/database | Migrasi aman ke V3 + adapter Supabase opsional |
| Impor/ekspor | JSON tervalidasi dan CSV tersedia | Validasi cadangan diperketat; CSV mengikuti filter |
| Filter | Bulan, jenis, pencarian | Ditambah tanggal awal/akhir dan kategori |
| Pribadi | Belum ada anggaran/target/grafik kategori | Ditambah tanpa mengubah saldo |
| PWA/deployment | HTML lokal; belum ada hosting publik | Manifest, ikon, SW, konfigurasi Vercel/GitHub disiapkan |

Pengujian awal: 28 pemeriksaan V2 dan suite kalkulator V1 lulus sebelum perubahan. Dashboard V2 bukan angka palsu; kalkulator tetap simulasi yang sengaja tidak dimasukkan otomatis ke transaksi.

## Perbaikan dan fitur V3

- Migrasi menyalin `profitpilot.v2` ke `profitpilot.v3` hanya setelah validasi; nilai lama tidak dihapus. Data lokal tidak otomatis masuk ke akun.
- Menolak properti cadangan `opening` yang dapat disalahartikan sebagai event stok awal. ID, batas nilai agregat, anggaran, target, diskon, dan kemasan diperiksa.
- Diskon mengurangi pendapatan/piutang; kemasan, fee dan HPP dicatat terpisah. Regresi biaya langsung jasa dan pembelian persediaan tidak dihitung ganda.
- Retur penuh memiliki tanggal sendiri, membalik penjualan/kas, dan mengembalikan stok dengan HPP asal; biaya yang tidak kembali tetap diakui. Retur ganda, sebelum penjualan, atau transaksi tempo ditolak.
- Transfer rekening pribadi hanya catatan perpindahan dalam saldo gabungan; tidak menambah pemasukan/pengeluaran.
- Anggaran bulanan dan target tabungan dapat ditambah, diubah, dihapus. Grafik kategori sederhana memakai data pengeluaran asli.
- Filter tanggal/kategori dan ekspor CSV konsisten. JSON menyertakan anggaran dan target.
- Dialog konfirmasi dalam aplikasi menggantikan dialog browser untuk hapus, impor, retur dan pergantian data. Target sentuh dan tata letak V2 dipertahankan.
- Adapter Supabase untuk daftar, masuk, refresh token, keluar, membaca dan menyimpan per akun; status sinkronisasi dan konflik versi. Form login disembunyikan dengan penjelasan ketika konfigurasi belum tersedia.
- Cache sesi dan pratinjau impor/undo/formulir dibersihkan saat pergantian buku akun agar tidak tercampur.
- Build membatasi origin Supabase dan menolak kunci admin. Header Vercel, CSP, manifest dan ikon ditambahkan. Service worker tidak menyediakan cache/offline.

## Pengujian yang benar-benar dijalankan

| Pemeriksaan | Hasil dan cakupan |
|---|---|
| Regresi V2 | 28 tes lulus: stok, HPP, kas, utang, pemisahan buku, edit/backdate, soft delete/restore, CSV, validasi dan backup |
| Kalkulator V1 | Suite aritmetika, target harga, rugi, harga nol, invalid input, reset dan copy/fallback lulus |
| V3 core | 17 tes lulus: diskon/kemasan, tempo, retur lintas bulan, retur ganda/dependensi, jasa, transfer, rencana tabungan, migrasi, data berbahaya, nilai besar, data kosong, filter, ikon PWA |
| Adapter akun | 12 skenario dengan respons API simulasi: daftar/login/token refresh, baca/tulis, konflik, logout, tanpa konfigurasi, pemilihan cache menurut pengguna |
| Build | Kunci rahasia dan origin salah ditolak; build konfigurasi publik fiktif dan mode lokal berhasil; semua script hasil build dapat diparse |
| Database | 11 pemeriksaan pada PostgreSQL lokal PGlite 0.5.11: migrasi/rerun, simpan, konflik, RLS dua identitas, hanya akun sendiri, blokir tulis langsung, input buruk, identitas kosong, anonim, data A tetap utuh |
| Browser desktop | Tambah pemasukan Rp500.000, refresh, ubah Rp600.000, angka negatif ditolak, hapus/pulihkan, dialog konfirmasi, impor fiktif, saldo pribadi Rp1.400.000, laba penjualan Rp30.000, retur menghasilkan rugi Rp5.000, stok kembali 10 unit, edit tanggal retur |
| Browser pribadi | Anggaran Rp150.000 vs pengeluaran Rp100.000, target Rp1.000.000 dengan progres Rp200.000 bertahan setelah refresh; transfer Rp250.000 tidak mengubah saldo Rp1.400.000 |
| Browser ekspor | Filter kategori Makan dan tanggal menghasilkan tepat satu baris CSV, arus kas negatif -100000 terjaga |
| Browser mobile | Viewport 390 × 844, menu 168 × 48 px, tidak ada overflow horizontal; tambah transaksi transfer, navigasi, kalkulator reset dan status akun bekerja |
| Konsol browser | Tidak ada error pada sesi pemeriksaan akhir yang diperiksa |

Browser QA memakai origin `127.0.0.1:4174`, terpisah dari preview V2 `4173` dan file lokal pengguna. Data berlabel UJI adalah fiktif. Screenshot menampilkan data uji, bukan data bawaan aplikasi.

PostgreSQL lokal memakai stub `auth.uid()` dan role anon/authenticated untuk menguji SQL serta RLS sungguhan; tidak memakai Supabase Auth live. Jalankan ulang pengujian cloud setelah menghubungkan proyek.

## Belum diverifikasi atau belum tersedia

- Registrasi email, konfirmasi, login dan sinkronisasi pada proyek Supabase nyata; proyek, URL dan kunci publik belum dibuat/disediakan.
- Isolasi end-to-end lewat token dua akun Supabase nyata. Uji SQL lokal bukan bukti konfigurasi cloud sudah benar.
- Deployment GitHub/Vercel: repository remote, akses akun dan project belum terhubung. **Tidak ada URL publik**.
- Pemasangan PWA pada perangkat Android/iPhone fisik. Manifest/ikon disiapkan; browser dalam aplikasi tidak menyediakan pengujian pemasangan tersebut. Offline tidak didukung.
- Retur sebagian, retur pembelian/tempo, saldo per rekening, resep produksi, pajak, depresiasi, audit perubahan permanen, kerja bersama dan pemulihan password dari UI belum tersedia.
- Tidak ada penggabungan konflik otomatis. Cache akun bersifat sesi; perubahan yang belum tersinkron perlu dicadangkan sebelum menutup tab.
- Database memvalidasi bentuk data, akses dan versi; perhitungan keuangan/kronologi menggunakan core.js. Dokumen yang dirusak sendiri lewat API dapat ditolak saat dibaca aplikasi; ini bukan sistem pembukuan dengan validasi akuntansi independen di server.

## Cara mengulang

```sh
npm test
npm install --no-save --ignore-scripts @electric-sql/pglite@0.5.11
node check-db.cjs
node build.cjs
node preview.cjs
```

PGlite hanya alat pengujian, tidak diperlukan aplikasi produksi. Dalam lingkungan ini modul tersebut diunduh dari registry npm resmi dengan pemeriksaan integritas, dijalankan pada database memori, dan tidak menjadi dependensi frontend.

Langkah berikutnya ada di `SETUP.md`: akun layanan, SQL Supabase, repository kode, environment Vercel, SMTP, lalu uji dua akun dan perangkat fisik sebelum mengundang tester.
