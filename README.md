# [Intro](#intro)
Whatsapp-Bot adalah aplikasi inovatif yang dirancang untuk mengoptimalkan penggunaan WhatsApp dengan fitur-fitur canggih, mulai dari broadcasting pesan massal hingga integrasi AI chatbot. Aplikasi ini tidak hanya memudahkan komunikasi dalam skala besar, tetapi juga dilengkapi dengan kemampuan AI untuk memahami dan menganalisis gambar yang berisi teks, kemudian menyediakan ringkasan informasi yang relevan. Dengan fungsionalitas ini, Whatsapp-Bot memberikan solusi yang efisien dan cerdas untuk kebutuhan komunikasi dan informasi di platform WhatsApp.  
  
# Instalasi Dan Konfigurasi
 - ## Instalasi
   - #### Lakukan Clone pada Github Repositori ini
        - Klik tombol "Code" (berwarna hijau) untuk mendapatkan URL repository. Jika menggunakan HTTPS, salin URL tersebut. Jika menggunakan SSH, klik ikon SSH dan salin URL SSH.
        - Buka terminal, command prompt atau Git Bash(rekomendasi) di komputer Anda.
        - Pindah ke direktori di mana Anda ingin menyimpan salinan lokal repository. Gunakan perintah cd untuk berpindah ke direktori tersebut.
          #### Contoh:
              cd path/ke/direktori/tujuan
        - Gunakan perintah git clone dengan menyertakan URL repository yang telah Anda salin sebelumnya.
          #### Contoh untuk HTTPS:
              git clone https://github.com/nama-akun/nama-repo.git
          #### Atau untuk SSH:
              git clone git@github.com:nama-akun/nama-repo.git
   - #### Jalankan Di Code Editor
       - Buka Terminal di direktori penyimpanan project.
   - #### Install Dependensi
     #### - Jalankan perintah berikut:
         composer install
     #### - Selanjutnya, jalankan perintah berikut:
         npm install
   - #### Buat Salinan File Konfigurasi
     - Salin file `.env.example` dan beri nama baru menjadi `.env`
       #### Jalankan Perintah Berikut:
           cp .env.example .env
   - #### Konfigurasi file `.env`
     - # Masukkan API dari upstage (https://console.upstage.ai/api-keys)
             API_KEY = (API KEY)
   - #### Konfigurasi media
     - # Buat sebuah folder /media
             mkdir media
  - #### Jalankan
     #### dan untuk menjalankannya
         node index.js
     #### dan
          npx json-server --watch db/db.json --port (port number)
