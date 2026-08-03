import { ShoppingCart, ClipboardCheck, Truck, Boxes, LogOut } from "lucide-react";

export const NAV_ICONS = {
  commande: ShoppingCart,
  preparation: ClipboardCheck,
  livraison: Truck,
  stock: Boxes,
  logout: LogOut,
} as const;
