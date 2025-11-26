/**
 * Order-related API models (matching backend Step 02 schema)
 * Centralized model used across Orders and Material-Planning features
 */

export interface OrderItem {
  id?: number;
  material: number;
  quantity: number;
  preis_pro_stueck: number;
  preis_pro_stueck_mit_versand?: number | null;
  quelle?: string;
}

export interface Order {
  id: number;
  supplier: number;
  order_number: string;
  bestellt_am: string;
  angekommen_am: string | null; // read-only, derived from deliveries
  versandkosten: number | null;
  notiz?: string;
  is_historical: boolean;
  items: OrderItem[];
}

export interface CreateOrUpdateOrder {
  supplier: number; // REQUIRED as of Step 02
  order_number?: string; // optional, auto-generated if empty
  bestellt_am: string;
  versandkosten: number | null;
  notiz?: string;
  is_historical?: boolean;
  items: OrderItem[];
  // Note: angekommen_am is NOT sent (read-only in backend)
}
