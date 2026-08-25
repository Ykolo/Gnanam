import {
  ShoppingCart,
  ClipboardCheck,
  ShieldCheck,
  Truck,
  Boxes,
  BarChart3,
  LogOut,
  ReceiptText,
  Tags,
} from "lucide-react";

export const NAV_ICONS = {
  commande: ShoppingCart,
  historique: ReceiptText,
  preparation: ClipboardCheck,
  securite: ShieldCheck,
  livraison: Truck,
  stock: Boxes,
  references: Tags,
  rapports: BarChart3,
  logout: LogOut,
} as const;
