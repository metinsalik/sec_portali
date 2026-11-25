#!/bin/bash
set -e

# ==========================================================
#     SEC PORTALI - TAM VE EKSİKSİZ GÜNLÜK YEDEKLEME SİSTEMİ
#     (Veritabanı [Tüm Tablolar] + Fotoğraflar/Belgeler)
#     Her zaman tek ve güncel tam yedek (latest) saklanır.
# ==========================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BACKUP_DIR="$SCRIPT_DIR/backups"
mkdir -p "$BACKUP_DIR"

DB_LATEST_FILE="$BACKUP_DIR/db_latest.sql.gz"
DB_TMP_FILE="$BACKUP_DIR/.db_latest.sql.gz.tmp"

UPLOADS_LATEST_FILE="$BACKUP_DIR/uploads_latest.tar.gz"
UPLOADS_TMP_FILE="$BACKUP_DIR/.uploads_latest.tar.gz.tmp"

# Hata durumunda yarım kalan geçici dosyaları temizle (mevcut latest korunur)
cleanup_tmp() {
  rm -f "$DB_TMP_FILE" "$UPLOADS_TMP_FILE"
}
trap cleanup_tmp EXIT

echo "=========================================================="
echo "  TAM YEDEKLEME BAŞLATILDI: $(date)"
echo "=========================================================="

# 1. Container Tespiti
POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep postgres | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
  echo "HATA: PostgreSQL container bulunamadı! Lütfen container'ların çalıştığından emin olun."
  exit 1
fi

# 2. PostgreSQL Tam Yedeği (Önce geçici dosyaya alınır, doğrulanınca latest üzerine taşınır)
echo "1. PostgreSQL veritabanı tam yedeği alınıyor ($POSTGRES_CONTAINER)..."
docker exec "$POSTGRES_CONTAINER" pg_dump -U isguser -d isgdb --clean --if-exists | gzip > "$DB_TMP_FILE"

# Veritabanı yedek bütünlük testi (bozuk dosya kontrolü)
gzip -t "$DB_TMP_FILE"
mv -f "$DB_TMP_FILE" "$DB_LATEST_FILE"

DB_SIZE=$(du -h "$DB_LATEST_FILE" | cut -f1)
echo "   -> Veritabanı tam yedeği doğrulandı ve güncellendi: $DB_LATEST_FILE ($DB_SIZE)"

# 3. Uploads (Tüm Fotoğraflar ve Belgeler) Yedeği
echo "2. Yüklenen fotoğraflar ve belgeler (uploads) yedekleniyor..."
UPLOADS_SIZE="Atlandı"
if [ -d "$SCRIPT_DIR/backend/uploads" ]; then
  tar -czf "$UPLOADS_TMP_FILE" -C "$SCRIPT_DIR/backend" uploads
  # Arşiv bütünlük kontrolü
  tar -tzf "$UPLOADS_TMP_FILE" > /dev/null
  mv -f "$UPLOADS_TMP_FILE" "$UPLOADS_LATEST_FILE"
  UPLOADS_SIZE=$(du -h "$UPLOADS_LATEST_FILE" | cut -f1)
  echo "   -> Fotoğraf/belge yedeği doğrulandı ve güncellendi: $UPLOADS_LATEST_FILE ($UPLOADS_SIZE)"
else
  echo "   ! backend/uploads dizini bulunamadı, atlandı."
fi

# 4. Otomatik Temizlik: db_latest.sql.gz ve uploads_latest.tar.gz dışındaki tüm eski arşivleri sil
echo "3. Eski yedek arşivleri temizleniyor (Yalnızca güncel latest yedeği korunur)..."
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name "db_*.sql.gz" ! -name "db_latest.sql.gz" -o -name "uploads_*.tar.gz" ! -name "uploads_latest.tar.gz" \) -delete 2>/dev/null || true

echo "=========================================================="
echo "TAMAMLANDI: Eksiksiz tam yedekleme başarıyla güncellendi!"
echo "Konum: $BACKUP_DIR"
echo "  - Veritabanı:       $DB_LATEST_FILE ($DB_SIZE)"
echo "  - Fotoğraflar:      $UPLOADS_LATEST_FILE ($UPLOADS_SIZE)"
echo "  - Saklama Politikası: Yalnızca güncel tek tam yedek (latest)"
echo "=========================================================="
