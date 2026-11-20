// Driving distance from Forsyth, MO to a customer's address, looked up in the visitor's browser.
// Geocoding: OpenStreetMap Nominatim. Routing: the public OSRM server. Neither needs an API key.
// If either service fails, visitors can still type the miles in by hand.

/** Forsyth, Missouri (town centre). Swap in the exact business address coordinates if preferred. */
export const ORIGIN = { lat: 36.6851, lon: -93.1199 };
const METERS_PER_MILE = 1609.344;

export interface DistanceResult { miles: number; place: string }

export async function drivingMilesTo(address: string, signal?: AbortSignal): Promise<DistanceResult> {
  const q = new URLSearchParams({ format: 'jsonv2', limit: '1', countrycodes: 'us', q: address });
  const geo = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, { signal, headers: { Accept: 'application/json' } });
  if (!geo.ok) throw new Error('lookup');
  const hits = (await geo.json()) as { lat: string; lon: string; display_name: string }[];
  if (!hits.length) throw new Error('notfound');
  const { lat, lon, display_name } = hits[0];

  const route = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${ORIGIN.lon},${ORIGIN.lat};${lon},${lat}?overview=false`,
    { signal },
  );
  if (!route.ok) throw new Error('lookup');
  const data = (await route.json()) as { code: string; routes?: { distance: number }[] };
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('noroute');
  return { miles: Math.ceil(data.routes[0].distance / METERS_PER_MILE), place: display_name };
}
