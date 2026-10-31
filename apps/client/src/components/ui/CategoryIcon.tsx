import {
  Banknote,
  Bath,
  Beer,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CirclePlus,
  Coins,
  Dumbbell,
  Ellipsis,
  Flame,
  Fuel,
  Gamepad2,
  Gift,
  Hammer,
  HandCoins,
  HeartHandshake,
  HeartPulse,
  House,
  KeyRound,
  Landmark,
  ParkingSquare,
  PawPrint,
  PiggyBank,
  Plane,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Tag,
  Theater,
  Train,
  TrendingUp,
  Trophy,
  Undo2,
  UtensilsCrossed,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// Icônes des catégories, nommées comme dans le seed (apps/api/prisma/seed.ts).
// Import explicite plutôt que `import * as Icons` : ce dernier embarquait toute la bibliothèque
// (plus de 1 500 icônes) dans le code de chaque page, pour 38 icônes réellement utilisées.
const icons: Record<string, LucideIcon> = {
  Banknote,
  Bath,
  Beer,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CirclePlus,
  Coins,
  Dumbbell,
  Ellipsis,
  Flame,
  Fuel,
  Gamepad2,
  Gift,
  Hammer,
  HandCoins,
  HeartHandshake,
  HeartPulse,
  House,
  KeyRound,
  Landmark,
  ParkingSquare,
  PawPrint,
  PiggyBank,
  Plane,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Tag,
  Theater,
  Train,
  TrendingUp,
  Trophy,
  Undo2,
  UtensilsCrossed,
  Wallet,
  Wrench,
};

interface CategoryIconProps {
  name: string | null;
  className?: string;
}

export default function CategoryIcon({ name, className }: CategoryIconProps) {
  const Icon = name ? icons[name] : undefined;
  if (!Icon) return null;
  return <Icon size={14} className={className} />;
}
