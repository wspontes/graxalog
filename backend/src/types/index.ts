export type UserRole = 'admin' | 'delivery';

export interface User {
  id: number;
  name: string;
  phone: string;
  login: string;
  password_hash: string;
  role: UserRole;
  active: boolean;
  first_access: boolean;
  created_at: Date;
  updated_at: Date;
}

export type PackageStatus =
  | 'imported'
  | 'conferenced'
  | 'in_stock'
  | 'in_route'
  | 'delivered'
  | 'absent'
  | 'third_party';

export interface Package {
  id: number;
  code: string;
  recipient: string;
  address: string;
  neighborhood: string;
  city: string;
  zip_code: string;
  observations: string;
  status: PackageStatus;
  import_batch_id: number;
  qr_code_data: string;
  latitude: number | null;
  longitude: number | null;
  geocode_status: 'pending' | 'success' | 'failed';
  created_at: Date;
  updated_at: Date;
}

export type RouteStatus =
  | 'not_started'
  | 'in_progress'
  | 'partially_completed'
  | 'completed';

export interface Route {
  id: number;
  name: string;
  delivery_person_id: number;
  status: RouteStatus;
  started_at: Date | null;
  finished_at: Date | null;
  total_packages: number;
  delivered_count: number;
  absent_count: number;
  third_party_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface RoutePackage {
  id: number;
  route_id: number;
  package_id: number;
  stop_order: number;
  status: PackageStatus;
  delivered_at: Date | null;
  photo_url: string | null;
  notes: string;
  created_at: Date;
  updated_at: Date;
}

export interface PackageHistory {
  id: number;
  package_id: number;
  status: string;
  description: string;
  changed_by: number;
  created_at: Date;
}

export interface ImportBatch {
  id: number;
  filename: string;
  method: 'xlsx' | 'pdf' | 'manual_photo';
  photo_url: string | null;
  total_packages: number;
  imported_by: number;
  created_at: Date;
}

export interface Photo {
  id: number;
  url: string;
  entity_type: 'import_batch' | 'delivery_proof';
  entity_id: number;
  created_at: Date;
}
