# Mengaktifkan ProfitPilot V3

Belum ada URL publik. Kode sudah disiapkan untuk GitHub → Vercel dan Supabase. Semua langkah berikut dilakukan pada proyek ProfitPilot yang sama; jangan mengunggah cadangan keuangan pengguna ke repository atau hosting.

## 1. Buat layanan milikmu

1. Masuk/buat akun GitHub, Vercel, dan Supabase sendiri. Simpan password dan kunci rahasia di pengelola password, jangan kirim ke chat.
2. Di Supabase, buat proyek pada paket Free. Jangan mengaktifkan add-on atau upgrade berbayar.
3. Buka SQL Editor, jalankan seluruh `supabase.sql`. Skrip membuat tabel `profitpilot_books`, mengaktifkan RLS, dan fungsi `save_profitpilot`. Jika ada error, jangan lanjutkan mengundang tester sebelum diperiksa.
4. Di pengaturan Auth, aktifkan email/password dan konfirmasi email. Atur minimum password 8 karakter atau lebih. Biarkan rate limit aktif.
5. Ambil Project URL dan publishable key dari dialog Connect/API Keys. Hanya dua nilai publik tersebut yang diperlukan frontend. Jangan gunakan database password, `sb_secret_...`, atau `service_role`.

Catatan paket: Vercel Hobby ditujukan untuk penggunaan pribadi nonkomersial. Karena ProfitPilot direncanakan menjadi produk, periksa kesesuaian penggunaan ini sebelum publikasi. Tidak ada Pro atau trial berbayar yang diaktifkan oleh pekerjaan ini. Jika Vercel meminta paket berbayar, berhenti dan putuskan bersama sebelum melanjutkan. [Ketentuan penggunaan Vercel](https://vercel.com/docs/limits/fair-use-guidelines).

## 2. Simpan sumber ke GitHub

Ekstrak paket **ProfitPilot-V3-source.zip**. Isi folder ini adalah proyek yang sudah dikembangkan, bukan aplikasi baru. Jika sudah ada repository ProfitPilot, perbarui repository tersebut. Jika belum ada, buat repository privat untuk kode ini.

Gunakan GitHub Desktop: tambahkan folder sumber, buat commit, lalu Publish Repository. Jangan memilih folder `outputs` atau seluruh folder chat. Pastikan `app.html`, `core.js`, `build.cjs`, `package.json`, `public/`, `supabase.sql`, `vercel.json`, dan `.github/` ikut tersimpan. Jangan unggah `.env`, token login, file cadangan, atau data tester.

## 3. Hubungkan Vercel

1. Import repository ProfitPilot dari GitHub ke Vercel. Beri akses hanya ke repository yang diperlukan.
2. Framework Preset: **Other**. Root Directory: folder yang berisi `package.json` (root jika mengunggah isi paket sumber).
3. Build Command: `node build.cjs`. Output Directory: `dist`. Gunakan Node.js 22 atau lebih baru yang tersedia. Tidak ada dependensi produksi yang harus ditambah.
4. Tambahkan environment variables pada Production: `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY`. Untuk Preview, gunakan proyek Supabase pengujian terpisah atau biarkan kedua variabel kosong; jangan tanpa sengaja memakai data produksi untuk pengujian.
5. Deploy. Catat URL HTTPS yang benar-benar diberikan Vercel. Jangan membuat-buat URL. Jika variabel diubah, lakukan redeploy karena konfigurasi dimasukkan saat build.
6. Di Supabase → Authentication → URL Configuration, isi Site URL dengan URL produksi tersebut. Tambahkan redirect URL yang tepat jika diperlukan; hindari wildcard luas ke domain yang tidak dikelola.

Referensi: [Vercel + GitHub](https://vercel.com/docs/git/vercel-for-github), [Supabase public keys](https://supabase.com/docs/guides/getting-started/api-keys), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 4. Siapkan email sebelum mengundang teman

Pengirim email bawaan Supabase hanya untuk pengujian terbatas, mengizinkan alamat anggota tim proyek, dan saat dicek memiliki batas 2 email per jam. Untuk pendaftaran teman yang bukan anggota tim, konfigurasikan **custom SMTP**. Jangan memberi akses admin proyek kepada teman hanya untuk melewati batas email.

Pilih penyedia SMTP dengan kuota gratis yang sesuai setelah memeriksa syaratnya. Konfigurasi SMTP dilakukan di Supabase; kredensial SMTP tidak masuk frontend. Jika penyedia memerlukan domain atau layanan berbayar, minta keputusan pemilik terlebih dahulu. Jangan mematikan verifikasi email sebagai jalan pintas untuk publik.

Sumber: [SMTP Supabase](https://supabase.com/docs/guides/auth/auth-smtp), [rate limits](https://supabase.com/docs/guides/auth/rate-limits).

## 5. Uji sebelum membagikan link

Gunakan dua email uji yang kamu kuasai. Jangan pakai data keuangan asli.

1. Daftar akun A, konfirmasi email, masuk. Catat transaksi dan tunggu status **Tersimpan di akun**.
2. Refresh, lalu buka browser/perangkat kedua dan masuk sebagai A. Pastikan catatan sama.
3. Masuk sebagai B melalui profil browser terpisah. Catatan harus kosong; perubahan B tidak boleh muncul di A. Uji akses tabel sebagai authenticated user melalui API jika melakukan audit keamanan; jangan menguji RLS memakai service_role karena role itu memang melewati RLS.
4. Ubah catatan A, hapus, pulihkan, cek saldo/HPP/tagihan, dan unduh CSV/JSON.
5. Buka akun A pada dua perangkat. Ubah dari keduanya. Konflik harus memberi peringatan, bukan menimpa diam-diam. Unduh cadangan lokal sebelum mengambil data server.
6. Putuskan jaringan setelah login, buat perubahan, periksa status belum tersinkron. Sambungkan lagi, tekan Sinkronkan sekarang. Jangan menutup tab sebelum perubahan terkirim atau dicadangkan.
7. Keluar. Cache akun harus hilang dari tampilan; mode lokal kembali. Akun B tidak boleh memperoleh pratinjau impor, undo impor, atau formulir target milik A.
8. Uji Android Chrome dan iPhone Safari dari URL HTTPS, bukan preview lampiran WhatsApp/Telegram/Files. Pasang dari menu browser jika tersedia. Tombol Pasang hanya tampil ketika browser mengizinkan prompt. Offline belum didukung.

Pengujian lokal sudah dilakukan, tetapi langkah live ini belum dilakukan karena proyek cloud belum tersedia. Jangan menganggap login/email atau isolasi akun pada deployment nyata sudah terverifikasi hanya karena build berhasil.

## 6. Pindahkan data V2 dengan aman

Di perangkat lama buka V2 → Cadangan data → Unduh cadangan. Simpan file sebelum melakukan perubahan. Buka URL V3 dan login ke akun tujuan. Impor cadangan, periksa ringkasan, lalu konfirmasi penggantian. Jika data lokal berada pada origin browser yang sama, tombol **Salin catatan lokal ke akun kosong** juga tersedia. Periksa status sinkronisasi dan login dari perangkat lain untuk memastikan data sudah tersimpan.

Format V2 tidak dihapus. Migrasi lokal otomatis mempertahankan `profitpilot.v2`. Cadangan V3 berisi anggaran dan target tambahan. Impor bukan penggabungan data: ia mengganti buku aktif setelah konfirmasi.

## Setelah setup

Kirim URL repository (atau sambungkan GitHub), URL Vercel, URL Supabase, dan publishable key publik jika ingin dibantu memeriksa konfigurasi. Jangan kirim secret key, password, atau service_role. Tidak ada proses berlangganan/upgrade yang diperlukan oleh kode aplikasi.
