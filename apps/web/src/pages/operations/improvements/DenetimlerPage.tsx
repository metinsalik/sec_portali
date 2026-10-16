import React from 'react';
import { SourceSheetPage } from './SourceSheetPage';
import { ImprovementSheetType } from './types';

export const DenetimlerPage: React.FC = () => {
  return <SourceSheetPage sheetType={ImprovementSheetType.DENETIMLER} />;
};
