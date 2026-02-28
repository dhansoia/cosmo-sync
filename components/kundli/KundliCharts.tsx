'use client';

import { useEffect, useState } from 'react';
import { SouthIndianChart }  from './SouthIndianChart';
import { PlanetsTable }      from './PlanetsTable';
import { PlanetsSubTable }   from './PlanetsSubTable';
import { PanchangCard }      from './PanchangCard';
import { BirthDetailsCard }  from './BirthDetailsCard';
import { ChaliTable }        from './ChaliTable';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Planet {
  id: string; name: string; symbol: string; abbr: string;
  longitude: number; sign: string; signIndex: number;
  degree: number; minutes: number; seconds: number;
  isRetrograde: boolean;
  nakshatra: string; nakshatraIndex: number; nakshatraLord: string; pada: number;
  lagnaHouse: number; moonHouse: number; bhavaHouse: number;
  navamshaSign: string; navamshaSignIndex: number;
  subLord: string; subSubLord: string;
}

interface ChartApiData {
  birthDetails: {
    dateOfBirth: string; timezone: string;
    latitude: number; longitude: number;
    isTimeApproximate: boolean;
    ayanamsa: number; julianDay: number;
  };
  lagna: {
    longitude: number; sign: string; signIndex: number;
    degree: number; minutes: number;
  };
  planets: Planet[];
  panchang: {
    tithi:     { number: number; name: string; paksha: string };
    vara:      { number: number; name: string };
    nakshatra: { name: string; lord: string; pada: number };
    yoga:      { number: number; name: string };
    karana:    { name: string };
  };
  bhavaCusps: number[];
}

// ── Tabs definition ───────────────────────────────────────────────────────────

type TabId =
  | 'lagna' | 'chalit' | 'moon' | 'navamsha'
  | 'planets' | 'planets-sub' | 'birth-details' | 'panchang' | 'chalit-table';

