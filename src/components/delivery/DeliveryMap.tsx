'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

interface Package {
  package_id: number;
  stop_order?: number;
  recipient: string;
  address: string;
  neighborhood: string;
  city: string;
  latitude?: string | number;
  longitude?: string | number;
  status: string;
}

const colors = ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4897', '#14b8a6'];

function getIcon(index: number) {
  const color = colors[index % colors.length];
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function fullAddress(pkg: Package) {
  return [pkg.address, pkg.neighborhood, pkg.city].filter(Boolean).join(', ');
}

function haversine(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const sLat = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(sLat), Math.sqrt(1 - sLat));
  return R * c;
}

function nearestNeighbor(start: [number, number], points: [number, number][]): number[] {
  const visited = new Set<number>();
  const order: number[] = [];
  let current = start;
  while (order.length < points.length) {
    let nearest = -1;
    let minDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      if (!visited.has(i)) {
        const d = haversine(current, points[i]);
        if (d < minDist) { minDist = d; nearest = i; }
      }
    }
    if (nearest === -1) break;
    visited.add(nearest);
    order.push(nearest);
    current = points[nearest];
  }
  return order;
}

function MapController({ coords }: { coords: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      map.invalidateSize();
      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
      setTimeout(() => map.invalidateSize(), 300);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [coords.length]);

  return null;
}

export default function DeliveryMap({ packages, geocoding, onGeocode, onReorder, visible = true }: { packages: Package[]; geocoding?: boolean; onGeocode?: () => void; onReorder?: (ordered: Package[]) => void; visible?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [ordered, setOrdered] = useState<Package[]>(packages);
  const [optimizing, setOptimizing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const prevPkgRef = useRef(packages);

  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
    setMounted(true);
  }, []);

  useEffect(() => {
    setOrdered(packages);
    prevPkgRef.current = packages;
  }, [packages]);

  const displayPackages = ordered;
  const coords: [number, number][] = displayPackages
    .filter(p => p.latitude && p.longitude)
    .map(p => [Number(p.latitude), Number(p.longitude)]);
  const hasCoords = coords.length > 0;

  const handleOptimize = useCallback(async () => {
    let pos = userPos;
    if (!pos) {
      setOptimizing(true);
      try {
        const p = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 }));
        pos = [p.coords.latitude, p.coords.longitude];
        setUserPos(pos);
      } catch {
        setOptimizing(false);
        return;
      }
    }
    const withCoords = displayPackages.filter(p => p.latitude && p.longitude);
    if (withCoords.length < 2) { setOptimizing(false); return; }
    const pts: [number, number][] = withCoords.map(p => [Number(p.latitude), Number(p.longitude)]);
    const idxOrder = nearestNeighbor(pos, pts);
    const reordered = idxOrder.map(i => withCoords[i]);
    const without = displayPackages.filter(p => !p.latitude || !p.longitude);
    setOrdered([...reordered, ...without]);
    setOptimizing(false);
    onReorder?.([...reordered, ...without]);
  }, [userPos, displayPackages, onReorder]);

  const mapsUrl = hasCoords && coords.length > 0
    ? `https://www.google.com/maps/dir/${userPos ? `${userPos[0]},${userPos[1]}` : ''}/${coords.map(c => `${c[0]},${c[1]}`).join('/')}`
    : '#';

  const mapHeight = fullscreen ? 'calc(100vh - 120px)' : '280px';
  const showMap = mounted && visible && hasCoords;

  if (!mounted) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center text-gray-400 text-sm">
        Carregando mapa...
      </div>
    );
  }

  if (!hasCoords && !onGeocode) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center text-gray-400 text-sm">
        Mapa indisponível — pacotes sem coordenadas
      </div>
    );
  }

  return (
    <div>
      {!hasCoords && onGeocode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-center">
          <p className="text-amber-800 text-sm mb-3">
            Os pacotes desta rota não possuem coordenadas geográficas. Clique abaixo para geocodificar os endereços automaticamente.
          </p>
          <button
            onClick={onGeocode}
            disabled={geocoding}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            {geocoding ? 'Geocodificando...' : 'Geocodificar Endereços'}
          </button>
        </div>
      )}
      {hasCoords && (
        <>
          <div className="flex gap-2 mb-2">
            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {optimizing ? 'Otimizando...' : userPos ? 'Reordenar por Proximidade' : 'Otimizar Rota (usar localização)'}
            </button>
            {coords.length > 0 && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 whitespace-nowrap"
              >
                Google Maps
              </a>
            )}
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="py-2 px-3 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
            >
              {fullscreen ? '✕' : '⛶'}
            </button>
          </div>
          <div className="rounded-xl overflow-hidden border" style={{ height: mapHeight, minHeight: mapHeight }}>
            {showMap && (
              <MapContainer
                key={`${fullscreen}-${coords.length}`}
                center={coords[0]}
                zoom={14}
                className="h-full w-full"
                scrollWheelZoom={true}
                zoomControl={true}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController coords={coords} />
                {coords.length > 1 && <Polyline positions={coords} color="#3b82f6" weight={3} opacity={0.6} />}
                {displayPackages.filter(p => p.latitude && p.longitude).map((pkg, i) => (
                  <Marker key={pkg.package_id} position={[Number(pkg.latitude), Number(pkg.longitude)]} icon={getIcon(i)}>
                    <Popup>
                      <div className="text-xs">
                        <strong>#{i + 1} - {pkg.recipient}</strong><br />
                        {fullAddress(pkg)}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </>
      )}
      <div className={`mt-3 space-y-2 ${fullscreen ? 'max-h-40 overflow-y-auto' : ''}`}>
        {displayPackages.map((pkg, i) => (
          <div key={pkg.package_id} className="flex items-center justify-between bg-white rounded-lg border p-3 text-sm">
            <div className="flex-1 min-w-0 mr-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold mr-2 shrink-0" style={{ backgroundColor: colors[i % colors.length] }}>
                {i + 1}
              </span>
              <span className="font-medium">{pkg.recipient}</span>
              <span className="text-gray-500 ml-1">— {fullAddress(pkg)}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(pkg))}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline whitespace-nowrap">Maps</a>
              {pkg.latitude && pkg.longitude && (
                <a href={`https://www.waze.com/ul?ll=${pkg.latitude},${pkg.longitude}&navigate=yes`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline whitespace-nowrap ml-2">Waze</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
