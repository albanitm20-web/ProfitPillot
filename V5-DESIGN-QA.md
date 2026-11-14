# ProfitPilot V5 — audit, desain, dan pengujian

Tanggal pemeriksaan: 14 November 2026. Branch: `feature/profitpilot-v5`.

## Dasar implementasi

Repository yang sama: albanitm20-web/ProfitPillot. V5 bertolak dari `feature/v4-1-personalization` (`26d98a81329358c63ec9be8a5aa6596cf6d1acda`), dua commit di atas main (`950dfaf0b101884dff718d7876f085a89b6a7d73`). Production dan cabang lama dipertahankan. Tidak membuat proyek GitHub, Vercel, atau Supabase baru.

Arsitektur aktual berupa HTML/CSS/JavaScript tanpa framework produksi. `build.cjs` menggabungkan aplikasi, modul keuangan, autentikasi, dan kalkulator Shadow DOM. Mesin ledger berada di `core.js`; interaksi lama di `app.js`/`v3.js`; Supabase di `cloud.js`; Google PKCE di `oauth.js`. Sumber V4.1 sudah memiliki tema dan OAuth, sehingga V5 melanjutkannya.

Temuan awal: urutan saldo belum konsisten, ringkasan anggaran/target terpisah dari dashboard, tampilan desktop belum memiliki navigasi samping yang lengkap, validasi kurang mengarahkan fokus, formulir belum melindungi isian saat ditutup, dan README masih menyatakan belum ada layanan publik. Service worker hanya untuk instalasi, bukan cache offline.

`core.js`, `app.js`, `v1.html`, `oauth.js`, dan `supabase.sql` tetap sama dengan baseline. Tidak ada migrasi data baru. Mode lokal tetap memakai `profitpilot.v3`; preferensi memakai `profitpilot.appearance.v1`; sesi/cache akun tetap terpisah menurut ID pengguna.

## Perubahan produk

- Sidebar desktop yang dapat diringkas; navigasi bawah mobile; URL hanya menyimpan pilihan buku/halaman yang divalidasi.
- Dashboard pribadi menonjolkan saldo, pemasukan, pengeluaran, dan selisih. Grafik kas, kategori, anggaran (termasuk nominal lebih batas), dan target berasal dari data ledger.
- Dashboard bisnis menonjolkan laba, penjualan, biaya, dan kas; rincian laba rugi, stok menipis, serta tagihan terbuka.
- Grafik membedakan kas dari laba. Periode bulanan memakai kelompok tanggal; semua waktu menampilkan paling banyak 12 bulan terakhir. Tabel angka tersedia melalui disclosure.
- Form tetap mengikuti profil toko, kuliner, jasa, atau umum. Input angka salah memperoleh fokus dan penanda kesalahan. Pratinjau penjualan memperhitungkan diskon. Konfirmasi melindungi isian yang belum tersimpan.
- Semua tema juga diteruskan ke kalkulator lama. Rumus kalkulator tidak berubah.
- Dialog akun dirapikan. Pemulihan password ditambahkan dengan PKCE terpisah, satu kali pakai, terikat origin/tab, dan masa lokal 10 menit.
- Pemberitahuan offline menjelaskan batas penyimpanan lokal dan sinkronisasi akun.

## Sistem desain

Default: Editorial Fintech, Emerald, mengikuti sistem. Alternatif Productivity Finance dapat dipilih di Tampilan, bersama kepadatan dan pengurangan animasi.

| Palet | Aksen terang | Aksen gelap |
|---|---|---|
| Emerald | #157c65 | #82dfba |
| Ocean | #3567c8 | #9dc9ff |
| Purple | #7256c8 | #d1b3ff |
| Rose | #b2426a | #ffb0d0 |
| Sunset | #a95318 | #ffc08b |

Token semantik mencakup canvas, surface, teks primer/sekunder, border, fokus, success, danger, warning, chart, dan on-accent. Spacing 4–48 px; radius 6–24 px plus pill; gerak 120/180/260 ms. Teks memakai Inter bila tersedia, lalu Segoe UI/Arial sistem tanpa unduhan font eksternal. Angka memakai tabular numerals. Preferensi OS reduced motion selalu dihormati. Pilihan lama dinormalisasi dan dipertahankan saat format preferensi diperluas.

## Bug yang diperbaiki

1. Angka rupiah terpotong/terbelah pada kartu sempit: ukuran mengikuti lebar kartu.
2. Input periode dan tombol tambah berhimpitan di mobile: susunan membungkus dan tombol penuh.
3. Kontras label kategori/navigasi/kalkulator serta subteks opsi aktif: token disesuaikan.
4. Fokus Tab keluar dari dialog: pembungkusan fokus eksplisit; Escape dan pengembalian fokus diuji.
5. Reset target menyisakan ID target sebelumnya: ID dikosongkan setelah reset.
6. Total penjualan pada formulir belum mencerminkan diskon: label dan pratinjau diperbarui.
7. Header/mode dan tombol tambah meluber pada pembesaran 200%: flex reflow diperbaiki.

## Pengujian dan bukti

Jalankan `npm test`, `node check-db.cjs` (PGlite diperlukan), serta `npm run test:ui:all` setelah build lokal. CI memasang Chrome dan menyimpan screenshot/JSON sebagai artifact.

