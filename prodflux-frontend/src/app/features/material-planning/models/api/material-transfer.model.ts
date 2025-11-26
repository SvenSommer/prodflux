/**
 * MaterialTransfer-related API models (matching OpenAPI schema)
 * All decimal fields are modeled as strings (as per backend API)
 */

export interface MaterialTransferItem {
  readonly id: number;
  material: number;
  /** Decimal string (e.g., "100.00") */
  quantity: string;
}

export interface MaterialTransfer {
  readonly id: number;
  source_workshop: number;
  target_workshop: number;
  /** ISO datetime string */
  readonly created_at: string;
  note?: string;
  items: MaterialTransferItem[];
}

export interface MaterialTransferItemRequest {
  material: number;
  /** Decimal string (e.g., "100.00") */
  quantity: string;
}

export interface MaterialTransferRequest {
  source_workshop: number;
  target_workshop: number;
  note?: string;
  items: MaterialTransferItemRequest[];
}
