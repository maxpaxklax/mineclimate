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
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="carousel-track flex items-center gap-4">
        {/* Double the images for seamless loop */}
        {[...cityImages, ...cityImages].map((city, index) => (
          <div
            key={`${city.name}-${index}`}
            className="carousel-item shrink-0"
          >
            <img
              src={city.src}
              alt={city.name}
              className="h-auto w-[20vw] max-w-[200px] min-w-[120px] rounded-xl shadow-lg object-contain"
            />
          </div>
        ))}
      </div>
      
      {/* Overlay text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-lg font-medium text-foreground/80 drop-shadow-md">
          Generating your city...
        </p>
      </div>
    </div>
  );
}
