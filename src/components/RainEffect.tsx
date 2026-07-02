import React, { useEffect, useState } from "react";

interface Raindrop {
  id: number;
  left: string;
  delay: string;
  duration: string;
  opacity: number;
  height: string;
  color: string;
}

export const RainEffect: React.FC = () => {
  const [drops, setDrops] = useState<Raindrop[]>([]);

  useEffect(() => {
    // Elegant neon shades matching trading/premium vibe
    const colorPalette = [
      "rgba(16, 185, 129, 0.45)",  // Bullish Emerald Green
      "rgba(56, 189, 248, 0.5)",   // Premium Sky Blue
      "rgba(139, 92, 246, 0.45)",  // Royal Purple
      "rgba(236, 72, 153, 0.35)",  // Glowing Pink
    ];

    const generatedDrops: Raindrop[] = Array.from({ length: 45 }).map((_, i) => {
      const left = `${Math.random() * 100}%`;
      const delay = `${Math.random() * 2.5}s`;
      const duration = `${0.9 + Math.random() * 1.3}s`;
      const opacity = 0.15 + Math.random() * 0.55;
      const height = `${35 + Math.random() * 45}px`;
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];

      return {
        id: i,
        left,
        delay,
        duration,
        opacity,
        height,
        color,
      };
    });

    setDrops(generatedDrops);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 select-none">
      <style>{`
        @keyframes rainFall {
          0% {
            transform: translateY(-130%);
          }
          100% {
            transform: translateY(920px);
          }
        }
        .raindrop-vip {
          position: absolute;
          width: 1.5px;
          background: linear-gradient(to bottom, transparent, var(--rain-color));
          border-radius: 99px;
          animation: rainFall var(--rain-duration) linear infinite;
          animation-delay: var(--rain-delay);
          opacity: var(--rain-opacity);
        }
      `}</style>

      {drops.map((drop) => (
        <div
          key={drop.id}
          className="raindrop-vip"
          style={{
            left: drop.left,
            height: drop.height,
            top: "-50px",
            "--rain-duration": drop.duration,
            "--rain-delay": drop.delay,
            "--rain-opacity": drop.opacity,
            "--rain-color": drop.color,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default RainEffect;
