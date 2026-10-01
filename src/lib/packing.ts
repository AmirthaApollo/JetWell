import type { IconName } from '../components/Icon';

export interface PackItem {
  id: string;
  label: string;
  icon: IconName;
}

export const PACKING_LIST: PackItem[] = [
  { id: 'eye-mask', label: 'Eye mask', icon: 'sleep' },
  { id: 'earplugs', label: 'Earplugs', icon: 'rest' },
  { id: 'water-bottle', label: 'Water bottle', icon: 'hydrate' },
  { id: 'light-layers', label: 'Light layers', icon: 'move' },
  { id: 'snacks', label: 'A few snacks', icon: 'meal' },
  { id: 'sunglasses', label: 'Sunglasses', icon: 'light' },
  { id: 'comfortable-shoes', label: 'Comfortable shoes', icon: 'move' },
  { id: 'charger', label: 'Phone charger', icon: 'note' },
];
