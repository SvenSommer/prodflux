export interface Material {
  id: number;
  bezeichnung: string;
  bestell_nr?: string | null;
  // optional:
  deprecated?: boolean;
}
