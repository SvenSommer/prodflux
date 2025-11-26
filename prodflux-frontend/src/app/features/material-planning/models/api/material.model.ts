export interface Material {
  id: number;
  bezeichnung: string;
  hersteller_bezeichnung?: string;
  bestell_nr?: string | null;
  bild_url?: string | null;
  category?: {
    id: number;
    name: string;
    order: number;
  } | null;
  suppliers?: number[];
  supplier_details?: {
    id: number;
    name: string;
  }[];
  // optional:
  deprecated?: boolean;
}
