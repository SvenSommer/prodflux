export interface ProductMaterial {
  id: number;
  product: number;   // productId
  material: number;  // materialId
  quantity_per_unit: string; // decimal string from API
}
