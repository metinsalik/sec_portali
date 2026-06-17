import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, QrCode } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function QRScannerPage() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: {width: 250, height: 250} },
      false
    );

    scanner.render(async (decodedText) => {
      setScanning(false);
      try {
        await scanner.clear();
      } catch(e) { console.error(e) }

      toast.loading("Ekipman aranıyor...", { id: 'qr-search' });
      
      try {
        const res = await api.get(`/fire-equipment/equipment/qr/${encodeURIComponent(decodedText)}`);
        if (res.ok) {
          const data = await res.json();
          toast.dismiss('qr-search');
          toast.success("Ekipman bulundu!");
          navigate(`/fire-equipment/view/${data.id}`);
        } else {
          toast.dismiss('qr-search');
          toast.error("Bu koda ait ekipman bulunamadı.");
          setScanning(true);
        }
      } catch (e) {
        toast.dismiss('qr-search');
        toast.error("Hata oluştu.");
        setScanning(true);
      }
    }, (error) => {
      // Ignored
    });

    return () => {
      try {
        scanner.clear();
      } catch(e) {}
    };
  }, [scanning, navigate]);

  return (
    <div className="max-w-md mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <QrCode className="w-5 h-5 text-red-500" /> QR Okuyucu
        </h1>
      </div>

      <Card>
        <CardContent className="pt-6 text-center">
          {scanning ? (
            <div id="qr-reader" className="w-full overflow-hidden rounded-lg"></div>
          ) : (
            <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              Yönlendiriliyor...
            </div>
          )}
          <Button className="mt-4 w-full" variant="outline" onClick={() => setScanning(true)} disabled={scanning}>
            Yeniden Tara
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
