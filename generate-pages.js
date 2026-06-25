const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend/src/pages/bina-turu');
const ayarlarDir = path.join(pagesDir, 'ayarlar');

const pageFiles = [
  'BinaToruDashboard.tsx',
  'BinaToruListesi.tsx',
  'BinaToruOlustur.tsx',
  'BinaToruDetay.tsx',
  'DenetimBaslat.tsx',
  'UygunsuzlukListesi.tsx',
  'UygunsuzlukDetay.tsx'
];

const ayarlarFiles = [
  'AyarlarIndex.tsx',
  'SoruBankasi.tsx',
  'SoruBankasiExcel.tsx',
  'AnaGrupYonetimi.tsx',
  'DenetlenenAlanYonetimi.tsx',
  'KategoriYonetimi.tsx',
  'SorumluBirimYonetimi.tsx',
  'SorumluKisiYonetimi.tsx'
];

const getTemplate = (name) => `import React from 'react';

const ${name.replace('.tsx', '')} = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">${name.replace('.tsx', '')}</h1>
      <p className="mt-4 text-muted-foreground">Bu sayfa yapım aşamasındadır.</p>
    </div>
  );
};

export default ${name.replace('.tsx', '')};
`;

pageFiles.forEach(file => {
  fs.writeFileSync(path.join(pagesDir, file), getTemplate(file));
});

ayarlarFiles.forEach(file => {
  fs.writeFileSync(path.join(ayarlarDir, file), getTemplate(file));
});

console.log('Successfully created frontend page stubs.');
