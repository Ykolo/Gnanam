import { ShoppingCart, ClipboardCheck, ShieldCheck, Truck, Boxes, BarChart3, LogOut } from "lucide-react";

export const NAV_ICONS = {
  commande: ShoppingCart,
  preparation: ClipboardCheck,
  securite: ShieldCheck,
  livraison: Truck,
  stock: Boxes,
  rapports: BarChart3,
  logout: LogOut,
} as const;
