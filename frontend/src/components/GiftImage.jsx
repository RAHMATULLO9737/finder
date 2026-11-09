import { useState } from 'react';

const GRADIENTS = [
  'linear-gradient(135deg,#7652eb,#b79cff)',
  'linear-gradient(135deg,#ff7aa8,#ffb48a)',
  'linear-gradient(135deg,#2bb6a3,#7be0c3)',
  'linear-gradient(135deg,#4e7bff,#8fd0ff)',
  'linear-gradient(135deg,#f5a524,#ffd479)',
  'linear-gradient(135deg,#a24bd6,#ff8fd2)',
];

// Rasm bo'lmasa yoki yuklanmasa — chiroyli gradient + kategoriya emojisi
export default function GiftImage({ gift, className = '' }) {
  const [badSrc, setBadSrc] = useState('');
  const src = gift.image_src;
  if (src && badSrc !== src) {
    return <img className={`gift-img ${className}`} src={src} alt={gift.name} loading="lazy" onError={() => setBadSrc(src)} />;
  }
  return (
    <div className={`gift-img placeholder ${className}`} style={{ background: GRADIENTS[gift.id % GRADIENTS.length] }}>
      <span>{gift.category_emoji || '🎁'}</span>
    </div>
  );
}
