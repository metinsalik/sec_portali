import React from 'react';
import { SettingMultiSelect } from './SettingMultiSelect';
import { DepartmentMultiSelect } from '@/components/shared/DepartmentSelect';

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
  placeholder = 'Sorumlu departman seçin (birden fazla seçilebilir)...',
}) => (
  <DepartmentMultiSelect
    value={value}
    onChange={onChange}
    mode="csv"
    placeholder={placeholder}
    searchPlaceholder="Departman ara..."
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
