export interface PendingUpdate {
  id: string;
  routeId: number;
  packageId: number;
  status: string;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface DeliveryRoute {
  id: number;
  name: string;
  delivery_person_id: number;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  total_packages: number;
  delivered_count: number;
  absent_count: number;
  third_party_count: number;
  packages?: RoutePackage[];
}

export interface RoutePackage {
  id: number;
  package_id: number;
  stop_order: number;
  status: string;
  delivered_at: string | null;
  photo_url: string | null;
  notes: string;
  code: string;
  recipient: string;
  address: string;
  neighborhood: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}
