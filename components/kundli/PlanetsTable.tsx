'use client';

interface Planet {
  id: string; name: string; symbol: string;
  sign: string; degree: number; minutes: number; seconds: number;
  nakshatra: string; nakshatraLord: string; pada: number;
  lagnaHouse: number; isRetrograde: boolean;
}

export function PlanetsTable({ planets }: { planets: Planet[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-xs border-collapse min-w-[560px]">
        <thead>
          <tr className="border-b border-white/10">
            {['Planet','Sign','Degree','Nakshatra','Pd','Lord','House','R'].map((h) => (
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
              <td className="px-2 py-2 text-white/65">{p.sign}</td>
              <td className="px-2 py-2 text-white/60 font-mono">
                {p.degree}°{String(p.minutes).padStart(2,'0')}′{String(p.seconds).padStart(2,'0')}″
              </td>
              <td className="px-2 py-2 text-white/60">{p.nakshatra}</td>
              <td className="px-2 py-2 text-white/40">{p.pada}</td>
              <td className="px-2 py-2 text-white/50">{p.nakshatraLord}</td>
              <td className="px-2 py-2">
                <span className="px-1.5 py-0.5 rounded-md bg-white/6 text-white/60 font-mono text-[11px]">
                  H{p.lagnaHouse}
                </span>
              </td>
              <td className="px-2 py-2 text-center">
                {p.isRetrograde && !['rahu','ketu'].includes(p.id) ? (
                  <span className="text-amber-400/80 text-[10px] font-semibold">R</span>
                ) : (
                  <span className="text-white/15">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
