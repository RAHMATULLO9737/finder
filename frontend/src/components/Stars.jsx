import { Star } from 'lucide-react';

export function Stars({ value = 0, size = 15 }) {
  const filled = Math.round(value);
  return (
    <span className="stars" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= filled ? 'on' : ''} fill={i <= filled ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <span className="stars input">
      {[1, 2, 3, 4, 5].map((i) => (
        <button type="button" key={i} onClick={() => onChange(i)} aria-label={`${i} yulduz`}>
          <Star size={26} className={i <= value ? 'on' : ''} fill={i <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </span>
  );
}
