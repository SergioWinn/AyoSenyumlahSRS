# Ayo Senyumlah

Timetable komunitas untuk mencari teman di sesi 2-Shot dan Meet & Greet JKT48/AKB48. Frontend tetap satu timetable; `group_name` dan `ticket_type` hanya menjadi identitas/filter sumber.

## Menjalankan lokal

1. Salin `.env.example` menjadi `.env.local` dan isi URL, publishable key, serta secret key Supabase.
2. Pastikan satu baris `events` memiliki `is_active = true`, lalu isi `event_sources.api_url` dengan endpoint `/bonus`.
3. Jalankan `npm run dev`, buka `/admin`, lalu sinkronkan sumber.

Secret key hanya dipakai di route server. Jangan memakai prefix `NEXT_PUBLIC_` untuk key tersebut.

## CSV

Kolom wajib: `Member,Sesi,Tipe Tiket`. Jalur dicocokkan otomatis dari slot aktif. CSV lama yang masih memiliki kolom `Jalur` tetap didukung.

## Deploy Vercel

Tambahkan tiga environment variable yang sama di Vercel. Build command dan output memakai default Next.js. Sinkronisasi hanya terjadi saat admin menekan tombol, sehingga API JKT48 tidak dipanggil oleh pengunjung.
