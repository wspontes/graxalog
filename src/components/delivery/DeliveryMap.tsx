'use client';
import { useEffect, useState } from 'react';

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

export default function DeliveryMap({ packages }: { packages: Package[] }) {
  const [ready, setReady] = useState(false);
  const coords: [number, number][] = packages
    .filter(p => p.latitude && p.longitude)
    .map(p => [Number(p.latitude), Number(p.longitude)]);

  useEffect(() => {
    import('leaflet').then(L => {
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready || coords.length === 0) return;
    let map: any = null;
    let markers: any[] = [];

    (async () => {
      const L = await import('leaflet');
      const { MapContainer, TileLayer, Marker, Popup, Polyline } = await import('react-leaflet');

      const el = document.getElementById('delivery-map');
      if (!el) return;
      el.innerHTML = '';

      const center: [number, number] = coords.length === 1
        ? [coords[0][0], coords[0][1]]
        : [
            coords.reduce((s, c) => s + c[0], 0) / coords.length,
            coords.reduce((s, c) => s + c[1], 0) / coords.length,
          ];

      const colors = ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4897', '#14b8a6'];

      const React = await import('react');
      const { createRoot } = await import('react-dom/client');

      const root = createRoot(el);

      root.render(
        React.createElement(MapContainer, { center, zoom: 14, className: 'h-full w-full', scrollWheelZoom: true },
          React.createElement(TileLayer, { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' }),
          coords.length > 1 && React.createElement(Polyline, { positions: coords, color: '#3b82f6', weight: 3, opacity: 0.6 }),
          packages.filter(p => p.latitude && p.longitude).map((pkg, i) => {
            const color = colors[i % colors.length];
            const icon = L.divIcon({
              className: '',
              html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${i + 1}</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
              popupAnchor: [0, -16],
            });
            return React.createElement(Marker, { key: pkg.package_id, position: [Number(pkg.latitude), Number(pkg.longitude)], icon },
              React.createElement(Popup, null,
                React.createElement('div', { className: 'text-xs' },
                  React.createElement('strong', null, pkg.recipient),
                  React.createElement('br'),
                  pkg.address,
                  React.createElement('br'),
                  `${pkg.neighborhood}${pkg.city ? `, ${pkg.city}` : ''}`
                )
              )
            );
          })
        )
      );
    })();

    return () => {
      const el = document.getElementById('delivery-map');
      if (el) el.innerHTML = '';
    };
  }, [ready, coords.length]);

  if (coords.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center text-gray-400 text-sm">
        Mapa indisponível — pacotes sem coordenadas
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border h-[300px] lg:h-[400px]">
      <div id="delivery-map" className="h-full w-full" />
    </div>
  );
}
