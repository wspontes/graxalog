CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  login VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'delivery')),
  active BOOLEAN DEFAULT true,
  first_access BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE import_batches (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255),
  method VARCHAR(20) NOT NULL CHECK (method IN ('xlsx', 'pdf', 'manual_photo')),
  photo_url TEXT,
  total_packages INTEGER DEFAULT 0,
  imported_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE packages (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) NOT NULL,
  recipient VARCHAR(255),
  address TEXT,
  neighborhood VARCHAR(255),
  city VARCHAR(255),
  zip_code VARCHAR(20),
  observations TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'imported'
    CHECK (status IN ('imported','conferenced','in_stock','in_route','delivered','absent','third_party')),
  import_batch_id INTEGER REFERENCES import_batches(id),
  qr_code_data VARCHAR(255),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geocode_status VARCHAR(20) DEFAULT 'pending'
    CHECK (geocode_status IN ('pending','success','failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  delivery_person_id INTEGER REFERENCES users(id),
  status VARCHAR(30) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','partially_completed','completed')),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  total_packages INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  absent_count INTEGER DEFAULT 0,
  third_party_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE route_packages (
  id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
  package_id INTEGER REFERENCES packages(id),
  stop_order INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_route'
    CHECK (status IN ('in_route','delivered','absent','third_party')),
  delivered_at TIMESTAMP,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE package_history (
  id SERIAL PRIMARY KEY,
  package_id INTEGER REFERENCES packages(id),
  status VARCHAR(20) NOT NULL,
  description TEXT,
  changed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('import_batch','delivery_proof')),
  entity_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_packages_code ON packages(code);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_neighborhood ON packages(neighborhood);
CREATE INDEX idx_route_packages_route ON route_packages(route_id);
CREATE INDEX idx_route_packages_package ON route_packages(package_id);
CREATE INDEX idx_package_history_package ON package_history(package_id);
