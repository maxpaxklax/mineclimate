import { useMemo, useState, useEffect } from 'react';

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

function SantaSleighSVG({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 200 50" 
      className={className}
      style={style}
      fill="currentColor"
    >
      {/* Reindeer 1 (front) */}
      <g transform="translate(0, 15)">
        <ellipse cx="12" cy="12" rx="8" ry="5" fill="#8B4513" /> {/* body */}
        <circle cx="6" cy="8" r="3" fill="#8B4513" /> {/* head */}
        <path d="M4 5 L2 0 M4 5 L6 0" stroke="#8B4513" strokeWidth="1" fill="none" /> {/* antlers */}
        <line x1="8" y1="17" x2="6" y2="22" stroke="#8B4513" strokeWidth="1.5" /> {/* legs */}
        <line x1="16" y1="17" x2="18" y2="22" stroke="#8B4513" strokeWidth="1.5" />
        <circle cx="5" cy="9" r="0.5" fill="#DC143C" /> {/* red nose */}
      </g>
      
      {/* Reindeer 2 */}
      <g transform="translate(25, 18)">
        <ellipse cx="12" cy="12" rx="8" ry="5" fill="#A0522D" />
        <circle cx="6" cy="8" r="3" fill="#A0522D" />
        <path d="M4 5 L2 0 M4 5 L6 0" stroke="#A0522D" strokeWidth="1" fill="none" />
        <line x1="8" y1="17" x2="6" y2="20" stroke="#A0522D" strokeWidth="1.5" />
        <line x1="16" y1="17" x2="18" y2="20" stroke="#A0522D" strokeWidth="1.5" />
      </g>
      
      {/* Reins */}
      <path d="M20 28 Q50 25 80 30" stroke="#DAA520" strokeWidth="1" fill="none" />
      <path d="M45 33 Q60 28 80 32" stroke="#DAA520" strokeWidth="1" fill="none" />
      
      {/* Sleigh */}
      <g transform="translate(75, 20)">
        {/* Sleigh base */}
        <path d="M0 25 Q5 30 60 30 Q70 30 75 25 L75 15 Q70 10 60 10 L15 10 Q5 10 0 15 Z" fill="#DC143C" />
        {/* Sleigh runner */}
        <path d="M-5 32 Q0 35 65 35 Q80 35 85 30" stroke="#FFD700" strokeWidth="2" fill="none" />
        
        {/* Presents */}
        <rect x="45" y="5" width="10" height="10" fill="#228B22" />
        <path d="M45 10 L55 10 M50 5 L50 15" stroke="#FFD700" strokeWidth="1" />
        <rect x="52" y="2" width="8" height="8" fill="#FF6347" />
        <path d="M52 6 L60 6 M56 2 L56 10" stroke="#FFFFFF" strokeWidth="1" />
        <rect x="38" y="7" width="8" height="8" fill="#4169E1" />
        <path d="M38 11 L46 11 M42 7 L42 15" stroke="#FFD700" strokeWidth="1" />
        
        {/* Santa */}
        <circle cx="25" cy="5" r="6" fill="#FFE4C4" /> {/* face */}
        <ellipse cx="25" cy="-2" rx="7" ry="4" fill="#DC143C" /> {/* hat */}
        <circle cx="25" cy="-6" r="2" fill="#FFFFFF" /> {/* hat pom */}
        <ellipse cx="25" cy="15" rx="10" ry="8" fill="#DC143C" /> {/* body */}
        <ellipse cx="25" cy="20" rx="8" ry="3" fill="#000000" /> {/* belt area */}
        <rect x="23" y="18" width="4" height="4" fill="#FFD700" /> {/* belt buckle */}
      </g>
    </svg>
  );
}

export function WeatherEffects({ condition, isVisible }: WeatherEffectsProps) {
  const rainDrops = useMemo(() => generateParticles(30, 42), []);
  const snowflakes = useMemo(() => generateParticles(25, 73), []);
  const clouds = useMemo(() => generateClouds(4, 17), []);
  const birds = useMemo(() => generateBirds(3, 89), []);
  
  const [santaKey, setSantaKey] = useState(0);
  const [santaTop, setSantaTop] = useState(15);
  const [showSanta, setShowSanta] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const scheduleSanta = () => {
      // Random delay between 0-60 seconds
      const delay = Math.random() * 60000;
      
      return setTimeout(() => {
        setSantaTop(5 + Math.random() * 25); // Random vertical position
        setSantaKey(prev => prev + 1);
        setShowSanta(true);
        
        // Hide santa after animation completes (4 seconds)
        setTimeout(() => setShowSanta(false), 4000);
      }, delay);
    };

    // Initial santa appearance
    const initialTimer = scheduleSanta();
    
    // Set up recurring interval
    const interval = setInterval(() => {
      scheduleSanta();
    }, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden">
      {/* Santa Sleigh - appears randomly every 60 seconds */}
      {showSanta && (
        <div
          key={santaKey}
          className="absolute animate-santa-fly"
          style={{
            top: `${santaTop}%`,
          }}
        >
          <SantaSleighSVG className="w-32 md:w-48 drop-shadow-lg" />
        </div>
      )}

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