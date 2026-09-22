import {
  Folder, Briefcase, Home, Heart, Book, ShoppingCart, Dumbbell, Music, Camera, Code,
  Star, Target, Coffee, Plane, DollarSign, LucideIcon,
} from 'lucide-react';

// Only the icons offered in the category picker. Importing them by name (instead of
// `import * as Icons`) keeps the rest of lucide's ~1,500 icons out of the bundle.
export const CATEGORY_ICONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'folder', label: 'Folder', Icon: Folder },
  { value: 'briefcase', label: 'Work', Icon: Briefcase },
  { value: 'home', label: 'Home', Icon: Home },
  { value: 'heart', label: 'Personal', Icon: Heart },
  { value: 'book', label: 'Study', Icon: Book },
  { value: 'shopping-cart', label: 'Shopping', Icon: ShoppingCart },
  { value: 'dumbbell', label: 'Fitness', Icon: Dumbbell },
  { value: 'music', label: 'Music', Icon: Music },
  { value: 'camera', label: 'Creative', Icon: Camera },
  { value: 'code', label: 'Dev', Icon: Code },
  { value: 'star', label: 'Important', Icon: Star },
  { value: 'target', label: 'Goals', Icon: Target },
  { value: 'coffee', label: 'Daily', Icon: Coffee },
  { value: 'plane', label: 'Travel', Icon: Plane },
  { value: 'dollar-sign', label: 'Finance', Icon: DollarSign },
];

export const getCategoryIcon = (name?: string | null): LucideIcon =>
  CATEGORY_ICONS.find(i => i.value === name)?.Icon ?? Folder;
