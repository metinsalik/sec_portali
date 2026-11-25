#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"

echo "=========================================================="
echo "    SEC PORTALI - OTOMATİK GÜNLÜK YEDEKLEME KURULUMU     "
echo "    (Her Gün Saat 18:00'de Otomatik 24 Saatlik Yedek)    "
echo "=========================================================="
echo ""

chmod +x "$SCRIPT_DIR/backup.sh"
chmod +x "$SCRIPT_DIR/restore.sh"

# 1. İlk test yedeğini al ve doğrula
echo "1. İlk tam test yedeği alınıyor ve doğrulanıyor..."
"$BACKUP_SCRIPT"

# 2. Linux Crontab'a Her Gün Saat 18:00 Görevi Ekle
echo ""
echo "2. Linux Crontab zamanlayıcısına (Her gün 18:00) kaydediliyor..."

CRON_JOB="0 18 * * * /bin/bash $BACKUP_SCRIPT >> $SCRIPT_DIR/backups/backup.log 2>&1"

# Eski veya önceki yedekleme satırlarını temizle, güncel 18:00 görevini ekle
(crontab -l 2>/dev/null | grep -v "backup.sh" || true; echo "$CRON_JOB") | crontab -

echo "   -> Görev başarıyla kaydedildi! (Her gün saat 18:00)"

echo ""
echo "=========================================================="
echo "KURULUM BAŞARIYLA TAMAMLANDI!"
echo "Zamanlama:       Her gün saat 18:00 (24 saatte bir)"
echo "Saklama Politikası: Her zaman güncel tek tam yedek (latest — eskiler otomatik silinir)"
echo "Kapsam:          Tüm Veritabanı Tabloları + Tüm Fotoğraf/Belgeler (Uploads)"
echo "Yedekler Dizini: $SCRIPT_DIR/backups"
echo ""
echo "İstediğiniz an manuel yedek almak için: ./backup.sh"
echo "Yedekten geri dönmek için:             ./restore.sh"
echo "=========================================================="
