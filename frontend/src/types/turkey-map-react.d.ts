declare module 'turkey-map-react' {
  import { ReactNode } from 'react';

  interface CityData {
    id: number;
    name: string;
    [key: string]: any;
  }

  interface TurkeyMapProps {
    onClick?: (city: CityData) => void;
    onHover?: (city: CityData) => void;
    customStyle?: {
      idleColor?: string;
      hoverColor?: string;
    };
    showTooltip?: boolean;
    hoverable?: boolean;
    renderCity?: (cityComponent: ReactNode, cityData: CityData) => ReactNode;
  }

  const TurkeyMap: React.FC<TurkeyMapProps>;
  export default TurkeyMap;
}
