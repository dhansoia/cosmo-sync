'use client';

interface Planet {
  id: string; name: string; symbol: string;
  sign: string; degree: number; minutes: number;
  nakshatra: string; nakshatraLord: string;
  subLord: string; subSubLord: string;
  lagnaHouse: number;
}

export function PlanetsSubTable({ planets }: { planets: Planet[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="text-white/30 text-xs mb-3 px-1">
        KP System — Krishnamurti Paddhati sub-lords based on Vimshottari dasha periods
      </div>
      <table className="w-full text-xs border-collapse min-w-[480px]">
        <thead>
          <tr className="border-b border-white/10">
            {['Planet','Sign','Degree','Nakshatra','Lord','Sub-Lord','Sub-Sub-Lord','House'].map((h) => (
              <th key={h} className="px-2 py-2 text-left text-white/35 font-medium uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {planets.map((p, i) => (
            <tr
              key={p.id}
              className={`border-b border-white/[0.05] ${i % 2 === 0 ? 'bg-white/[0.015]' : ''} hover:bg-white/[0.04] transition-colors`}
            >
              <td className="px-2 py-2 text-white/80 font-medium">
                <span className="mr-1.5 text-white/40">{p.symbol}</span>{p.name}
              </td>
              <td className="px-2 py-2 text-white/60">{p.sign}</td>
              <td className="px-2 py-2 text-white/55 font-mono">
                {p.degree}°{String(p.minutes).padStart(2,'0')}′
              </td>
              <td className="px-2 py-2 text-white/55">{p.nakshatra}</td>
              <td className="px-2 py-2 text-violet-300/70">{p.nakshatraLord}</td>
              <td className="px-2 py-2 text-amber-300/80 font-medium">{p.subLord}</td>
              <td className="px-2 py-2 text-sky-300/70">{p.subSubLord}</td>
              <td className="px-2 py-2">
                <span className="px-1.5 py-0.5 rounded-md bg-white/6 text-white/50 font-mono text-[11px]">
                  H{p.lagnaHouse}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
