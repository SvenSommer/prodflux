export interface Product {
  id: number;
  bezeichnung: string;
  artikelnummer: string;
  // optional:
  deprecated?: boolean;
}
