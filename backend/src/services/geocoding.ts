import { env } from '../config/env';

export async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${env.MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
    return null;
  } catch {
    return null;
  }
}

export async function geocodeBatch(packages: { id: number; address: string }[]): Promise<void> {
  const { query } = await import('../config/database');
  for (const pkg of packages) {
    const result = await geocode(pkg.address);
    if (result) {
      await query(
        "UPDATE packages SET latitude = $1, longitude = $2, geocode_status = 'success', updated_at = NOW() WHERE id = $3",
        [result.lat, result.lng, pkg.id]
      );
    } else {
      await query(
        "UPDATE packages SET geocode_status = 'failed', updated_at = NOW() WHERE id = $1",
        [pkg.id]
      );
    }
  }
}
