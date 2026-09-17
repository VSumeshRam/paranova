'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { useTelemetryStore } from '@/lib/store';

interface TelemetryTrackerProps {
  children: ReactNode;
}

export function TelemetryTracker({ children }: TelemetryTrackerProps) {
  const mountTime = useRef<number>(Date.now());
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const mouseVelocityDropTime = useRef<number | null>(null);
  
  const recordFirstAction = useTelemetryStore((state) => state.recordFirstAction);
  const incrementHesitation = useTelemetryStore((state) => state.incrementHesitation);

  useEffect(() => {
    // Reset mount time on mount
    mountTime.current = Date.now();

    const handleFirstAction = () => {
      const msSinceMount = Date.now() - mountTime.current;
      recordFirstAction(msSinceMount);
      
      // Remove listeners once first action is recorded
      document.removeEventListener('keydown', handleFirstAction);
      document.removeEventListener('touchstart', handleFirstAction);
      document.removeEventListener('mousedown', handleFirstAction);
    };

    document.addEventListener('keydown', handleFirstAction);
    document.addEventListener('touchstart', handleFirstAction);
    document.addEventListener('mousedown', handleFirstAction);

    // Hesitation Tracking (HP)
    let hesitationInterval = setInterval(() => {
      if (lastMousePos.current && mouseVelocityDropTime.current) {
        const timeSinceDrop = Date.now() - mouseVelocityDropTime.current;
        if (timeSinceDrop > 3000) {
          incrementHesitation();
          // Reset drop time to avoid infinite increments until they move again
          mouseVelocityDropTime.current = Date.now();
        }
      }
    }, 1000);

    const handleMouseMove = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      // User moved, reset the velocity drop time
      mouseVelocityDropTime.current = Date.now();
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('keydown', handleFirstAction);
      document.removeEventListener('touchstart', handleFirstAction);
      document.removeEventListener('mousedown', handleFirstAction);
      document.removeEventListener('mousemove', handleMouseMove);
      clearInterval(hesitationInterval);
    };
  }, [recordFirstAction, incrementHesitation]);

  return <div className="telemetry-wrapper w-full h-full">{children}</div>;
}
