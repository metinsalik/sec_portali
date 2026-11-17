#!/bin/bash
set -e

echo "=========================================================="
echo "    SEC PORTALI - HAZMAT VERİ KURTARMA ÇALIŞTIRICI        "
echo "=========================================================="
echo ""
echo "1. Container'lar kontrol ediliyor..."

BACKEND_CONTAINER=$(docker ps --format '{{.Names}}' | grep backend | head -n 1)
POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep postgres | head -n 1)

if [ -z "$BACKEND_CONTAINER" ]; then
  echo "HATA: Backend container bulunamadı! Lütfen 'docker compose up -d' ile container'ların çalıştığından emin olun."
  exit 1
fi

echo "   Backend Container:  $BACKEND_CONTAINER"
echo "   Postgres Container: $POSTGRES_CONTAINER"
echo ""

if [ -n "$POSTGRES_CONTAINER" ]; then
  echo "2. PostgreSQL WAL (İşlem Günlüğü) dosyaları çıkarılıyor..."
  docker exec "$POSTGRES_CONTAINER" sh -c "mkdir -p /tmp/wal_dump && cp /var/lib/postgresql/data/pg_wal/00000001* /tmp/wal_dump/ 2>/dev/null || true"
  docker cp "$POSTGRES_CONTAINER":/tmp/wal_dump "$BACKEND_CONTAINER":/app/backend/wal_dump
  echo "   -> WAL dosyaları başarıyla backend container'ına aktarıldı."
fi

echo ""
echo "3. Güncel kurtarma scripti aktarılıyor..."
docker cp backend/src/scripts/recover_hazmat.ts "$BACKEND_CONTAINER":/app/backend/src/scripts/recover_hazmat.ts

echo ""
echo "4. Kurtarma işlemi başlatılıyor..."
echo ""

docker exec -it "$BACKEND_CONTAINER" npx ts-node --transpile-only src/scripts/recover_hazmat.ts

echo ""
echo "=========================================================="
echo "İşlem tamamlandı! Verilerinizi arayüzden (/hazmat/materials) kontrol edebilirsiniz."
echo "Oluşturulan SQL ve JSON yedeklerini container içinden almak için:"
echo "docker cp $BACKEND_CONTAINER:/app/backend/recovered_backups ./recovered_backups"
echo "=========================================================="
