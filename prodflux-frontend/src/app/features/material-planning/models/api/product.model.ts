export interface Product {
  id: number;
  bezeichnung: string;
  artikelnummer: string;
  bild_url?: string | null;
  // optional:
  deprecated?: boolean;
}
