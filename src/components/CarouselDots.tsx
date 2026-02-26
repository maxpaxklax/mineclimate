interface CarouselDotsProps {
  total: number;
  current: number;
}

export function CarouselDots({ total, current }: CarouselDotsProps) {
  if (total <= 1) return null;

  return (
    <div className="absolute bottom-28 md:bottom-32 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 pointer-events-none">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-2.5 h-2.5 bg-white shadow-md'
              : 'w-1.5 h-1.5 bg-white/50'
          }`}
        />
      ))}
    </div>
  );
}
