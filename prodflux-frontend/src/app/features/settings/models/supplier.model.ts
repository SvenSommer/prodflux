export interface Supplier {
  id: number;
  name: string;
  url: string;
  kundenkonto: string;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierRequest {
  name: string;
  url?: string;
  kundenkonto?: string;
  notes?: string;
  is_active?: boolean;
}
