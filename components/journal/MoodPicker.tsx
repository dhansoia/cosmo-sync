'use client';

interface MoodPickerProps {
  value:    number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

const LABELS = ['', 'Struggling', 'Off', 'Okay', 'Good', 'Great'];
const COLORS = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export function MoodPicker({ value, onChange, disabled }: MoodPickerProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = value !== null && star <= value;
          const isSelected = star === value;
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => onChange(star)}
              aria-label={`${star} star${star > 1 ? 's' : ''} — ${LABELS[star]}`}
              style={{
                color:      active ? COLORS[value!] : undefined,
                filter:     isSelected ? `drop-shadow(0 0 6px ${COLORS[star]}88)` : undefined,
                transform:  isSelected ? 'scale(1.25)' : undefined,
              }}
              className={`
                text-3xl transition-all duration-150 select-none
                ${active ? '' : 'text-white/15'}
                ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:scale-110'}
              `}
            >
              ★
            </button>
          );
        })}
      </div>

      {/* Label beneath */}
      <p
        className="text-sm font-medium transition-all duration-200"
        style={{ color: value ? COLORS[value] : 'transparent' }}
      >
        {value ? LABELS[value] : '·'}
      </p>
    </div>
  );
}
