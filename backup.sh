#!/bin/bash
set -e

# ==========================================================
#     SEC PORTALI - TAM VE EKSİKSİZ GÜNLÜK YEDEKLEME SİSTEMİ
#     (Veritabanı [Tüm Tablolar] + Fotoğraflar/Belgeler)
# ==========================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BACKUP_DIR="$SCRIPT_DIR/backups"
mkdir -p "$BACKUP_DIR"

DATE=$(date +"%Y-%m-%d_%H-%M-%S")

echo "=========================================================="
echo "  TAM YEDEKLEME BAŞLATILDI: $(date)"
echo "=========================================================="

# 1. Container Tespiti
POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep postgres | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
  echo "HATA: PostgreSQL container bulunamadı! Lütfen container'ların çalıştığından emin olun."
  exit 1
fi

echo "1. PostgreSQL veritabanı tam yedeği alınıyor ($POSTGRES_CONTAINER)..."
DB_BACKUP_FILE="$BACKUP_DIR/db_${DATE}.sql.gz"
DB_LATEST_FILE="$BACKUP_DIR/db_latest.sql.gz"

# --clean --if-exists bayrakları ile tam, eksiksiz ve temiz yüklenebilir dump alınır
docker exec "$POSTGRES_CONTAINER" pg_dump -U isguser -d isgdb --clean --if-exists | gzip > "$DB_BACKUP_FILE"

# Veritabanı yedek bütünlük testi (bozuk dosya kontrolü)
gzip -t "$DB_BACKUP_FILE"
cp -f "$DB_BACKUP_FILE" "$DB_LATEST_FILE"

DB_SIZE=$(du -h "$DB_LATEST_FILE" | cut -f1)
echo "   -> Veritabanı tam yedeği alındı ve doğrulandı: $DB_LATEST_FILE ($DB_SIZE)"

# 2. Uploads (Tüm Fotoğraflar ve Belgeler) Yedeği
echo "2. Yüklenen fotoğraflar ve belgeler (uploads) yedekleniyor..."
UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads_${DATE}.tar.gz"
UPLOADS_LATEST_FILE="$BACKUP_DIR/uploads_latest.tar.gz"

if [ -d "$SCRIPT_DIR/backend/uploads" ]; then
  tar -czf "$UPLOADS_BACKUP_FILE" -C "$SCRIPT_DIR/backend" uploads
  # Arşiv bütünlük kontrolü
  tar -tzf "$UPLOADS_BACKUP_FILE" > /dev/null
  cp -f "$UPLOADS_BACKUP_FILE" "$UPLOADS_LATEST_FILE"
  UPLOADS_SIZE=$(du -h "$UPLOADS_LATEST_FILE" | cut -f1)
  echo "   -> Fotoğraf/belge yedeği alındı ve doğrulandı: $UPLOADS_LATEST_FILE ($UPLOADS_SIZE)"
else
  echo "   ! backend/uploads dizini bulunamadı, atlandı."
fi

# 3. Otomatik Temizlik: Diskin şişmemesi için 3 günden eski arşivleri temizle
echo "3. Eski arşivler temizleniyor (Son 3 gün korunur)..."
find "$BACKUP_DIR" -type f -name "db_20*.sql.gz" -mtime +3 -delete 2>/dev/null || true
find "$BACKUP_DIR" -type f -name "uploads_20*.tar.gz" -mtime +3 -delete 2>/dev/null || true

echo "=========================================================="
echo "TAMAMLANDI: Eksiksiz tam yedekleme başarıyla alındı!"
echo "Konum: $BACKUP_DIR"
echo "  - Veritabanı:   $DB_LATEST_FILE ($DB_SIZE)"
echo "  - Fotoğraflar:  $UPLOADS_LATEST_FILE ($UPLOADS_SIZE)"
echo "  - Saklama Payı: Son 3 günlük geriye dönük arşiv"
echo "=========================================================="
