import { useEffect, useState } from 'react';

/**
 * Лёгкая анимация конфетти без внешних зависимостей — на чистом CSS,
 * ~30 div-частиц с случайным цветом/задержкой/траекторией. Триггерится
 * монтированием компонента (родитель решает, когда показать — на
 * 100% чек-листе или идеальном ordering), сам себя размонтирует через
 * 2.5с через колбэк onDone.
 */
const COLORS = ['#0F6E56', '#CEEEE0', '#DDE5DC', '#F2C94C', '#EB5757'];

export function Confetti({ onDone }: { onDone?: () => void }) {
  const [pieces] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 1.6 + Math.random() * 0.9,
      color: COLORS[i % COLORS.length],
      rotate: Math.random() * 360,
    })),
  );

  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-10px',
            width: 8,
            height: 8,
            background: p.color,
            borderRadius: 2,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          to { transform: translateY(110vh) rotate(720deg); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
