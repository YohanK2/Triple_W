import { Salad, Beef, CakeSlice, CupSoda, Leaf } from 'lucide-react';
import { categoryLabel } from '../services/format';

const CATEGORY_ICONS = {
  entrada: Salad,
  plato_fuerte: Beef,
  postre: CakeSlice,
  bebida: CupSoda,
  acompanamiento: Leaf,
};

export default function CategoryBadge({ category, size = 14 }) {
  const Icon = CATEGORY_ICONS[category] || Salad;
  return (
    <span className="text-icon">
      <Icon size={size} />
      {categoryLabel(category)}
    </span>
  );
}
