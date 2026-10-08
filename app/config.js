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
  anon: 'ISI_DENGAN_ANON_PUBLIC_KEY',   // diawali eyJ...

  /* Nama schema basis data. Jangan diubah. */
  schema: 'ajios',

  /* Alamat tempat aplikasi ini dihosting. Dipakai untuk tautan OTP dan QR.
     Biarkan kosong untuk memakai alamat halaman saat ini. */
  origin: ''
};
