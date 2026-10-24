# ProfitPilot V3

Kelanjutan langsung ProfitPilot V2. Antarmuka HTML/CSS/JavaScript dan kalkulator V1 tetap dipakai. Tidak ada data contoh yang dimasukkan otomatis.

Status: MVP lokal telah diuji. Integrasi Supabase disiapkan tetapi belum dihubungkan ke proyek nyata. Belum ada repository GitHub atau deployment Vercel publik.

## Menjalankan

Node.js 22 atau lebih baru:

```sh
node build.cjs
node preview.cjs
```

Buka alamat lokal yang tercetak. Jangan bagikan `127.0.0.1` kepada tester: alamat tersebut hanya bekerja di komputer yang menjalankan server. Untuk tester HP, gunakan URL HTTPS hasil deployment.

```sh
npm test
```

Pengujian memakai data fiktif di memori dan tidak membaca catatan pengguna. `check-build.cjs` membangun konfigurasi fiktif, memeriksanya, lalu mengembalikan build ke mode lokal. Jalankan pengujian sebelum build produksi, bukan sesudahnya.

## Struktur

| File | Fungsi |
|---|---|
| app.html, app.css, app.js | Tampilan dan pencatatan V2 yang dikembangkan |
| core.js | Validasi, migrasi, HPP rata-rata, kas, utang, laba rugi |
| v3.js | Anggaran, target, dialog konfirmasi, retur, sesi dan sinkronisasi |
| cloud.js | Supabase Auth REST dan PostgREST, tanpa kunci admin |
| v1.html | Kalkulator V1 yang dipertahankan di Shadow DOM |
| supabase.sql | Tabel, RLS, validasi bentuk data, dan penyimpanan dengan pemeriksaan versi |
| public/ | Manifest, ikon, service worker tanpa cache offline |
| build.cjs | Menggabungkan sumber ke dist, memasukkan konfigurasi publik |
| vercel.json | Build dan header keamanan untuk Vercel |
| .github/workflows/check.yml | Pengujian saat kode didorong ke GitHub |

## Deployment

Ikuti `SETUP.md`. Tidak perlu dependensi produksi atau server Node yang selalu berjalan: Vercel menyajikan `dist/`, browser mengakses Supabase langsung menggunakan token pengguna.

Variabel build: `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY`. Keduanya harus diisi bersama. Kunci publik memang terlihat di browser; keamanan data bergantung pada RLS dan fungsi database. Build menolak kunci `sb_secret_...` serta JWT dengan role selain `anon`.

File `.env.example` hanya contoh. Build membaca environment proses, tidak otomatis membaca `.env`. Isi variabel di dashboard Vercel atau environment shell sebelum menjalankan build.

## Penyimpanan dan migrasi

Mode lokal: `profitpilot.v3` di localStorage. Data V2 pada `profitpilot.v2` dibaca, divalidasi, dan disalin sekali jika V3 belum ada; nilai V2 tidak dihapus. Mode file lokal dan website memiliki penyimpanan berbeda. Gunakan cadangan JSON saat pindah origin/perangkat.

Mode akun: sesi token dan cache akun disimpan di sessionStorage per tab. Setelah login, data server dibaca terlebih dahulu. Catatan lokal tidak otomatis diunggah. Tombol migrasi hanya berlaku untuk akun kosong, meminta konfirmasi, dan mempertahankan catatan lokal. Keluar menghapus cache dan token sesi akun ini; mode lokal kembali ditampilkan.

Setiap perubahan akun memicu sinkronisasi otomatis. Jika jaringan gagal, status memberi tahu bahwa perubahan belum di server; pengguna dapat mengulang sinkronisasi atau mengunduh cadangan. Cache sesi bukan cadangan permanen dan bisa hilang ketika tab ditutup. Catatan yang sudah tersinkron tetap ada di Supabase. Konflik versi tidak ditimpa otomatis: unduh cadangan lokal, ambil data server, kemudian masukkan koreksi yang diperlukan. Tidak ada penggabungan otomatis.

