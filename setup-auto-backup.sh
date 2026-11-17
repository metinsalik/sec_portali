#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"

echo "=========================================================="
echo "    SEC PORTALI - OTOMATİK GÜNLÜK YEDEKLEME KURULUMU     "
echo "=========================================================="
echo ""

chmod +x "$SCRIPT_DIR/backup.sh"
chmod +x "$SCRIPT_DIR/restore.sh"

# 1. İlk test yedeğini al
echo "1. İlk test yedeği alınıyor..."
"$BACKUP_SCRIPT"

# 2. Linux Crontab'a Gece 03:00 Görevi Ekle
echo ""
echo "2. Linux Crontab zamanlayıcısına (Her gece 03:00) kaydediliyor..."

CRON_JOB="0 3 * * * /bin/bash $BACKUP_SCRIPT >> $SCRIPT_DIR/backups/backup.log 2>&1"

# Mevcut crontab'da zaten var mı kontrol et
if crontab -l 2>/dev/null | grep -Fq "$BACKUP_SCRIPT"; then
  echo "   -> Görev crontab içinde zaten kayıtlı."
else
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "   -> Görev başarıyla eklendi!"
fi

echo ""
echo "=========================================================="
echo "KURULUM TAMAMLANDI!"
echo "Her gece saat 03:00'te otomatik tam yedek (DB + Fotoğraflar) alınacaktır."
echo "Yedekler dizini: $SCRIPT_DIR/backups"
echo ""
echo "İstediğiniz an manuel yedek almak için: ./backup.sh"
echo "Yedekten geri dönmek için:             ./restore.sh"
echo "=========================================================="
