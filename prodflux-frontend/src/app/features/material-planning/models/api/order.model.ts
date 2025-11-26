/**
 * Order-related API models (matching OpenAPI schema)
 * All decimal fields are modeled as strings (as per backend API)
 */

export interface OrderItem {
  readonly id: number;
  material: number;
  /** Decimal string (e.g., "100.00") */
  quantity: string;
  /** Decimal string (e.g., "5.50") */
  preis_pro_stueck: string;
  /** Total price (decimal string) */
  readonly total_price?: string;
}

export interface Order {
  readonly id: number;
  /** ISO date string (YYYY-MM-DD) */
  bestellt_am: string;
  /** ISO date string (YYYY-MM-DD) - nullable, null means order is "open" */
  angekommen_am: string | null;
  notiz?: string;
  /** Total order cost (decimal string) */
  readonly total_cost?: string;
  items: OrderItem[];
}

export interface OrderItemRequest {
  material: number;
  /** Decimal string (e.g., "100.00") */
  quantity: string;
  /** Decimal string (e.g., "5.50") */
  preis_pro_stueck: string;
}

export interface OrderRequest {
  /** ISO date string (YYYY-MM-DD) */
  bestellt_am: string;
  /** ISO date string (YYYY-MM-DD) - optional */
  angekommen_am?: string | null;
  notiz?: string;
  items: OrderItemRequest[];
}
