# ==============================================================================
# Dockerfile - Sistem Generator Administrasi SAS & Berita Acara Ujian Resmi
# SMK NEGERI FYJ CHANNEL
# ==============================================================================

# Gunakan image resmi Node.js LTS berbasis Alpine Linux yang sangat ringan (~50MB)
FROM node:20-alpine

# Label informasi metadata
LABEL maintainer="SMK NEGERI FYJ CHANNEL"
LABEL description="Sistem Generator Administrasi SAS & Asesmen Ujian Resmi"
LABEL version="2.11"

# Set direktori kerja aplikasi di dalam container
WORKDIR /app

# Salin konfigurasi package (aplikasi ini zero external dependencies)
COPY package*.json ./

# Salin seluruh source code aplikasi ke dalam direktori container
COPY . .

# Ekspos port default server
EXPOSE 3000

# Variabel environment default
ENV NODE_ENV=production
ENV PORT=3000

# Jalankan server aplikasi
CMD ["node", "server.js"]
