#!/bin/bash

# --- KONFIGURASI ---
# Ganti dengan Username GitHub Anda
USERNAME="yudiakunkerja" 
# Ganti dengan Nama Repository yang Anda buat di GitHub
REPO="ServerCloudNmsa" 
# Gunakan "main" atau "master" (sesuai nama branch di GitHub)
BRANCH="main" 

echo "------------------------------------------"
echo "🚀 Memulai Proses Sinkronisasi ke GitHub..."
echo "------------------------------------------"

# 1. Menambahkan semua perubahan file
git add .

# 2. Membuat catatan perubahan (Commit) dengan pesan otomatis waktu
COMMIT_MSG="Update ProConnect: $(date +'%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MSG"

# 3. Proses Push menggunakan Token dari Secrets Replit
# Format: https://<token>@github.com/<user>/<repo>.git
echo "📡 Mengirim data ke GitHub..."
git push https://$GITHUB_TOKEN@github.com/$USERNAME/$REPO.git $BRANCH

echo "------------------------------------------"
echo "✅ BERHASIL! Kode Anda sudah di GitHub."
echo "🌐 Vercel akan memulai update otomatis sekarang."
echo "------------------------------------------"
