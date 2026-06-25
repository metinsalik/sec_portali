const fs = require('fs');
const path = require('path');

const models = `

// --- BİNA TURU YÖNETİMİ MODÜLLERİ ---

model BTAnaGrup {
  id        Int      @id @default(autoincrement())
  facilityId String
  ad        String
  sorular   BTSoruBankasi[]
  facility  Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model BTDenetlenenAlan {
  id        Int      @id @default(autoincrement())
  facilityId String
  ad        String
  sorular   BTSoruBankasi[]
  facility  Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model BTKategori {
  id        Int      @id @default(autoincrement())
  facilityId String
  ad        String
  sorular   BTSoruBankasi[]
  facility  Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model BTSoruBankasi {
  id               Int              @id @default(autoincrement())
  facilityId       String
  anaGrupId        Int
  denetlenenAlanId Int
  kategoriId       Int
  kriter           String
  anaGrup          BTAnaGrup        @relation(fields: [anaGrupId], references: [id])
  denetlenenAlan   BTDenetlenenAlan @relation(fields: [denetlenenAlanId], references: [id])
  kategori         BTKategori       @relation(fields: [kategoriId], references: [id])
  turSorulari      BTTurSorusu[]
  facility         Facility         @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  createdAt        DateTime         @default(now())
}

model BTSorumluBirim {
  id             Int             @id @default(autoincrement())
  facilityId     String
  ad             String
  turler         BTTur[]
  kisiler        BTSorumluKisi[]
  uygunsuzluklar BTUygunsuzluk[]
  facility       Facility        @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  createdAt      DateTime        @default(now())
}

model BTSorumluKisi {
  id             Int             @id @default(autoincrement())
  facilityId     String
  ad             String
  birimId        Int
  birim          BTSorumluBirim  @relation(fields: [birimId], references: [id])
  turler         BTTur[]
  uygunsuzluklar BTUygunsuzluk[]
  facility       Facility        @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  createdAt      DateTime        @default(now())
}

model BTTur {
  id               Int             @id @default(autoincrement())
  facilityId       String
  ad               String
  baslangicTarihi  DateTime
  bitisTarihi      DateTime
  durum            BTTurDurum      @default(TASLAK)
  sorumluBirimId   Int
  sorumluKisiId    Int
  sorumluBirim     BTSorumluBirim  @relation(fields: [sorumluBirimId], references: [id])
  sorumluKisi      BTSorumluKisi   @relation(fields: [sorumluKisiId], references: [id])
  denetimEkibi     BTDenetimEkibi[]
  turSorulari      BTTurSorusu[]
  uygunsuzluklar   BTUygunsuzluk[]
  facility         Facility        @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
}

enum BTTurDurum {
  TASLAK
  AKTIF
  TAMAMLANDI
}

model BTDenetimEkibi {
  id        Int    @id @default(autoincrement())
  turId     Int
  kisiAdi   String
  tur       BTTur  @relation(fields: [turId], references: [id], onDelete: Cascade)
}

model BTTurSorusu {
  id          Int           @id @default(autoincrement())
  turId       Int
  soruId      Int
  tur         BTTur         @relation(fields: [turId], references: [id], onDelete: Cascade)
  soru        BTSoruBankasi @relation(fields: [soruId], references: [id])
  cevap       BTCevap?
}

model BTCevap {
  id             Int           @id @default(autoincrement())
  turSorusuId    Int           @unique
  sonuc          BTCevapSonuc
  aciklama       String?
  fotograflar    String[]
  dofGerekli     Boolean       @default(false)
  turSorusu      BTTurSorusu   @relation(fields: [turSorusuId], references: [id], onDelete: Cascade)
  uygunsuzluk    BTUygunsuzluk?
  createdAt      DateTime      @default(now())
}

enum BTCevapSonuc {
  UYGUN
  UYGUN_DEGIL
}

model BTUygunsuzluk {
  id               Int                  @id @default(autoincrement())
  facilityId       String
  turId            Int
  cevapId          Int                  @unique
  sorumluBirimId   Int
  sorumluKisiId    Int
  terminTarihi     DateTime
  yapilacaklar     String
  durum            BTUygunsuzlukDurum   @default(ACIK)
  kapatmaKaniti    String?
  kapatmaTarihi    DateTime?
  tur              BTTur                @relation(fields: [turId], references: [id], onDelete: Cascade)
  cevap            BTCevap              @relation(fields: [cevapId], references: [id], onDelete: Cascade)
  sorumluBirim     BTSorumluBirim       @relation(fields: [sorumluBirimId], references: [id])
  sorumluKisi      BTSorumluKisi        @relation(fields: [sorumluKisiId], references: [id])
  facility         Facility             @relation(fields: [facilityId], references: [id], onDelete: Cascade)
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt
}

enum BTUygunsuzlukDurum {
  ACIK
  KAPALI
}
`;

const schemaPath = path.join(__dirname, 'backend/prisma/schema.prisma');
fs.appendFileSync(schemaPath, models);
console.log('Successfully appended models.');
