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
      viewBox="0 0 24 14" 
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Left wing */}
      <path 
        d="M12 7 Q8 3 2 5"
        className="origin-[12px_7px]"
        style={{ 
          animation: `wing-flap-left ${flapDuration}s ease-in-out infinite`,
        }}
      />
      {/* Right wing */}
      <path 
        d="M12 7 Q16 3 22 5"
        className="origin-[12px_7px]"
        style={{ 
          animation: `wing-flap-right ${flapDuration}s ease-in-out infinite`,
        }}
      />
      {/* Body */}
      <ellipse cx="12" cy="8" rx="3" ry="2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function SantaSleighSVG({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 280 70" 
      className={className}
      style={style}
    >
      {/* Stars/sparkles trail */}
      <g className="animate-pulse">
        <circle cx="5" cy="35" r="1.5" fill="#FFD700" opacity="0.8" />
        <circle cx="15" cy="28" r="1" fill="#FFFFFF" opacity="0.6" />
        <circle cx="10" cy="45" r="1.2" fill="#FFD700" opacity="0.7" />
      </g>

      {/* Reindeer 1 - Rudolph (front) */}
      <g transform="translate(0, 20)">
        {/* Body */}
        <ellipse cx="18" cy="18" rx="12" ry="7" fill="#8B4513" />
        {/* Neck */}
        <path d="M8 15 Q5 10 8 5" stroke="#8B4513" strokeWidth="4" fill="none" />
        {/* Head */}
        <ellipse cx="8" cy="4" rx="5" ry="4" fill="#A0522D" />
        {/* Antlers */}
        <path d="M5 0 L3 -8 M3 -5 L0 -7 M3 -3 L1 -4" stroke="#5D3A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M11 0 L13 -8 M13 -5 L16 -7 M13 -3 L15 -4" stroke="#5D3A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Ear */}
        <ellipse cx="4" cy="1" rx="2" ry="1" fill="#A0522D" />
        {/* Eye */}
        <circle cx="6" cy="3" r="1" fill="#000000" />
        <circle cx="6.3" cy="2.7" r="0.3" fill="#FFFFFF" />
        {/* Rudolph's red nose */}
        <circle cx="3" cy="5" r="2.5" fill="#FF0000" />
        <circle cx="2.5" cy="4.5" r="0.8" fill="#FF6666" />
        {/* Legs */}
        <line x1="12" y1="24" x2="10" y2="32" stroke="#6B4423" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="24" y1="24" x2="26" y2="32" stroke="#6B4423" strokeWidth="2.5" strokeLinecap="round" />
        {/* Hooves */}
        <ellipse cx="10" cy="33" rx="2" ry="1.5" fill="#3D2314" />
        <ellipse cx="26" cy="33" rx="2" ry="1.5" fill="#3D2314" />
        {/* Harness */}
        <path d="M10 12 Q18 8 26 12" stroke="#C41E3A" strokeWidth="1.5" fill="none" />
        <circle cx="18" cy="10" r="2" fill="#FFD700" />
      </g>

      {/* Reindeer 2 */}
      <g transform="translate(35, 22)">
        <ellipse cx="18" cy="18" rx="11" ry="6" fill="#A0522D" />
        <path d="M8 14 Q6 10 8 6" stroke="#A0522D" strokeWidth="3.5" fill="none" />
        <ellipse cx="8" cy="5" rx="4.5" ry="3.5" fill="#8B7355" />
        <path d="M5 1 L4 -5 M4 -3 L2 -4" stroke="#5D3A1A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M11 1 L12 -5 M12 -3 L14 -4" stroke="#5D3A1A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <circle cx="6" cy="4" r="0.8" fill="#000000" />
        <ellipse cx="4" cy="6" rx="1.5" ry="1" fill="#3D2314" />
        <line x1="12" y1="23" x2="10" y2="30" stroke="#6B4423" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="23" x2="26" y2="30" stroke="#6B4423" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="10" cy="31" rx="1.8" ry="1.3" fill="#3D2314" />
        <ellipse cx="26" cy="31" rx="1.8" ry="1.3" fill="#3D2314" />
        <path d="M10 12 Q18 9 26 12" stroke="#C41E3A" strokeWidth="1.5" fill="none" />
      </g>

      {/* Reindeer 3 */}
      <g transform="translate(65, 24)">
        <ellipse cx="16" cy="16" rx="10" ry="5.5" fill="#8B7355" />
        <path d="M7 12 Q5 9 7 5" stroke="#8B7355" strokeWidth="3" fill="none" />
        <ellipse cx="7" cy="4" rx="4" ry="3" fill="#A08060" />
        <path d="M4 0 L3 -4 M3 -2 L1 -3" stroke="#5D3A1A" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M10 0 L11 -4 M11 -2 L13 -3" stroke="#5D3A1A" strokeWidth="1" fill="none" strokeLinecap="round" />
        <circle cx="5" cy="3" r="0.7" fill="#000000" />
        <ellipse cx="3" cy="5" rx="1.3" ry="0.8" fill="#3D2314" />
        <line x1="10" y1="21" x2="9" y2="27" stroke="#6B4423" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="22" y1="21" x2="23" y2="27" stroke="#6B4423" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8 10 Q16 7 24 10" stroke="#C41E3A" strokeWidth="1.2" fill="none" />
      </g>

      {/* Golden reins connecting to sleigh */}
      <path d="M30 38 Q60 32 95 42" stroke="#DAA520" strokeWidth="1.5" fill="none" />
      <path d="M55 40 Q75 35 95 44" stroke="#DAA520" strokeWidth="1.5" fill="none" />
      <path d="M80 42 Q90 40 100 45" stroke="#DAA520" strokeWidth="1.5" fill="none" />
      
      {/* Sleigh */}
      <g transform="translate(95, 15)">
        {/* Sleigh body - main */}
        <path d="M0 35 Q-5 45 10 50 L140 50 Q155 45 150 35 L145 20 Q140 10 125 10 L25 10 Q10 10 5 20 Z" fill="url(#sleighGradient)" />
        {/* Sleigh body highlight */}
        <path d="M10 15 Q15 12 120 12 Q130 12 135 15" stroke="#FF6B6B" strokeWidth="2" fill="none" opacity="0.6" />
        {/* Sleigh runner */}
        <path d="M-10 52 Q-5 58 15 58 L145 58 Q165 58 170 50" stroke="#FFD700" strokeWidth="3" fill="none" />
        <path d="M-10 52 Q-5 58 15 58 L145 58 Q165 58 170 50" stroke="#FFF8DC" strokeWidth="1" fill="none" opacity="0.5" />
        {/* Runner curl */}
        <path d="M-10 52 Q-15 48 -12 42 Q-8 38 -2 40" stroke="#FFD700" strokeWidth="3" fill="none" />
        {/* Sleigh side decoration */}
        <path d="M20 25 Q75 20 130 25" stroke="#FFD700" strokeWidth="1.5" fill="none" />
        <circle cx="30" cy="30" r="3" fill="#FFD700" />
        <circle cx="75" cy="28" r="3" fill="#FFD700" />
        <circle cx="120" cy="30" r="3" fill="#FFD700" />
        
        {/* Presents stack */}
        {/* Large green present */}
        <rect x="100" y="0" width="18" height="16" rx="1" fill="#228B22" />
        <rect x="107" y="0" width="4" height="16" fill="#32CD32" opacity="0.5" />
        <path d="M100 8 L118 8" stroke="#FF0000" strokeWidth="2" />
        <path d="M109 0 L109 16" stroke="#FF0000" strokeWidth="2" />
        <path d="M105 -2 Q109 -5 113 -2" stroke="#FF0000" strokeWidth="2" fill="none" />
        
        {/* Red present */}
        <rect x="115" y="5" width="14" height="12" rx="1" fill="#DC143C" />
        <path d="M115 11 L129 11" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M122 5 L122 17" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="122" cy="5" r="2" fill="#FFD700" />
        
        {/* Blue present */}
        <rect x="90" y="5" width="12" height="10" rx="1" fill="#4169E1" />
        <path d="M90 10 L102 10" stroke="#87CEEB" strokeWidth="1.5" />
        <path d="M96 5 L96 15" stroke="#87CEEB" strokeWidth="1.5" />
        
        {/* Small purple present */}
        <rect x="125" y="-2" width="10" height="8" rx="1" fill="#9932CC" />
        <path d="M125 2 L135 2 M130 -2 L130 6" stroke="#FFD700" strokeWidth="1" />
        
        {/* Sack of presents */}
        <ellipse cx="85" cy="8" rx="10" ry="12" fill="#8B0000" />
        <path d="M78 0 Q85 -5 92 0" stroke="#A52A2A" strokeWidth="3" fill="none" />
        <path d="M82 -2 L80 -6 M88 -2 L90 -6" stroke="#DAA520" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Santa */}
        {/* Body */}
        <ellipse cx="50" cy="20" rx="18" ry="22" fill="#DC143C" />
        {/* Fur trim */}
        <ellipse cx="50" cy="38" rx="16" ry="4" fill="#FFFAFA" />
        {/* Belt */}
        <rect x="34" y="28" width="32" height="6" fill="#1A1A1A" />
        <rect x="46" y="27" width="8" height="8" rx="1" fill="#FFD700" />
        <rect x="48" y="29" width="4" height="4" fill="#1A1A1A" />
        
        {/* Arms */}
        <ellipse cx="30" cy="18" rx="6" ry="10" fill="#DC143C" transform="rotate(-20 30 18)" />
        <ellipse cx="70" cy="18" rx="6" ry="10" fill="#DC143C" transform="rotate(20 70 18)" />
        {/* Mittens */}
        <circle cx="26" cy="24" r="4" fill="#FFFAFA" />
        <circle cx="74" cy="24" r="4" fill="#FFFAFA" />
        
        {/* Head */}
        <circle cx="50" cy="-5" r="12" fill="#FFE4C4" />
        {/* Rosy cheeks */}
        <circle cx="42" cy="-2" r="3" fill="#FFB6C1" opacity="0.6" />
        <circle cx="58" cy="-2" r="3" fill="#FFB6C1" opacity="0.6" />
        {/* Eyes */}
        <circle cx="45" cy="-7" r="2" fill="#000000" />
        <circle cx="55" cy="-7" r="2" fill="#000000" />
        <circle cx="45.5" cy="-7.5" r="0.6" fill="#FFFFFF" />
        <circle cx="55.5" cy="-7.5" r="0.6" fill="#FFFFFF" />
        {/* Nose */}
        <circle cx="50" cy="-3" r="2.5" fill="#E8B4A0" />
        {/* Smile */}
        <path d="M45 2 Q50 6 55 2" stroke="#8B4513" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Beard */}
        <ellipse cx="50" cy="5" rx="10" ry="8" fill="#FFFAFA" />
        <path d="M40 3 Q50 15 60 3" fill="#FFFAFA" />
        {/* Mustache */}
        <path d="M43 0 Q47 3 50 0 Q53 3 57 0" fill="#FFFAFA" stroke="#F5F5F5" strokeWidth="0.5" />
        
        {/* Hat */}
        <path d="M35 -12 Q35 -25 50 -28 Q65 -25 65 -12" fill="#DC143C" />
        <ellipse cx="50" cy="-12" rx="17" ry="4" fill="#FFFAFA" />
        {/* Hat tip */}
        <path d="M50 -28 Q55 -30 60 -25 Q62 -20 58 -18" stroke="#DC143C" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="60" cy="-18" r="4" fill="#FFFAFA" />
      </g>
      
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="sleighGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#DC143C" />
          <stop offset="50%" stopColor="#B22222" />
          <stop offset="100%" stopColor="#8B0000" />
        </linearGradient>
      </defs>
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