Data akun disimpan sebagai satu dokumen JSONB per pengguna untuk mempertahankan mesin ledger V2 dan melakukan perubahan stok/utang secara atomik. Semua penulisan memakai RPC dengan `auth.uid()`; tidak menerima ID pengguna dari frontend. RLS membatasi pembacaan ke pemilik. Akses tulis tabel langsung dan akses anonim ditolak. Database memvalidasi tipe, ukuran, ID, tanggal, dan nominal; validasi kronologi stok serta perhitungan keuangan tetap dilakukan oleh core.js. Ini bukan buku besar yang tahan manipulasi oleh pemilik akun atau sistem audit akuntansi.

Tidak ada analitik, iklan, data kartu, atau service-role key. Mode akun memerlukan email dan password melalui Supabase Auth. Cadangan tidak dienkripsi; gunakan kode pelanggan/pemasok jika memungkinkan.

## Format cadangan

JSON UTF-8 dengan `schema: 3`, `profile`, `entries`, `items`, `budgets`, `goals`. Impor juga menerima `schema: 2`. Maksimal 15 MB, 20.000 transaksi, 2.000 item, 1.200 anggaran, dan 100 target. Rupiah input bulat, kuantitas bulat, tanggal ISO `YYYY-MM-DD`. Nilai per input maksimum Rp1 triliun; total eksposur perhitungan maksimum Rp10 triliun. HPP hasil rata-rata dibulatkan dua desimal dan sisa nilai stok dikosongkan saat jumlah menjadi nol.

Entry menyimpan ID, jenis buku, jenis transaksi, tanggal, keterangan/kategori, jumlah/harga/nominal, metode pembayaran, referensi utang/retur, item, biaya langsung, fee, diskon, kemasan, dan penanda hapus. Budget: `{month,category,amount}`. Goal: `{id,name,target,saved}`. File impor diperiksa sebelum konfirmasi penggantian; unduh cadangan sebelum mengganti. CSV memakai UTF-8 BOM, pemisah titik koma, angka mentah untuk pengolahan spreadsheet, dan perlindungan formula pada kolom teks; mengikuti periode dan filter daftar transaksi.

## Batas keuangan MVP

- Saldo adalah gabungan kas yang tercatat, bukan hasil koneksi bank. Transfer rekening sendiri tidak menambah pendapatan/pengeluaran; saldo per rekening belum tersedia. Biaya admin dicatat terpisah.
- Penjualan neto = jumlah × harga − diskon. Laba = penjualan neto − HPP − fee − kemasan − biaya lain. Jangan mengisi biaya yang sudah tercatat di tempat lain.
- Stok awal tidak mengubah kas/laba; pembelian menambah persediaan; penjualan memakai HPP rata-rata tertimbang. Bahan/menu boleh dipakai sesuai proses usaha, tanpa resep/produksi otomatis.
- Penjualan tempo membentuk piutang; pengeluaran/pembelian tempo membentuk utang. Pelunasan pokok hanya mengubah kas/tagihan. Biaya langsung, fee, dan kemasan penjualan dianggap dibayar saat transaksi.
- Retur penuh hanya untuk penjualan bisnis yang sejak awal lunas. Pendapatan dan kas dibalik pada tanggal retur; barang kembali dengan HPP asal. Biaya jasa yang sudah terpakai, fee, dan kemasan tidak dikembalikan otomatis. Retur sebagian, retur pembelian dan retur tempo belum didukung. Jangan menyamarkannya dengan menghapus transaksi lama.
- Hapus adalah pembatalan/koreksi dari tanggal asal, bukan retur. Transaksi dengan pelunasan/retur terkait tidak dapat dihapus sampai dependensinya ditangani. Edit/backdate menghitung ulang riwayat; tidak ada penguncian periode atau audit perubahan permanen.
- Anggaran menghitung pengeluaran kategori pada bulan terpilih, termasuk tempo. Target tabungan diisi manual dan tidak menambah/mengurangi saldo.
- Tidak ada pajak, penyusutan, bunga otomatis, laporan resmi, pembayaran premium, atau dukungan offline. PWA memerlukan HTTPS dan dukungan browser.
