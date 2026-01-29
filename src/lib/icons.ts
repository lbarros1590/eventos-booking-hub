import { Waves, Baby, Flame, Wind, Home, Sun, Snowflake, Square, ChefHat, Armchair, Fan, Wifi, Table2, LucideIcon } from 'lucide-react';

export const iconMap: Record<string, LucideIcon> = {
  Waves,
  Baby,
  Flame,
  Wind,
  Home,
  Sun,
  Snowflake,
  Square,
  ChefHat,
  Armchair,
  Fan,
  Wifi,
  Table: Table2,
};

export const getIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Square;
};
