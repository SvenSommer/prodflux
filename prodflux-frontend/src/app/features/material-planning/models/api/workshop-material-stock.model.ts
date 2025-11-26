// Backend TODO: OpenAPI ergänzt Response-Schema für /material-stock/.
// Annahme (bitte ggf. an echte API anpassen): pro Eintrag materialId + quantity.
// Basierend auf WorkshopService.getStock() Response-Format
export interface WorkshopMaterialStockItem {
  material: number;     // materialId
  quantity: number;     // current stock in this workshop
}
