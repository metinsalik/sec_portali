#!/bin/bash
set -e

# ==========================================================
#     SEC PORTALI - OTOMATİK GÜNLÜK TAM YEDEKLEME SİSTEMİ
# ==========================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BACKUP_DIR="$SCRIPT_DIR/backups"
mkdir -p "$BACKUP_DIR"

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
TODAY=$(date +"%Y-%m-%d")

echo "=========================================================="
echo "  YEDEKLEME BAŞLATILDI: $(date)"
echo "=========================================================="

# 1. Container Tespiti
POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep postgres | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
  echo "HATA: PostgreSQL container bulunamadı! Lütfen container'ların çalıştığından emin olun."
  exit 1
fi

echo "1. PostgreSQL veritabanı yedeği alınıyor ($POSTGRES_CONTAINER)..."
DB_BACKUP_FILE="$BACKUP_DIR/db_${DATE}.sql.gz"
DB_LATEST_FILE="$BACKUP_DIR/db_latest.sql.gz"

# Veritabanı sıkıştırılmış SQL dump alınıyor
docker exec "$POSTGRES_CONTAINER" pg_dump -U isguser -d isgdb | gzip > "$DB_BACKUP_FILE"
cp -f "$DB_BACKUP_FILE" "$DB_LATEST_FILE"

DB_SIZE=$(du -h "$DB_LATEST_FILE" | cut -f1)
echo "   -> Veritabanı yedeği alındı: $DB_LATEST_FILE ($DB_SIZE)"

# 2. Uploads (Fotoğraflar ve Belgeler) Yedeği
echo "2. Yüklenen fotoğraflar ve belgeler (uploads) yedekleniyor..."
UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads_${DATE}.tar.gz"
UPLOADS_LATEST_FILE="$BACKUP_DIR/uploads_latest.tar.gz"

if [ -d "$SCRIPT_DIR/backend/uploads" ]; then
  tar -czf "$UPLOADS_BACKUP_FILE" -C "$SCRIPT_DIR/backend" uploads
  cp -f "$UPLOADS_BACKUP_FILE" "$UPLOADS_LATEST_FILE"
  UPLOADS_SIZE=$(du -h "$UPLOADS_LATEST_FILE" | cut -f1)
  echo "   -> Fotoğraf/belge yedeği alındı: $UPLOADS_LATEST_FILE ($UPLOADS_SIZE)"
else
  echo "   ! backend/uploads dizini bulunamadı, atlandı."
fi

# 3. Otomatik Temizlik: Diskin şişmemesi için 7 günden eski arşivleri temizle
echo "3. Eski arşivler temizleniyor (Son 7 gün korunur)..."
find "$BACKUP_DIR" -type f -name "db_20*.sql.gz" -mtime +7 -delete 2>/dev/null || true
find "$BACKUP_DIR" -type f -name "uploads_20*.tar.gz" -mtime +7 -delete 2>/dev/null || true

echo "=========================================================="
echo "TAMAMLANDI: Günlük yedekleme başarıyla tamamlandı!"
echo "Konum: $BACKUP_DIR"
echo "  - Veritabanı: $DB_LATEST_FILE ($DB_SIZE)"
echo "  - Fotoğraflar: $UPLOADS_LATEST_FILE ($UPLOADS_SIZE)"
echo "=========================================================="
