'use client';
import { STATIC_MOTION_QUERY } from '@/lib/motion';
import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
export type MotionState = 'idle' | 'playing' | 'paused' | 'inspecting' | 'completed';
/** One local clock. Geometry and captions are derived from its position. */
export function useFeatureMotion(count: number, seconds = 2.8) {
  const clock = useRef({ position: 0 });
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<MotionState>('idle');
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const media = matchMedia(STATIC_MOTION_QUERY);
    const preference = () => {
      timeline.current?.kill();
      timeline.current = null;
      const position = Math.round(clock.current.position);
      clock.current.position = position;
      setProgress(position);
      setReduced(media.matches);
      setState(position === count - 1 ? 'completed' : 'idle');
      // Phones use discrete steps and never start an animation clock.
      if (!media.matches) {
        clock.current.position = 0;
        const tl = gsap.timeline({ paused: true, onUpdate: () => setProgress(clock.current.position), onComplete: () => setState('completed') });
        tl.to(clock.current, { position: count - 1, duration: (count - 1) * seconds, ease: 'none' });
        tl.time(position * seconds, true);
        timeline.current = tl;
      }
    };
    preference();
    setReady(true);
    media.addEventListener('change', preference);
    return () => { media.removeEventListener('change', preference); timeline.current?.kill(); timeline.current = null; };
  }, [count, seconds]);
  const step = Math.min(count - 1, Math.floor(progress + .00001));
  function seek(n: number) {
    const p = Math.max(0, Math.min(count - 1, n));
    timeline.current?.pause().time(p * seconds, true);
    clock.current.position = p;
    setProgress(p);
    setState(p === count - 1 ? 'completed' : 'inspecting');
  }
  function pause() { timeline.current?.pause(); setState(s => s === 'completed' ? s : 'paused'); }
  function play(replay = false) {
    if (matchMedia(STATIC_MOTION_QUERY).matches) { seek(replay ? 0 : Math.min(count - 1, step + 1)); return; }
    if (!timeline.current) return;
    if (replay || clock.current.position >= count - 1) seek(0);
    setState('playing'); timeline.current?.play();
  }
  return { progress, step, state, reduced, ready, seek, pause, play, count };
}
export type FeatureMotion = ReturnType<typeof useFeatureMotion>;
export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const n = clamp(x); return n * n * (3 - 2 * n); };
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function curve(a: number[], b: number[]) { return `M${a[0]} ${a[1]}C${a[0]} ${(a[1]+b[1])/2},${b[0]} ${(a[1]+b[1])/2},${b[0]} ${b[1]}`; }
export function curvePoint(a: number[], b: number[], t: number) {
  const q = 1-t, mid = (a[1]+b[1])/2;
  return [q*q*q*a[0]+3*q*q*t*a[0]+3*q*t*t*b[0]+t*t*t*b[0],q*q*q*a[1]+3*q*q*t*mid+3*q*t*t*mid+t*t*t*b[1]];
}
