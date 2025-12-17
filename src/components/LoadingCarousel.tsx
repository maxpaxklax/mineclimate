import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import munich3 from '@/assets/cities/munich-3.png';
import fussen from '@/assets/cities/fussen.png';
import cologne from '@/assets/cities/cologne.png';
import lasVegas from '@/assets/cities/las-vegas.png';
import paris from '@/assets/cities/paris.png';
import mondsee from '@/assets/cities/mondsee.png';
import munich2 from '@/assets/cities/munich-2.png';
import heidelberg from '@/assets/cities/heidelberg.png';

const cityImages = [
  { src: munich3, name: 'Munich' },
  { src: fussen, name: 'Füssen' },
  { src: cologne, name: 'Cologne' },
  { src: lasVegas, name: 'Las Vegas' },
  { src: paris, name: 'Paris' },
  { src: mondsee, name: 'Mondsee' },
  { src: munich2, name: 'Munich' },
  { src: heidelberg, name: 'Heidelberg' },
];

export function LoadingCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % cityImages.length);
        setIsAnimating(false);
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 300);
      }, 400);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Get visible stack (current + next 2)
  const getStackOrder = () => {
    const stack = [];
    for (let i = 0; i < 3; i++) {
      stack.push((currentIndex + i) % cityImages.length);
    }
    return stack.reverse(); // Reverse so first is on top
  };

  const stackIndices = getStackOrder();

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      <div className="relative h-[25vh] w-[25vh] max-h-[200px] max-w-[200px] min-h-[140px] min-w-[140px]">
        {stackIndices.map((imgIndex, stackPosition) => {
          const isTop = stackPosition === 2;
          const offset = (2 - stackPosition) * 8;
          const baseScale = 1 - (2 - stackPosition) * 0.05;
          const opacity = 1 - (2 - stackPosition) * 0.15;
          
          // Bounce effect: subtle scale up then back to normal
          const bounceScale = isBouncing && isTop ? 1.04 : baseScale;
          
          // Dynamic shadow that grows during bounce
          const baseShadow = '0 8px 20px -4px rgba(0, 0, 0, 0.25)';
          const bounceShadow = '0 16px 32px -4px rgba(0, 0, 0, 0.35)';
          const shadow = isBouncing && isTop ? bounceShadow : baseShadow;

          return (
            <div
              key={`${imgIndex}-${stackPosition}`}
              className="absolute inset-0"
              style={{
                transform: `
                  translateX(${isTop && isAnimating ? '-120%' : `${offset}px`}) 
                  translateY(${isTop && isBouncing ? `${offset - 2}px` : `${offset}px`}) 
                  scale(${isTop && isAnimating ? baseScale : bounceScale})
                  rotate(${isTop && isAnimating ? '-15deg' : '0deg'})
                `,
                opacity: isTop && isAnimating ? 0 : opacity,
                zIndex: stackPosition,
                boxShadow: isTop ? shadow : baseShadow,
                transition: isTop && isAnimating 
                  ? 'all 400ms ease-out' 
                  : isBouncing 
                    ? 'all 350ms cubic-bezier(0.22, 1, 0.36, 1)' 
                    : 'all 300ms ease-out',
              }}
            >
              <img
                src={cityImages[imgIndex].src}
                alt={cityImages[imgIndex].name}
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
          );
        })}
      </div>

      {/* Text below carousel */}
      <div className="mt-8 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-lg font-medium text-foreground/80">
          Generating your city...
        </p>
      </div>
    </div>
  );
}
