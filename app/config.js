/* =====================================================================
   KONFIGURASI — satu-satunya berkas yang perlu Anda isi sendiri.

   Keduanya diambil dari:
   Dashboard Supabase → Project Settings → API Keys

   Dua nilai ini MEMANG PUBLIK. Keduanya tertanam di setiap halaman yang
   dibuka peserta dan terbaca siapa pun yang melihat kode halaman. Yang
   melindungi data bukan kerahasiaannya, melainkan 57 kebijakan RLS di
   basis data.

   JANGAN PERNAH menaruh service_role key di sini. Kunci itu melewati
   seluruh kebijakan RLS. Kalau ia masuk ke berkas ini, ia ikut terbit
   ke internet dan seluruh pengamanan kita hilang dalam satu langkah.
   ===================================================================== */

window.AJIOS_CONFIG = {
  url:  'https://zkqfbdvumqnabptiqjhb.supabase.co',
  anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcWZiZHZ1bXFuYWJwdGlxamhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MjE0NzIsImV4cCI6MjEwNjk5NzQ3Mn0.MGiH8l4UcI2uOAE4pwp3XM7lKBQTRSph3Vmf-vkRXQs',   // diawali eyJ...

  /* Nama schema basis data. Jangan diubah. */
  schema: 'ajios',

  /* Alamat tempat aplikasi ini dihosting, tanpa garis miring di akhir.
     Dipakai untuk tautan kode masuk (OTP) dan untuk alamat di QR sesi.

     Contoh setelah domain terpasang:
       origin: 'https://os.ajijaens.com'

     Dibiarkan kosong, alamatnya dihitung dari halaman yang sedang dibuka.
     Itu jalan untuk mencoba, tetapi QR yang dicetak sebelum sesi sebaiknya
     dibuat dari alamat yang pasti — isi nilainya begitu domainnya siap. */
    origin: 'https://ajijaens-creator.github.io/Ajijaens_OS/app'

};
