'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
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

export default function DeliveryMap({ packages, geocoding, onGeocode }: { packages: Package[]; geocoding?: boolean; onGeocode?: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
    setMounted(true);
  }, []);

  const coords: [number, number][] = packages
    .filter(p => p.latitude && p.longitude)
    .map(p => [Number(p.latitude), Number(p.longitude)]);

  const hasCoords = coords.length > 0;

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
        <div className="rounded-xl overflow-hidden border h-[300px] lg:h-[400px]">
          <MapContainer center={
            coords.length === 1
              ? coords[0]
              : [coords.reduce((s, c) => s + c[0], 0) / coords.length, coords.reduce((s, c) => s + c[1], 0) / coords.length]
          } zoom={14} className="h-full w-full" scrollWheelZoom>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {coords.length > 1 && <Polyline positions={coords} color="#3b82f6" weight={3} opacity={0.6} />}
            {packages.filter(p => p.latitude && p.longitude).map((pkg, i) => (
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
        </div>
      )}
      <div className="mt-3 space-y-2">
        {packages.map((pkg, i) => (
          <div key={pkg.package_id} className="flex items-center justify-between bg-white rounded-lg border p-3 text-sm">
            <div className="flex-1 min-w-0 mr-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold mr-2 shrink-0" style={{ backgroundColor: colors[i % colors.length] }}>
                {i + 1}
              </span>
              <span className="font-medium">{pkg.recipient}</span>
              <span className="text-gray-500 ml-1">— {fullAddress(pkg)}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(pkg))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 underline whitespace-nowrap"
              >
                Google Maps
              </a>
              {pkg.latitude && pkg.longitude && (
                <a
                  href={`https://www.waze.com/ul?ll=${pkg.latitude},${pkg.longitude}&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline whitespace-nowrap ml-2"
                >
                  Waze
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
