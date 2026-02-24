import { useMemo } from 'react';

interface WeatherEffectsProps {
  condition?: 'sunny' | 'rainy' | 'snowy' | 'overcast';
  isVisible: boolean;
  imageBounds?: { left: number; width: number } | null;
}

// Generate random but deterministic positions for particles
function generateParticles(count: number, seed: number) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const pseudoRandom = ((seed + i) * 9301 + 49297) % 233280;
    const left = (pseudoRandom / 233280) * 100;
    const delay = ((pseudoRandom * 7) % 233280) / 233280 * 5;
    const duration = 1 + ((pseudoRandom * 3) % 233280) / 233280 * 2;
    const size = 0.5 + ((pseudoRandom * 11) % 233280) / 233280 * 1;
    particles.push({ left, delay, duration, size, id: i });
  }
  return particles;
}

function generateBirds(count: number, seed: number) {
  const birds = [];
  for (let i = 0; i < count; i++) {
    const pseudoRandom = ((seed + i * 23) * 9301 + 49297) % 233280;
    const top = 10 + ((pseudoRandom * 5) % 233280) / 233280 * 30;
    const delay = ((pseudoRandom * 11) % 233280) / 233280 * 20;
    const duration = 20 + ((pseudoRandom * 7) % 233280) / 233280 * 15;
    const scale = 0.6 + ((pseudoRandom * 13) % 233280) / 233280 * 0.6;
    const flapSpeed = 0.3 + ((pseudoRandom * 17) % 233280) / 233280 * 0.3;
    birds.push({ top, delay, duration, scale, flapSpeed, id: i });
  }
  return birds;
}

function BirdSVG({ className, style, flapDuration }: { className?: string; style?: React.CSSProperties; flapDuration: number }) {
  return (
    <svg 
      viewBox="0 0 24 14" 
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path 
        d="M12 7 Q8 3 2 5"
        className="origin-[12px_7px]"
        style={{ animation: `wing-flap-left ${flapDuration}s ease-in-out infinite` }}
      />
      <path 
        d="M12 7 Q16 3 22 5"
        className="origin-[12px_7px]"
        style={{ animation: `wing-flap-right ${flapDuration}s ease-in-out infinite` }}
      />
    </svg>
  );
}

function AirplaneSVG({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 32 12"
      className={className}
      style={style}
      fill="currentColor"
    >
      <path d="M2 6 Q0 6 2 5 L24 4 Q28 3 30 6 Q28 9 24 8 L2 7 Q0 6 2 6Z" />
      <path d="M10 4 L14 0 L18 0 L15 4Z" />
      <path d="M3 5 L1 1 L6 1 L5 4Z" />
      <path d="M10 8 L14 12 L18 12 L15 8Z" />
    </svg>
  );
}

export function WeatherEffects({ condition, isVisible, imageBounds }: WeatherEffectsProps) {
  const rainDrops = useMemo(() => generateParticles(30, 42), []);
  const snowflakes = useMemo(() => generateParticles(25, 73), []);
  const birds = useMemo(() => generateBirds(3, 89), []);
  const airplane = useMemo(() => {
    const seed = 157;
    const pseudoRandom = ((seed) * 9301 + 49297) % 233280;
    const top = 5 + ((pseudoRandom * 5) % 233280) / 233280 * 10;
    const delay = 25 + ((pseudoRandom * 11) % 233280) / 233280 * 15;
    const duration = 12 + ((pseudoRandom * 7) % 233280) / 233280 * 3;
    return { top, delay, duration };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden">

      {/* Animated birds - show for sunny and overcast, constrained to image bounds */}
      {(condition === 'sunny' || condition === 'overcast') && imageBounds && (
        <div 
          className="absolute inset-y-0 overflow-hidden"
          style={{
            left: imageBounds.left,
            width: imageBounds.width,
          }}
        >
          {birds.map((bird) => (
            <div
              key={bird.id}
              className="absolute animate-bird-fly text-foreground/60"
              style={{
                top: `${bird.top}%`,
                animationDelay: `${bird.delay}s`,
                animationDuration: `${bird.duration}s`,
              }}
            >
              <BirdSVG
                className="w-6 md:w-8"
                flapDuration={bird.flapSpeed}
                style={{
                  transform: `scale(${bird.scale})`,
                }}
              />
            </div>
          ))}
          {/* Airplane - flies occasionally, higher and faster than birds */}
          <div
            className="absolute animate-plane-fly text-foreground/50"
            style={{
              top: `${airplane.top}%`,
              animationDelay: `${airplane.delay}s`,
              animationDuration: `${airplane.duration}s`,
            }}
          >
            <AirplaneSVG className="w-10 md:w-14" />
          </div>
        </div>
      )}

      {/* Rain effect */}
      {condition === 'rainy' && (
        <div className="absolute inset-0">
          {rainDrops.map((drop) => (
            <div
              key={drop.id}
              className="absolute w-0.5 bg-gradient-to-b from-transparent via-blue-300/60 to-blue-400/80 rounded-full animate-rain-fall"
              style={{
                left: `${drop.left}%`,
                height: `${12 + drop.size * 8}px`,
                animationDelay: `${drop.delay}s`,
                animationDuration: `${0.6 + drop.duration * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Snow effect */}
      {condition === 'snowy' && (
        <div className="absolute inset-0">
          {snowflakes.map((flake) => (
            <div
              key={flake.id}
              className="absolute rounded-full bg-white/80 animate-snow-fall"
              style={{
                left: `${flake.left}%`,
                width: `${3 + flake.size * 4}px`,
                height: `${3 + flake.size * 4}px`,
                animationDelay: `${flake.delay}s`,
                animationDuration: `${4 + flake.duration * 3}s`,
                boxShadow: '0 0 4px rgba(255,255,255,0.8)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}