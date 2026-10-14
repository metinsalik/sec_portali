import React from 'react';
export default function ModulesStep({ data, update }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">5. Modül Kullanım İzinleri</h2>
      <p className="text-xs text-muted-foreground">Bu tesis için hangi uygulamaların (Risk, Kimyasal vb.) açık olacağını seçin. (Yakında aktif olacak)</p>
    </div>
  );
}
