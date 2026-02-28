'use client';

interface Planet {
  id: string; name: string; symbol: string;
  lagnaHouse: number; bhavaHouse: number;
  sign: string; degree: number; minutes: number;
}

export function ChaliTable({ planets }: { planets: Planet[] }) {
  return (
    <div className="w-full overflow-x-auto space-y-3">
      <p className="text-white/25 text-xs px-1">
        Chalit (Bhava) chart uses equal-house cusps from the exact Ascendant degree.
        Planets near a cusp may shift to the next/previous house compared to the Rashi chart.
      </p>
      <table className="w-full text-xs border-collapse min-w-[420px]">
        <thead>
          <tr className="border-b border-white/10">
            {['Planet','Sign & Degree','Rashi House','Chalit House','Change'].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-white/35 font-medium uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {planets.map((p, i) => {
            const shifted = p.lagnaHouse !== p.bhavaHouse;
            return (
              <tr
                key={p.id}
                className={`border-b border-white/[0.05] ${i % 2 === 0 ? 'bg-white/[0.015]' : ''} hover:bg-white/[0.04] transition-colors`}
              >
                <td className="px-3 py-2 text-white/80 font-medium">
                  <span className="mr-1.5 text-white/35">{p.symbol}</span>{p.name}
                </td>
                <td className="px-3 py-2 text-white/55 font-mono">
                  {p.sign} {p.degree}°{String(p.minutes).padStart(2,'0')}′
                </td>
                <td className="px-3 py-2">
                  <span className="px-1.5 py-0.5 rounded bg-white/6 text-white/60 font-mono">
                    H{p.lagnaHouse}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded font-mono font-semibold ${
                    shifted ? 'bg-amber-400/10 text-amber-300' : 'bg-white/6 text-white/60'
                  }`}>
                    H{p.bhavaHouse}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {shifted ? (
                    <span className="text-amber-400/80 text-[10px] font-semibold">
                      H{p.lagnaHouse} → H{p.bhavaHouse}
                    </span>
                  ) : (
                    <span className="text-white/20 text-[10px]">same</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
