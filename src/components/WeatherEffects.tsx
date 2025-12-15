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
    const duration = 20 + ((pseudoRandom * 7) % 233280) / 233280 * 15;
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
    </svg>
  );
}

function SantaSleighSVG({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 300 90" 
      className={className}
      style={{ ...style, transform: `${style?.transform || ''} scaleX(-1)` }}
    >
      {/* Drop shadow filter for 3D effect */}
      <defs>
        <filter id="sleighShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="5" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
        </filter>
        <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="sleighGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF4444" />
          <stop offset="30%" stopColor="#DC143C" />
          <stop offset="70%" stopColor="#B22222" />
          <stop offset="100%" stopColor="#8B0000" />
        </linearGradient>
        <linearGradient id="reindeerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A0522D" />
          <stop offset="100%" stopColor="#6B4423" />
        </linearGradient>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
      </defs>

      {/* Sparkle trail */}
      <g className="animate-pulse" filter="url(#glowFilter)">
        <circle cx="295" cy="45" r="2" fill="#FFD700" opacity="0.9" />
        <circle cx="288" cy="38" r="1.5" fill="#FFFFFF" opacity="0.7" />
        <circle cx="290" cy="55" r="1.8" fill="#FFD700" opacity="0.8" />
        <circle cx="282" cy="48" r="1" fill="#FFFFFF" opacity="0.6" />
      </g>

      {/* Main group with shadow */}
      <g filter="url(#sleighShadow)">
        
        {/* Sleigh */}
        <g transform="translate(5, 25)">
          {/* Sleigh body - 3D effect with multiple layers */}
          <path d="M0 30 Q-5 42 10 48 L130 48 Q148 42 143 30 L138 15 Q132 5 115 5 L25 5 Q8 5 3 15 Z" fill="url(#sleighGradient)" />
          {/* Inner highlight for 3D depth */}
          <path d="M8 28 Q5 36 15 42 L125 42 Q138 36 135 28 L132 18 Q128 12 115 12 L28 12 Q15 12 12 18 Z" fill="#C41E3A" opacity="0.6" />
          {/* Top rim highlight */}
          <path d="M12 10 Q20 6 110 6 Q125 6 132 10" stroke="#FF6B6B" strokeWidth="2.5" fill="none" opacity="0.7" />
          
          {/* Sleigh runner - 3D gold */}
          <path d="M-8 50 Q-3 58 18 58 L135 58 Q158 58 163 48" stroke="url(#goldGradient)" strokeWidth="4" fill="none" />
          <path d="M-6 49 Q-1 55 18 55 L135 55 Q155 55 160 47" stroke="#FFF8DC" strokeWidth="1.5" fill="none" opacity="0.6" />
          {/* Runner curl */}
          <path d="M163 48 Q168 42 165 35 Q160 30 152 33" stroke="url(#goldGradient)" strokeWidth="4" fill="none" />
          <path d="M161 47 Q165 42 163 37 Q159 33 153 35" stroke="#FFF8DC" strokeWidth="1" fill="none" opacity="0.5" />
          
          {/* Decorative elements */}
          <path d="M20 22 Q70 17 120 22" stroke="#FFD700" strokeWidth="2" fill="none" />
          <circle cx="30" cy="27" r="4" fill="url(#goldGradient)" />
          <circle cx="70" cy="25" r="4" fill="url(#goldGradient)" />
          <circle cx="110" cy="27" r="4" fill="url(#goldGradient)" />
          
          {/* Santa - 3D with shading */}
          {/* Body with gradient */}
          <ellipse cx="55" cy="18" rx="20" ry="24" fill="url(#sleighGradient)" />
          {/* Body highlight */}
          <ellipse cx="50" cy="15" rx="12" ry="16" fill="#E8383B" opacity="0.4" />
          {/* Fur trim */}
          <ellipse cx="55" cy="38" rx="18" ry="5" fill="#FFFAFA" />
          <ellipse cx="55" cy="37" rx="15" ry="3" fill="#F0F0F0" opacity="0.5" />
          {/* Belt */}
          <rect x="37" y="26" width="36" height="7" rx="1" fill="#1A1A1A" />
          <rect x="50" y="25" width="10" height="9" rx="1" fill="url(#goldGradient)" />
          <rect x="52" y="27" width="6" height="5" rx="1" fill="#1A1A1A" />
          
          {/* Arms with 3D shading */}
          <ellipse cx="32" cy="15" rx="7" ry="12" fill="#DC143C" transform="rotate(-15 32 15)" />
          <ellipse cx="30" cy="13" rx="4" ry="8" fill="#E8383B" opacity="0.4" transform="rotate(-15 30 13)" />
          <ellipse cx="78" cy="15" rx="7" ry="12" fill="#DC143C" transform="rotate(15 78 15)" />
          {/* Mittens */}
          <circle cx="28" cy="24" r="5" fill="#FFFAFA" />
          <circle cx="27" cy="23" r="2" fill="#F0F0F0" opacity="0.5" />
          <circle cx="82" cy="24" r="5" fill="#FFFAFA" />
          
          {/* Head with 3D shading */}
          <circle cx="55" cy="-8" r="14" fill="#FFE4C4" />
          <circle cx="52" cy="-10" r="8" fill="#FFECD4" opacity="0.5" />
          {/* Rosy cheeks */}
          <circle cx="45" cy="-4" r="4" fill="#FFB6C1" opacity="0.5" />
          <circle cx="65" cy="-4" r="4" fill="#FFB6C1" opacity="0.5" />
          {/* Eyes with depth */}
          <ellipse cx="48" cy="-10" rx="2.5" ry="3" fill="#2C1810" />
          <ellipse cx="62" cy="-10" rx="2.5" ry="3" fill="#2C1810" />
          <circle cx="47" cy="-11" r="1" fill="#FFFFFF" />
          <circle cx="61" cy="-11" r="1" fill="#FFFFFF" />
          {/* Eyebrows */}
          <path d="M45 -15 Q48 -17 51 -15" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.8" />
          <path d="M59 -15 Q62 -17 65 -15" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.8" />
          {/* Nose */}
          <ellipse cx="55" cy="-5" rx="3" ry="2.5" fill="#E8A090" />
          <circle cx="54" cy="-6" r="1" fill="#F0B0A0" opacity="0.5" />
          {/* Smile */}
          <path d="M48 2 Q55 8 62 2" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Beard with 3D layers */}
          <ellipse cx="55" cy="6" rx="12" ry="10" fill="#FFFAFA" />
          <ellipse cx="55" cy="8" rx="10" ry="8" fill="#F8F8F8" opacity="0.7" />
          <path d="M43 4 Q55 20 67 4" fill="#FFFAFA" />
          {/* Mustache */}
          <path d="M46 -1 Q51 4 55 -1 Q59 4 64 -1" fill="#FFFAFA" stroke="#F0F0F0" strokeWidth="0.5" />
          
          {/* Hat with 3D effect */}
          <path d="M38 -16 Q38 -32 55 -36 Q72 -32 72 -16" fill="#DC143C" />
          <path d="M42 -18 Q42 -28 55 -32 Q65 -28 65 -18" fill="#E8383B" opacity="0.4" />
          <ellipse cx="55" cy="-16" rx="19" ry="5" fill="#FFFAFA" />
          <ellipse cx="55" cy="-17" rx="16" ry="3" fill="#F0F0F0" opacity="0.5" />
          {/* Hat tip */}
          <path d="M55 -36 Q62 -40 70 -32 Q74 -24 68 -20" stroke="#DC143C" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M58 -35 Q63 -38 68 -32 Q71 -26 67 -23" stroke="#E8383B" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
          <circle cx="68" cy="-20" r="6" fill="#FFFAFA" />
          <circle cx="66" cy="-22" r="2" fill="#F0F0F0" opacity="0.5" />
          
          {/* Presents with 3D effect */}
          {/* Sack */}
          <ellipse cx="100" cy="5" rx="12" ry="15" fill="#8B0000" />
          <ellipse cx="97" cy="2" rx="6" ry="10" fill="#A52A2A" opacity="0.4" />
          <path d="M91 -5 Q100 -12 109 -5" stroke="#6B0000" strokeWidth="4" fill="none" />
          <path d="M95 -7 L92 -12 M105 -7 L108 -12" stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round" />
          
          {/* Green present */}
          <rect x="110" y="-2" width="20" height="18" rx="2" fill="#228B22" />
          <rect x="110" y="-2" width="8" height="18" fill="#2E8B2E" opacity="0.3" />
          <path d="M110 7 L130 7" stroke="#FF0000" strokeWidth="3" />
          <path d="M120 -2 L120 16" stroke="#FF0000" strokeWidth="3" />
          <path d="M115 -4 Q120 -8 125 -4" stroke="#FF0000" strokeWidth="2.5" fill="none" />
          
          {/* Red present */}
          <rect x="125" y="3" width="16" height="14" rx="2" fill="#DC143C" />
          <rect x="125" y="3" width="6" height="14" fill="#E8383B" opacity="0.3" />
          <path d="M125 10 L141 10" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M133 3 L133 17" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="133" cy="3" r="3" fill="url(#goldGradient)" />
        </g>
        
        {/* Golden reins */}
        <path d="M148 52 Q175 48 200 55" stroke="url(#goldGradient)" strokeWidth="2" fill="none" />
        <path d="M148 55 Q180 52 210 58" stroke="url(#goldGradient)" strokeWidth="2" fill="none" />
        
        {/* Reindeer 1 (closest to sleigh) */}
        <g transform="translate(195, 35)">
          <ellipse cx="18" cy="18" rx="14" ry="8" fill="url(#reindeerGradient)" />
          <ellipse cx="14" cy="16" rx="6" ry="4" fill="#B8764A" opacity="0.4" />
          <path d="M8 14 Q4 8 8 2" stroke="#8B4513" strokeWidth="5" fill="none" />
          <ellipse cx="8" cy="0" rx="6" ry="5" fill="#A0522D" />
          <ellipse cx="6" cy="-2" rx="3" ry="2.5" fill="#B8764A" opacity="0.4" />
          <path d="M4 -4 L2 -14 M2 -10 L-2 -13 M2 -7 L-1 -9" stroke="#5D3A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M12 -4 L14 -14 M14 -10 L18 -13 M14 -7 L17 -9" stroke="#5D3A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="3" cy="-2" rx="2.5" ry="1.5" fill="#A0522D" />
          <circle cx="6" cy="-1" r="1.5" fill="#1A1A1A" />
          <circle cx="5.5" cy="-1.5" r="0.5" fill="#FFFFFF" />
          <ellipse cx="2" cy="2" rx="2" ry="1.2" fill="#3D2314" />
          <line x1="10" y1="25" x2="8" y2="35" stroke="#6B4423" strokeWidth="3" strokeLinecap="round" />
          <line x1="26" y1="25" x2="28" y2="35" stroke="#6B4423" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="8" cy="36" rx="2.5" ry="2" fill="#3D2314" />
          <ellipse cx="28" cy="36" rx="2.5" ry="2" fill="#3D2314" />
          <path d="M10 12 Q18 8 26 12" stroke="#C41E3A" strokeWidth="2" fill="none" />
          <circle cx="18" cy="10" r="3" fill="url(#goldGradient)" />
        </g>

        {/* Reindeer 2 */}
        <g transform="translate(225, 33)">
          <ellipse cx="16" cy="16" rx="12" ry="7" fill="url(#reindeerGradient)" />
          <ellipse cx="12" cy="14" rx="5" ry="3.5" fill="#B8764A" opacity="0.4" />
          <path d="M7 12 Q4 7 7 2" stroke="#8B4513" strokeWidth="4" fill="none" />
          <ellipse cx="7" cy="0" rx="5" ry="4" fill="#8B7355" />
          <path d="M4 -3 L2 -11 M2 -8 L0 -10" stroke="#5D3A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M10 -3 L12 -11 M12 -8 L14 -10" stroke="#5D3A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="5" cy="-1" r="1.2" fill="#1A1A1A" />
          <ellipse cx="2" cy="2" rx="1.8" ry="1" fill="#3D2314" />
          <line x1="9" y1="22" x2="7" y2="31" stroke="#6B4423" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="23" y1="22" x2="25" y2="31" stroke="#6B4423" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M8 10 Q16 7 24 10" stroke="#C41E3A" strokeWidth="1.5" fill="none" />
        </g>

        {/* Reindeer 3 - Rudolph (front) */}
        <g transform="translate(252, 30)">
          <ellipse cx="16" cy="16" rx="13" ry="7.5" fill="url(#reindeerGradient)" />
          <ellipse cx="12" cy="14" rx="6" ry="4" fill="#B8764A" opacity="0.4" />
          <path d="M6 12 Q2 6 6 0" stroke="#8B4513" strokeWidth="5" fill="none" />
          <ellipse cx="6" cy="-2" rx="6" ry="5" fill="#A0522D" />
          <ellipse cx="4" cy="-4" rx="3" ry="2.5" fill="#B8764A" opacity="0.4" />
          <path d="M3 -6 L0 -16 M0 -12 L-4 -15 M0 -9 L-3 -11" stroke="#5D3A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M9 -6 L12 -16 M12 -12 L16 -15 M12 -9 L15 -11" stroke="#5D3A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="1" cy="-4" rx="2.5" ry="1.5" fill="#A0522D" />
          <circle cx="4" cy="-3" r="1.5" fill="#1A1A1A" />
          <circle cx="3.5" cy="-3.5" r="0.5" fill="#FFFFFF" />
          {/* Rudolph's glowing red nose */}
          <circle cx="0" cy="0" r="4" fill="#FF0000" filter="url(#glowFilter)" />
          <circle cx="-1" cy="-1" r="1.5" fill="#FF6666" />
          <line x1="9" y1="23" x2="7" y2="34" stroke="#6B4423" strokeWidth="3" strokeLinecap="round" />
          <line x1="23" y1="23" x2="25" y2="34" stroke="#6B4423" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="7" cy="35" rx="2.5" ry="2" fill="#3D2314" />
          <ellipse cx="25" cy="35" rx="2.5" ry="2" fill="#3D2314" />
          <path d="M8 10 Q16 6 24 10" stroke="#C41E3A" strokeWidth="2" fill="none" />
          <circle cx="16" cy="8" r="3" fill="url(#goldGradient)" />
        </g>
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
        setSantaTop(25 + Math.random() * 40); // Random vertical position through the image
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