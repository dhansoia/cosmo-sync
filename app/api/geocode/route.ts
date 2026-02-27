/**
 * GET /api/geocode?q=<city>
 *
 * Server-side proxy to Nominatim (OpenStreetMap geocoding).
 * Proxying server-side:
 *   - Hides the User-Agent requirement from the client
 *   - Allows future rate-limiting / caching without client changes
 *
 * Response: { id: number; label: string; lat: number; lng: number }[]
 */

import { NextRequest, NextResponse } from 'next/server';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([], { status: 200 });
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '1');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'CosmoSync/1.0 (contact@cosmo.app)',
        'Accept-Language': 'en',
      },
      // Nominatim asks for max 1 req/s; next.js fetch cache helps in production
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 502 });
    }

    const data: NominatimResult[] = await res.json();

    const results = data.map((r) => ({
      id:    r.place_id,
      label: r.display_name,
      lat:   parseFloat(r.lat),
      lng:   parseFloat(r.lon),
    }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Failed to reach geocoding service' }, { status: 502 });
  }
}
