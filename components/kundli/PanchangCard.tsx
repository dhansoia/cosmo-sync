'use client';

interface PanchangData {
  tithi:     { number: number; name: string; paksha: string };
  vara:      { number: number; name: string };
  nakshatra: { name: string; lord: string; pada: number };
  yoga:      { number: number; name: string };
  karana:    { name: string };
}

const _VARA_ICONS = ['☀️','🌙','♂️','☿️','♃','♀️','♄'];

export function PanchangCard({ panchang }: { panchang: PanchangData }) {
  const items = [
    {
      label: 'Tithi',
      value: `${panchang.tithi.name} (${panchang.tithi.paksha} ${panchang.tithi.number})`,
      sub:   panchang.tithi.paksha === 'Shukla' ? 'Waxing fortnight' : 'Waning fortnight',
      color: panchang.tithi.paksha === 'Shukla' ? 'text-amber-300' : 'text-violet-300',
    },
    {
      label: 'Vara',
      value: panchang.vara.name,
      sub:   `Day ${panchang.vara.number + 1} of week`,
      color: 'text-sky-300',
    },
    {
      label: 'Nakshatra',
      value: panchang.nakshatra.name,
      sub:   `Pada ${panchang.nakshatra.pada} · Lord: ${panchang.nakshatra.lord}`,
      color: 'text-emerald-300',
    },
    {
      label: 'Yoga',
      value: panchang.yoga.name,
      sub:   `Yoga ${panchang.yoga.number} of 27`,
      color: 'text-rose-300',
    },
    {
      label: 'Karana',
      value: panchang.karana.name,
      sub:   'Half-tithi period',
      color: 'text-orange-300',
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-white/25 text-xs">
        Panchang is computed for the birth date and time.
        Tithi, Vara, and Nakshatra are the five limbs of Vedic timekeeping.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(({ label, value, sub, color }) => (
          <div
            key={label}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 space-y-1"
          >
            <p className="text-white/30 text-[10px] uppercase tracking-widest">{label}</p>
            <p className={`text-sm font-semibold ${color}`}>{value}</p>
            <p className="text-white/30 text-xs">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
