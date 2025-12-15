import { useMemo } from 'react';

interface WeatherEffectsProps {
  condition?: 'sunny' | 'rainy' | 'snowy' | 'overcast';
  isVisible: boolean;
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

function generateClouds(count: number, seed: number) {
  const clouds = [];
  for (let i = 0; i < count; i++) {
    const pseudoRandom = ((seed + i * 17) * 9301 + 49297) % 233280;
    const top = 5 + ((pseudoRandom * 3) % 233280) / 233280 * 20;
    const delay = ((pseudoRandom * 7) % 233280) / 233280 * 30;
    const duration = 40 + ((pseudoRandom * 11) % 233280) / 233280 * 40;
    const scale = 0.5 + ((pseudoRandom * 13) % 233280) / 233280 * 1;
    const opacity = 0.3 + ((pseudoRandom * 19) % 233280) / 233280 * 0.4;
    clouds.push({ top, delay, duration, scale, opacity, id: i });
  }
  return clouds;
}

function generateBirds(count: number, seed: number) {
  const birds = [];
  for (let i = 0; i < count; i++) {
    const pseudoRandom = ((seed + i * 23) * 9301 + 49297) % 233280;
    const top = 10 + ((pseudoRandom * 5) % 233280) / 233280 * 30;
    const delay = ((pseudoRandom * 11) % 233280) / 233280 * 20;
    const duration = 8 + ((pseudoRandom * 7) % 233280) / 233280 * 6;
    const scale = 0.6 + ((pseudoRandom * 13) % 233280) / 233280 * 0.6;
    const flapSpeed = 0.3 + ((pseudoRandom * 17) % 233280) / 233280 * 0.3;
    birds.push({ top, delay, duration, scale, flapSpeed, id: i });
  }
  return birds;
}

function CloudSVG({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 100 50" 
      className={className}
      style={style}
      fill="currentColor"
    >
      <ellipse cx="30" cy="35" rx="25" ry="15" />
      <ellipse cx="55" cy="30" rx="30" ry="20" />
      <ellipse cx="75" cy="35" rx="20" ry="12" />
      <ellipse cx="45" cy="25" rx="20" ry="15" />
    </svg>
  );
}

function BirdSVG({ className, style, flapDuration }: { className?: string; style?: React.CSSProperties; flapDuration: number }) {
  return (
    <svg 
      viewBox="0 0 24 12" 
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path 
        d="M2 6 Q6 2 12 6 Q18 2 22 6"
        className="animate-bird-flap"
        style={{ 
          animationDuration: `${flapDuration}s`,
          transformOrigin: 'center'
        }}
      />
    </svg>
  );
}

export function WeatherEffects({ condition, isVisible }: WeatherEffectsProps) {
  const rainDrops = useMemo(() => generateParticles(30, 42), []);
  const snowflakes = useMemo(() => generateParticles(25, 73), []);
  const clouds = useMemo(() => generateClouds(4, 17), []);
  const birds = useMemo(() => generateBirds(3, 89), []);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden">
      {/* Animated birds - show for sunny and overcast */}
      {(condition === 'sunny' || condition === 'overcast') && (
        <div className="absolute inset-0">
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
        </div>
      )}

      {/* Floating clouds - show for overcast, rainy, snowy */}
      {(condition === 'overcast' || condition === 'rainy' || condition === 'snowy') && (
        <div className="absolute inset-0">
          {clouds.map((cloud) => (
            <div
              key={cloud.id}
              className="absolute animate-cloud-drift"
              style={{
                top: `${cloud.top}%`,
                animationDelay: `${-cloud.delay}s`,
                animationDuration: `${cloud.duration}s`,
              }}
            >
              <CloudSVG
                className="text-white/40 w-24 md:w-32"
                style={{
                  transform: `scale(${cloud.scale})`,
                  opacity: cloud.opacity,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Light clouds for sunny weather */}
      {condition === 'sunny' && (
        <div className="absolute inset-0">
          {clouds.slice(0, 2).map((cloud) => (
            <div
              key={cloud.id}
              className="absolute animate-cloud-drift"
              style={{
                top: `${cloud.top}%`,
                animationDelay: `${-cloud.delay}s`,
                animationDuration: `${cloud.duration + 20}s`,
              }}
            >
              <CloudSVG
                className="text-white/20 w-16 md:w-24"
                style={{
                  transform: `scale(${cloud.scale * 0.7})`,
                  opacity: cloud.opacity * 0.5,
                }}
              />
            </div>
          ))}
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