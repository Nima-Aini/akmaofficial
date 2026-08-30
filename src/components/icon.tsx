import {
  Truck,
  Handshake,
  BadgeCheck,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Package,
  Phone,
  Clock,
  Star,
  Leaf,
  Droplets,
  Gift,
  Award,
  RefreshCcw,
  Store,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Truck,
  Handshake,
  BadgeCheck,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Package,
  Phone,
  Clock,
  Star,
  Leaf,
  Droplets,
  Gift,
  Award,
  RefreshCcw,
  Store,
};

export const ICON_CHOICES = Object.keys(MAP);

export function DynIcon({
  name,
  size = 22,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Cmp = MAP[name] ?? Sparkles;
  return <Cmp size={size} className={className} strokeWidth={1.8} />;
}
