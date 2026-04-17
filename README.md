# Rekap BBM Connect

Aplikasi sederhana untuk magang dalam melakukan rekapitulasi data BBM Connect secara manual dan men-generate laporan.

## Cara Pemasangan (Setup)

### 1. Persiapan Google Spreadsheet
1. Buka [Google Sheets](https://sheets.google.com/) dan buat spreadsheet baru.
2. Anda bisa menamai spreadsheet ini (contoh: "Rekap BBM Connect").
3. Ganti nama Sheet1 menjadi nama bulan yang Anda inginkan (misalnya: `Januari 2024`). Anda dapat membuat sheet baru untuk bulan-bulan berikutnya.

### 2. Pemasangan Backend (Google Apps Script)
1. Di dalam Google Spreadsheet yang baru dibuat, klik menu **Extensions > Apps Script** (Ekstensi > Apps Script).
2. Hapus semua kode default yang ada di dalam editor.
3. Buka file `backend/Code.gs` dari repository ini, salin seluruh isinya, dan tempel (paste) ke dalam editor Apps Script.
4. Simpan proyek (tekan ikon disket / `Ctrl+S`).
5. Klik tombol **Deploy > New deployment** di pojok kanan atas.
6. Pilih **Select type** lalu klik ikon gerigi dan pilih **Web app**.
7. Konfigurasi:
   - **Description**: (Bebas, misalnya "Versi 1")
   - **Execute as**: `Me` (Penting agar script memiliki akses untuk menulis di sheet Anda)
   - **Who has access**: `Anyone` (Penting agar web frontend dapat berkomunikasi dengan API ini tanpa login).
8. Klik **Deploy**.
9. Akan muncul jendela peringatan *Authorization required*. Klik **Authorize access**.
10. Pilih akun Google Anda. Jika muncul peringatan *Google hasn’t verified this app*, klik **Advanced** lalu klik **Go to ... (unsafe)**. Allow semua permission.
11. Salin URL **Web app URL** yang diberikan (berakhiran dengan `/exec`). Simpan URL ini, Anda akan memasukkannya ke dalam aplikasi web.

### 3. Frontend & Deployment (Vercel)
Aplikasi frontend terdiri dari file `index.html`, `style.css`, dan `script.js` yang berada di dalam folder `frontend`.
1. Upload folder `frontend` ini ke akun GitHub Anda.
2. Login ke [Vercel](https://vercel.com/) dan buat proyek baru.
3. Import repository GitHub Anda, atur root directory ke `frontend` jika perlu, dan klik Deploy.
4. Setelah deploy selesai, buka URL Vercel Anda.
5. Masukkan **Web app URL** dari Apps Script yang disalin sebelumnya ke dalam kolom "API URL" di dalam aplikasi untuk menghubungkan frontend dengan database Google Sheet Anda.

## Cara Penggunaan
1. Masukkan API URL dari Apps Script, lalu klik **Muat Bulan (Sheet)**.
2. Pilih sheet bulan yang sedang Anda rekap.
3. Masukkan `ID` data dan tekan **Cari ID**. (Bisa untuk membuat entri baru atau mengedit entri lama).
4. Pilih **Tipe Pengecekan**:
   - Jika *Menu Input*: Isi kolom yang salah (Tanggal, KM, Harga). Kosongkan jika sudah benar (data OK).
   - Jika *Menu Unconditional*: Pilih status yang sesuai.
5. Klik **Simpan Rekap**.
6. Pada akhir rekapitulasi, klik **Generate Pesan Rekap Bulan Ini** untuk membuat pesan laporan yang siap dikirimkan ke Admin.