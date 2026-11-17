#!/bin/bash
set -e

echo "=========================================================="
echo "    SEC PORTALI - HAZMAT VERİ KURTARMA ÇALIŞTIRICI        "
echo "=========================================================="
echo ""
echo "1. Backend container kontrol ediliyor..."

CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep backend | head -n 1)

if [ -z "$CONTAINER_NAME" ]; then
  echo "HATA: Backend container bulunamadı! Lütfen 'docker compose up -d' ile container'ların çalıştığından emin olun."
  exit 1
fi

echo "   Bulunan container: $CONTAINER_NAME"
echo ""
echo "2. Güncel kurtarma scripti container içine aktarılıyor (Build beklemenize gerek yok)..."
docker cp backend/src/scripts/recover_hazmat.ts "$CONTAINER_NAME":/app/backend/src/scripts/recover_hazmat.ts

echo ""
echo "3. Kurtarma işlemi başlatılıyor..."
echo ""

docker exec -it "$CONTAINER_NAME" npx ts-node --transpile-only src/scripts/recover_hazmat.ts

echo ""
echo "=========================================================="
echo "İşlem tamamlandı! Verilerinizi arayüzden (/hazmat/materials) kontrol edebilirsiniz."
echo "Oluşturulan SQL ve JSON yedeklerini container içinden almak için:"
echo "docker cp $CONTAINER_NAME:/app/backend/recovered_backups ./recovered_backups"
echo "=========================================================="
