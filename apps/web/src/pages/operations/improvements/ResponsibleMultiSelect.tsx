import React from 'react';
import { SettingMultiSelect } from './SettingMultiSelect';

const DEFAULT_RESPONSIBLES = [
  'Teknik Müdürlük',
  'İSG Birimi',
  'Biyomedikal',
  'Başhekimlik',
  'Destek Hizmetleri',
  'Bilgi İşlem',
];

const DEFAULT_AUDIT_NAMES = [
  'Hastane İç Denetimleri',
  'Merkezi Denetimler',
  'Sağlık Denetimleri',
  'İtfaiye/Yangın Komisyonu Denetimleri',
  'İSG Yangın ve Teknik Alan Saha Turu',
  'Diğer',
];

interface MultiSelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const ResponsibleMultiSelect: React.FC<MultiSelectFieldProps> = ({
  value,
  onChange,
  placeholder = 'Sorumlu seçin (birden fazla seçilebilir)...',
}) => (
  <SettingMultiSelect
    value={value}
    onChange={onChange}
    endpoint="/api/operations/improvements/responsibles"
    defaultOptions={DEFAULT_RESPONSIBLES}
    placeholder={placeholder}
    searchPlaceholder="Sorumlu ara..."
    emptyText="Eşleşen sorumlu bulunamadı."
  />
);

export const AuditNameMultiSelect: React.FC<MultiSelectFieldProps> = ({
  value,
  onChange,
  placeholder = 'Denetim adı seçin (birden fazla seçilebilir)...',
}) => (
  <SettingMultiSelect
    value={value}
    onChange={onChange}
    endpoint="/api/operations/improvements/audit-names"
    defaultOptions={DEFAULT_AUDIT_NAMES}
    placeholder={placeholder}
    searchPlaceholder="Denetim adı ara..."
    emptyText="Eşleşen denetim adı bulunamadı."
    ensureLastOption="Diğer"
  />
);