- Kalkulator V1: aritmetika, pembulatan harga target, rugi, harga nol, input salah, reset, salin/fallback.
- 28 skenario V2: HPP rata-rata, kas, utang/piutang, pelunasan, stok/backdate, edit/hapus/pulihkan, impor/cadangan, parser dan CSV.
- 17 skenario V3: diskon, retur penuh yang didukung, pemisahan buku, budget/target, migrasi dan batas angka.
- 12 skenario adapter cloud menggunakan respons simulasi; V4/V4.1/V5 menguji selector, tema, penyimpanan tertolak, PKCE dan pemisahan buku.
- PGlite lokal: migrasi dapat diulang, hak akses dua pengguna, anon ditolak, direct write ditolak, konflik revisi, input rusak ditolak. Ini bukan bukti konfigurasi database live.
- Playwright: viewport 360×800, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1440×900, 1920×1080; sepuluh kombinasi warna/terang-gelap; perubahan mode sistem; preferensi setelah refresh; transaksi/validasi; pencarian; profil bisnis; offline banner.
- Axe memeriksa 120 kombinasi halaman/dialog/tema di suite tambahan. Audit otomatis tidak menggantikan pengujian pembaca layar manual.
- Simulasi browser akun: login email, simpan/refresh, logout/ganti akun, gagal simpan, konflik, Google dinonaktifkan, permintaan pemulihan, callback dan penggantian password. Seluruh akun dan respons dalam pengujian ini fiktif.
- Screenshot before berasal dari build V4.1 dan after dari V5 dengan fixture yang sama. Tidak memakai gambar AI atau data pengguna. JSON hasil aktual menjadi bukti pass/fail; jangan menyimpulkan keberhasilan hanya dari daftar cakupan ini.

## Akun dan tindakan eksternal

Pemeriksaan read-only endpoint Auth publik pada 14 November 2026 memberi HTTP 200, email enabled dan Google enabled. Ini memperbarui catatan historis V41-SETUP, tetapi login Google end-to-end belum dibuktikan. Tidak ada kredensial akun pengguna yang diminta/disalin dan tidak ada penulisan ke buku live.

Setelah URL Preview final tersedia, pemilik perlu memeriksa dua redirect EXACT pada Supabase Authentication > URL Configuration: `<origin-preview>/?oauth=google` dan `<origin-preview>/?recovery=password`. Pertahankan Production Site URL. Jangan memasukkan secret ke source atau chat. Konfigurasi provider Google sudah aktif; jangan membuat ulang client bila tidak diperlukan. Uji consent/cancel serta pemulihan dengan akun uji yang dikendalikan pemilik. Tautan pemulihan harus dibuka di tab asal (PKCE sessionStorage); tab/perangkat lain memerlukan permintaan baru. Referensi resmi: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail

## Batas yang belum selesai / belum dibuktikan

- Login nyata Google/email, kiriman email pemulihan, sinkronisasi live dua perangkat, dan expired-session live belum diuji tanpa akun uji yang dikendalikan pemilik.
- Belum diuji pada Safari/iOS/Android fisik atau pembaca layar. Ukuran mobile adalah emulasi viewport Chrome.
- Ukuran build dan timing navigasi adalah pengukuran lokal, bukan Core Web Vitals p75 atau Lighthouse jaringan mobile.
- Tidak ada cache offline untuk membuka ulang aplikasi tanpa jaringan. Catatan akun yang belum tersinkron dapat hilang bila tab ditutup; ekspor cadangan sebelum menutup jika gagal sinkron.
- Konflik cloud tetap memerlukan pilihan pengguna; tidak ada merge otomatis. Tidak mengubah schema atau sistem audit ledger.
- Retur sebagian, retur tempo/pembelian, multi-rekening, pajak, resep produksi otomatis, dan pembukuan resmi tetap di luar fungsi versi ini.
- Production belum dirilis. Preview harus ditinjau dan autentikasi live diverifikasi sebelum keputusan rilis.

## Uji dengan tiga calon pembeli

Berikan Preview dan tautan versi sebelumnya. Minta setiap peserta memakai data fiktif pada browsernya sendiri. Catat apakah mereka dapat (1) memasukkan pemasukan/pengeluaran, (2) menentukan anggaran, (3) memilih jenis usaha dan mencatat penjualan/biaya, (4) menjelaskan beda kas dan laba, (5) menemukan kalkulator serta ekspor cadangan. Minta mereka menandai label membingungkan dan jumlah langkah yang terasa berlebih. Jangan meminta mereka mengirim catatan keuangan nyata untuk evaluasi desain.

Prioritas berikutnya: verifikasi login dan sinkronisasi live dengan dua akun uji, uji HP fisik dan pembaca layar, lalu evaluasi tiga pembeli sebelum Production.

## Hasil eksekusi terakhir

Suite akhir lulus: 25 skenario UI utama, 9 skenario tambahan, 120 audit axe dengan 0 pelanggaran yang dilaporkan. Bundle HTML lokal 212.473 byte; satu sampel Chrome lokal mencatat DOMContentLoaded 46,4 ms dan load 49,8 ms. Angka ini tidak dapat dipakai sebagai klaim kecepatan pengguna nyata. JSON dan screenshot lengkap disertakan pada paket bukti lokal/CI; baseline hanya dijalankan bila folder build V4.1 tersedia.