const TABS: { id: TabId; label: string }[] = [
  { id: 'lagna',        label: 'Lagna'         },
  { id: 'chalit',       label: 'Chalit'        },
  { id: 'moon',         label: 'Moon'          },
  { id: 'navamsha',     label: 'Navamsha'      },
  { id: 'planets',      label: 'Planets'       },
  { id: 'planets-sub',  label: 'Planets-Sub'   },
  { id: 'birth-details',label: 'Birth Details' },
  { id: 'panchang',     label: 'Panchang'      },
  { id: 'chalit-table', label: 'Chalit Table'  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function KundliCharts() {
  const [data,    setData]    = useState<ChartApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState<TabId>('lagna');

  useEffect(() => {
    fetch('/api/kundli/chart')
      .then((r) => r.ok ? r.json() : Promise.reject('Failed'))
      .then((d: ChartApiData) => { setData(d); setLoading(false); })
      .catch(() => { setError('Could not load chart data'); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="h-9 rounded-xl bg-white/5 border border-white/8" />
      <div className="h-72 rounded-2xl bg-white/5 border border-white/8" />
    </div>
  );

  if (error || !data) return (
    <p className="text-red-400/70 text-sm">{error || 'No chart data'}</p>
  );

  const { planets, lagna, birthDetails, panchang } = data;

  // Moon sign index
  const moonPlanet = planets.find((p) => p.id === 'moon');
  const moonSignIdx = moonPlanet?.signIndex ?? lagna.signIndex;

  // Convert planet to entry for SouthIndianChart
  function toEntries(getSign: (p: Planet) => number) {
    return planets.map((p) => ({
      abbr:         p.abbr,
      signIndex:    getSign(p),
      isRetrograde: p.isRetrograde,
    }));
  }

  // Lagna chart: planet in its rashi sign
  const lagnaEntries = toEntries((p) => p.signIndex);

  // Moon chart: planets placed by house from Moon (re-map signIndex)
  const moonEntries = toEntries((p) => (p.signIndex));

  // Navamsha chart: planets in their navamsha sign
  const navEntries = toEntries((p) => p.navamshaSignIndex);

  // Chalit chart: planet in the sign corresponding to its bhava cusp
  const chaliEntries = toEntries((p) => {
    // bhava H starts at bhavaCusp[H-1] → that cusp falls in a sign
    const cuspLon = data.bhavaCusps[p.bhavaHouse - 1];
    return Math.floor(((cuspLon % 360) + 360) % 360 / 30);
  });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">

      {/* Tab bar — scrollable on mobile */}
      <div className="overflow-x-auto pb-0.5">
        <div className="flex gap-1 min-w-max">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`
                px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors
                ${tab === id
                  ? 'bg-white/10 text-white/90 font-medium'
                  : 'text-white/35 hover:text-white/65 hover:bg-white/5'}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content panel */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 sm:p-6">

        {tab === 'lagna' && (
          <div className="space-y-4">
            <TabHeader
              title="Lagna Chart (Rashi / D1)"
              sub={`${lagna.sign} Ascendant — ${lagna.degree}°${String(lagna.minutes).padStart(2,'0')}′`}
            />
            <SouthIndianChart
              entries={lagnaEntries}
              lagnaSignIndex={lagna.signIndex}
              title="Lagna"
            />
          </div>
        )}

        {tab === 'chalit' && (
          <div className="space-y-4">
            <TabHeader
              title="Chalit Chart (Bhava / Equal House)"
              sub="Planets placed in equal-house cusps from the Ascendant"
            />
            <SouthIndianChart
              entries={chaliEntries}
              lagnaSignIndex={lagna.signIndex}
              title="Chalit"
            />
          </div>
        )}

        {tab === 'moon' && (
          <div className="space-y-4">
            <TabHeader
              title="Moon Chart (Chandra Kundli)"
              sub={`${moonPlanet?.sign ?? ''} as the first house`}
            />
            <SouthIndianChart
              entries={moonEntries}
              lagnaSignIndex={moonSignIdx}
              title="Moon"
            />
          </div>
        )}

        {tab === 'navamsha' && (
          <div className="space-y-4">
            <TabHeader
              title="Navamsha Chart (D9)"
              sub="Ninth divisional chart — marriage, dharma, and soul purpose"
            />
            <SouthIndianChart
              entries={navEntries}
              lagnaSignIndex={navamshaLagnaSignIdx(lagna.longitude)}
              title="D9"
            />
          </div>
        )}

        {tab === 'planets' && (
          <div className="space-y-4">
            <TabHeader title="Planets" sub="Sidereal (Lahiri) positions at birth" />
            <PlanetsTable planets={planets} />
          </div>
        )}

        {tab === 'planets-sub' && (
          <div className="space-y-4">
            <TabHeader title="Planets — Sub-Lords" sub="KP Krishnamurti Paddhati — sub and sub-sub lords" />
            <PlanetsSubTable planets={planets} />
          </div>
        )}

        {tab === 'birth-details' && (
          <div className="space-y-4">
            <TabHeader title="Birth Details" sub="Coordinates, ayanamsa, and Julian day" />
            <BirthDetailsCard birthDetails={birthDetails} lagna={lagna} />
          </div>
        )}

        {tab === 'panchang' && (
          <div className="space-y-4">
            <TabHeader title="Panchang" sub="Five limbs of Vedic timekeeping at birth" />
            <PanchangCard panchang={panchang} />
          </div>
        )}

        {tab === 'chalit-table' && (
          <div className="space-y-4">
            <TabHeader title="Chalit Table" sub="Rashi house vs Bhava (Chalit) house comparison" />
            <ChaliTable planets={planets} />
          </div>
        )}

      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TabHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-2">
      <h3 className="text-white/80 text-sm font-semibold">{title}</h3>
      <p className="text-white/30 text-xs mt-0.5">{sub}</p>
    </div>
  );
}

/** Navamsha sign of the ascendant (used as lagna for D9 chart). */
function navamshaLagnaSignIdx(ascLon: number): number {
  const n     = ((ascLon % 360) + 360) % 360;
  const si    = Math.floor(n / 30);
  const degIn = n - si * 30;
  const navIdx = Math.floor(degIn / (30 / 9));
  const NAV_START = [0,9,6,3,0,9,6,3,0,9,6,3];
  return (NAV_START[si] + navIdx) % 12;
}
