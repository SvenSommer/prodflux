/**
 * Production target for a specific product in a specific workshop.
 * Replaces GlobalProductTarget with workshop-specific production planning.
 */
export interface WorkshopProductTarget {
  /** The product to be manufactured */
  productId: number;
  /** Quantity to produce */
  quantity: number;
  /** The workshop where this product will be manufactured */
  workshopId: number;
}
