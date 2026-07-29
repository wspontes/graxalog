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

export default function DeliveryMap({ packages }: { packages: Package[] }) {
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

  if (!mounted || coords.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center text-gray-400 text-sm">
        {!mounted ? 'Carregando mapa...' : 'Mapa indisponível — pacotes sem coordenadas'}
      </div>
    );
  }

  const center: [number, number] = coords.length === 1
    ? coords[0]
    : [
        coords.reduce((s, c) => s + c[0], 0) / coords.length,
        coords.reduce((s, c) => s + c[1], 0) / coords.length,
      ];

  return (
    <div className="rounded-xl overflow-hidden border h-[300px] lg:h-[400px]">
      <MapContainer center={center} zoom={14} className="h-full w-full" scrollWheelZoom>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {coords.length > 1 && <Polyline positions={coords} color="#3b82f6" weight={3} opacity={0.6} />}
        {packages.filter(p => p.latitude && p.longitude).map((pkg, i) => (
          <Marker key={pkg.package_id} position={[Number(pkg.latitude), Number(pkg.longitude)]} icon={getIcon(i)}>
            <Popup>
              <div className="text-xs">
                <strong>{pkg.recipient}</strong><br />
                {pkg.address}<br />
                {pkg.neighborhood}{pkg.city ? `, ${pkg.city}` : ''}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
