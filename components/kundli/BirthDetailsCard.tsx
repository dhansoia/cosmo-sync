'use client';

interface BirthDetails {
  dateOfBirth:       string;
  timezone:          string;
  latitude:          number;
  longitude:         number;
  isTimeApproximate: boolean;
  ayanamsa:          number;
  julianDay:         number;
}

interface LagnaInfo {
  sign:      string;
  signIndex: number;
  degree:    number;
  minutes:   number;
  longitude: number;
}

interface Props {
  birthDetails: BirthDetails;
  lagna:        LagnaInfo;
}

export function BirthDetailsCard({ birthDetails: bd, lagna }: Props) {
  const dob = new Date(bd.dateOfBirth);
  const dateStr = dob.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: bd.timezone,
  });
  const timeStr = bd.isTimeApproximate
    ? 'Unknown (noon used)'
    : dob.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true, timeZone: bd.timezone,
      });

  const rows: [string, string][] = [
    ['Date of Birth',  dateStr],
    ['Time (Local)',   timeStr],
    ['Timezone',       bd.timezone],
    ['Latitude',       `${bd.latitude >= 0 ? 'N' : 'S'} ${Math.abs(bd.latitude).toFixed(4)}°`],
    ['Longitude',      `${bd.longitude >= 0 ? 'E' : 'W'} ${Math.abs(bd.longitude).toFixed(4)}°`],
    ['Ayanamsa',       `Lahiri — ${bd.ayanamsa.toFixed(4)}°`],
    ['Julian Day',     bd.julianDay.toFixed(4)],
    ['Lagna (ASC)',    `${lagna.sign} ${lagna.degree}°${String(lagna.minutes).padStart(2,'0')}′ (${lagna.longitude.toFixed(2)}°)`],
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value], i) => (
            <tr
              key={label}
              className={`border-b border-white/[0.05] ${i % 2 === 0 ? 'bg-white/[0.015]' : ''}`}
            >
              <td className="px-4 py-2.5 text-white/35 text-xs uppercase tracking-wider w-40 font-medium">
                {label}
              </td>
              <td className="px-4 py-2.5 text-white/75 font-medium">
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
