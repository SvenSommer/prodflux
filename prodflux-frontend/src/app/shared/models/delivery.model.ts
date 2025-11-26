export interface DeliveryItem {
  material: number;
  quantity: number;
  note?: string;
}

export interface DeliveryOrderDetail {
  id: number;
  order_number: string;
  supplier: number;
  supplier_name: string;
}

export interface Delivery {
  id: number;
  workshop: number | string;
  created_at: string;
  note?: string;
  order?: number | null;   // FK to Order (optional)
  order_detail?: DeliveryOrderDetail | null;  // Order details if order exists
  items: DeliveryItem[];
  workshop_name?: string;  // optional, if backend provides it
}

export interface CreateOrUpdateDelivery {
  workshop: number;
  note?: string;
  order?: number | null;   // FK to Order (optional)
  items: DeliveryItem[];
}
