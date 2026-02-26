import { useState, useRef, useCallback } from 'react';

interface UseSwipeCarouselOptions {
  totalSlides: number;
  onSnapBack?: () => void;
}

export function useSwipeCarousel({ totalSlides, onSnapBack }: UseSwipeCarouselOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [snapBackActive, setSnapBackActive] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const isVerticalScroll = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isSwiping.current = false;
    isVerticalScroll.current = false;
  }, [isAnimating]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isAnimating || isVerticalScroll.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Determine gesture direction on first significant movement
    if (!isSwiping.current && !isVerticalScroll.current) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        isVerticalScroll.current = true;
        return;
      }
      if (Math.abs(deltaX) > 10) {
        isSwiping.current = true;
      }
    }

    if (!isSwiping.current) return;

    // Resist swiping at boundaries (but less on last slide so snap-back triggers)
    let adjustedDelta = deltaX;
    if (currentIndex === 0 && deltaX > 0) {
      adjustedDelta = deltaX * 0.2; // resist swiping right on first slide
    }
    if (currentIndex === totalSlides - 1 && deltaX < 0) {
      adjustedDelta = deltaX * 0.4; // resist but allow enough for snap-back trigger
    }

    setSwipeOffset(adjustedDelta);
  }, [isAnimating, currentIndex, totalSlides]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current || isAnimating) {
      setSwipeOffset(0);
      return;
    }

    const threshold = 80;

    if (swipeOffset < -threshold && currentIndex < totalSlides - 1) {
      // Swipe left → next slide
      setIsAnimating(true);
      setSwipeOffset(0);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setIsAnimating(false), 300);
    } else if (swipeOffset > threshold && currentIndex > 0) {
      // Swipe right → previous slide
      setIsAnimating(true);
      setSwipeOffset(0);
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => setIsAnimating(false), 300);
    } else if (swipeOffset < -(threshold * 0.4) && currentIndex === totalSlides - 1 && totalSlides > 1) {
      // Past last slide → snap back to index 0
      setSnapBackActive(true);
      setIsAnimating(true);
      setSwipeOffset(0);
      setCurrentIndex(0);
      onSnapBack?.();
      setTimeout(() => {
        setIsAnimating(false);
        setSnapBackActive(false);
      }, 600);
    } else {
      // Not enough swipe → bounce back
      setSwipeOffset(0);
    }

    isSwiping.current = false;
  }, [swipeOffset, currentIndex, totalSlides, isAnimating, onSnapBack]);

  const goTo = useCallback((index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setSwipeOffset(0);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating, currentIndex]);

  return {
    currentIndex,
    swipeOffset,
    isAnimating,
    snapBackActive,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    goTo,
  };
}
