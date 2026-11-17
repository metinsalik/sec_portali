#!/bin/bash
set -e

# ==========================================================
#     SEC PORTALI - TEK KOMUTLA YEDEK GERİ YÜKLEME (RESTORE)
#     (Veritabanı [Tüm Tablolar] + Fotoğraflar/Belgeler)
# ==========================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BACKUP_DIR="$SCRIPT_DIR/backups"

echo "=========================================================="
echo "    SEC PORTALI - YEDEK GERİ YÜKLEME (RESTORE)            "
echo "=========================================================="

# 1. Container Tespiti
POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep postgres | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
  echo "HATA: PostgreSQL container bulunamadı! Lütfen container'ların çalıştığından emin olun."
  exit 1
fi

# 2. Hangi Yedeğin Yükleneceğini Belirle
TARGET_DATE="$1"

if [ -n "$TARGET_DATE" ] && [ "$TARGET_DATE" != "-y" ]; then
  DB_FILE=$(find "$BACKUP_DIR" -name "db_*${TARGET_DATE}*.sql.gz" | head -n 1)
  UPLOADS_FILE=$(find "$BACKUP_DIR" -name "uploads_*${TARGET_DATE}*.tar.gz" | head -n 1)
else
  DB_FILE="$BACKUP_DIR/db_latest.sql.gz"
  UPLOADS_FILE="$BACKUP_DIR/uploads_latest.tar.gz"
fi

if [ ! -f "$DB_FILE" ]; then
  echo "HATA: Veritabanı yedek dosyası bulunamadı: $DB_FILE"
  echo "Mevcut yedekler:"
  ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "Hiç yedek yok."
  exit 1
fi

echo "Yüklenecek Veritabanı Yedeği: $DB_FILE"
echo "Yüklenecek Fotoğraf/Belge Yedeği: $UPLOADS_FILE"
echo ""

# Onay İste (Eğer -y parametresi verilmediyse)
if [ "$2" != "-y" ] && [ "$1" != "-y" ]; then
  read -p "DİKKAT: Mevcut veritabanı ve fotoğrafların üzerine seçilen yedek yazılacaktır! Devam edilsin mi? (e/h): " CONFIRM
  if [ "$CONFIRM" != "e" ] && [ "$CONFIRM" != "E" ]; then
    echo "İşlem iptal edildi."
    exit 0
  fi
fi

echo ""
echo "1. PostgreSQL veritabanı geri yükleniyor..."

# Bütünlük kontrolü
gzip -t "$DB_FILE"

# Veritabanına tam aktarım
gunzip -c "$DB_FILE" | docker exec -i "$POSTGRES_CONTAINER" psql -U isguser -d isgdb > /dev/null 2>&1 || {
  echo "Bilgi: Standart aktarım yapılıyor..."
  gunzip -c "$DB_FILE" | docker exec -i "$POSTGRES_CONTAINER" psql -U isguser -d isgdb
}

echo "   -> Veritabanındaki tüm tablolar eksiksiz geri yüklendi."

# 3. Uploads (Fotoğraflar ve Belgeler) Geri Yükleme
if [ -f "$UPLOADS_FILE" ]; then
  echo "2. Fotoğraflar ve belgeler geri yükleniyor..."
  mkdir -p "$SCRIPT_DIR/backend/uploads"
  tar -xzf "$UPLOADS_FILE" -C "$SCRIPT_DIR/backend"
  echo "   -> Fotoğraflar ve belgeler başarıyla geri yüklendi."
else
  echo "   ! Fotoğraf yedek arşivi bulunamadı, sadece veritabanı yüklendi."
fi

echo ""
echo "=========================================================="
echo "BAŞARILI: Sistem seçilen yedeğe eksiksiz geri döndürüldü!"
echo "Tarih: $(date)"
echo "=========================================================="
