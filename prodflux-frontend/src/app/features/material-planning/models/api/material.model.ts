export interface Material {
  id: number;
  bezeichnung: string;
  bestell_nr?: string | null;
  bild_url?: string | null;
  category?: {
    id: number;
    name: string;
    order: number;
  } | null;
  // optional:
  deprecated?: boolean;
}
