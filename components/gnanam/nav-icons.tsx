import { ShoppingCart, ClipboardCheck, Truck, LogOut } from "lucide-react";

export const NAV_ICONS = {
  commande: ShoppingCart,
  preparation: ClipboardCheck,
  livraison: Truck,
  logout: LogOut,
} as const;
