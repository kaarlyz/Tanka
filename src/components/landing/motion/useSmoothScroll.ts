import { useEffect, type RefObject } from "react";
import Lenis from "lenis";

/**
 * Smooth scroll untuk container landing (bukan window).
 * wrapper = elemen yang overflow-y: auto, content = satu anak pembungkus semua section.
 */
export function useSmoothScroll(
  wrapperRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    const lenis = new Lenis({
      wrapper,
      content,
      duration: isTouch ? 0.85 : 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: 0.09,
      touchMultiplier: 1.2
    });

    let raf = 0;
    const loop = (time: number): void => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (e: MouseEvent): void => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      const id = anchor?.getAttribute("href");
      if (!anchor || !id || id.length < 2) return;
      const dest = wrapper.querySelector<HTMLElement>(id);
      if (!dest) return;
      e.preventDefault();
      lenis.scrollTo(dest, { offset: -72, duration: 1.4 });
      window.history.pushState(null, "", id);
    };
    wrapper.addEventListener("click", onClick);

    return () => {
      wrapper.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [wrapperRef, contentRef]);
}
