import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnaGrupYonetimi from './AnaGrupYonetimi';
import DenetlenenAlanYonetimi from './DenetlenenAlanYonetimi';
import KategoriYonetimi from './KategoriYonetimi';
import SorumluBirimYonetimi from './SorumluBirimYonetimi';
import SorumluKisiYonetimi from './SorumluKisiYonetimi';
import SoruBankasiExcel from './SoruBankasiExcel';

const AyarlarIndex = () => {
  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#011d2b] dark:text-[#cbe6fa]">Bina Turu Ayarları</h1>
        <p className="text-muted-foreground mt-1">Soru bankası, kategoriler ve sorumlu tanımlamalarını yönetin.</p>
      </div>

      <Tabs defaultValue="ana-grup" className="w-full">
        <TabsList className="mb-6 flex flex-wrap h-auto">
          <TabsTrigger value="ana-grup">Ana Grup</TabsTrigger>
          <TabsTrigger value="denetlenen-alan">Denetlenen Alan</TabsTrigger>
          <TabsTrigger value="kategori">Kategori</TabsTrigger>
          <TabsTrigger value="sorumlu-birim">Sorumlu Birim</TabsTrigger>
          <TabsTrigger value="sorumlu-kisi">Sorumlu Kişi</TabsTrigger>
          <TabsTrigger value="soru-bankasi-excel">Soru Bankası (Excel)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ana-grup"><AnaGrupYonetimi /></TabsContent>
        <TabsContent value="denetlenen-alan"><DenetlenenAlanYonetimi /></TabsContent>
        <TabsContent value="kategori"><KategoriYonetimi /></TabsContent>
        <TabsContent value="sorumlu-birim"><SorumluBirimYonetimi /></TabsContent>
        <TabsContent value="sorumlu-kisi"><SorumluKisiYonetimi /></TabsContent>
        <TabsContent value="soru-bankasi-excel"><SoruBankasiExcel /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AyarlarIndex;
