import React from 'react';
import {
  Zap,
  Flame,
  Droplets,
  Building2,
  Smartphone,
  Wifi,
  PlayCircle,
  Receipt,
  LucideProps,
} from 'lucide-react';
import { BillCategory } from '@/lib/types';
import { CATEGORY_META } from '@/lib/constants';

interface CategoryIconProps extends LucideProps {
  category: BillCategory;
  showTile?: boolean;
  size?: number;
}

export function CategoryIcon({
  category,
  showTile = false,
  size = 20,
  className = '',
  ...props
}: CategoryIconProps) {
  const meta = CATEGORY_META[category] || CATEGORY_META.other;

  let IconComponent = Receipt;
  switch (category) {
    case 'electricity':
      IconComponent = Zap;
      break;
    case 'gas':
      IconComponent = Flame;
      break;
    case 'water':
      IconComponent = Droplets;
      break;
    case 'maintenance':
      IconComponent = Building2;
      break;
    case 'recharge':
      IconComponent = Smartphone;
      break;
    case 'internet':
      IconComponent = Wifi;
      break;
    case 'subscription':
      IconComponent = PlayCircle;
      break;
    default:
      IconComponent = Receipt;
  }

  // Requirement 1 & 2: Differentiate types by icon shape, not by colour.
  // Grey glass tile with a crisp white icon.
  if (showTile) {
    return (
      <div
        className="category-tile"
        title={meta.label}
      >
        <IconComponent
          size={size}
          color="#FFFFFF"
          strokeWidth={2}
          {...props}
        />
      </div>
    );
  }

  return (
    <IconComponent
      size={size}
      color="#FFFFFF"
      strokeWidth={2}
      className={className}
      {...props}
    />
  );
}
