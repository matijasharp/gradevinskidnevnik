import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.4,
          delay: 0.1,
          onComplete,
        });
      },
    });

    tl.fromTo(
      logoRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    ).fromTo(
      textRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      '-=0.3'
    );

    return () => { tl.kill(); };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
    >
      <img
        ref={logoRef}
        src="/brand/logo.svg"
        alt="Građevinski Dnevnik Online"
        className="h-20 w-20 mb-5"
        style={{ opacity: 0 }}
      />
      <p
        ref={textRef}
        className="text-xl font-semibold text-gray-800 tracking-tight"
        style={{ opacity: 0, fontFamily: 'Jost, sans-serif' }}
      >
        Građevinski Dnevnik Online
      </p>
    </div>
  );
}
