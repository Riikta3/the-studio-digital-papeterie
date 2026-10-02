"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * The programme's timeline: a progress line and a runner that follow the scroll,
 * and the moments that light up as the line passes them.
 *
 * The designer's script did this against the document, once, at load. This does
 * it for its own element, removes its listeners, and — for a reader who asked
 * for no motion — simply lights everything.
 *
 * The CSS alternates the moments left and right with `:nth-child`, counted
 * among every sibling: the three elements before the moments (track, progress,
 * runner) are part of the layout and must stay first and in this order.
 */
export function ProgrammeTimeline({ children }: { children: ReactNode }) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const runnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeline = timelineRef.current;
    const progress = progressRef.current;
    const runner = runnerRef.current;
    if (!timeline || !progress || !runner) return;

    const moments = [...timeline.querySelectorAll<HTMLElement>(".event")];

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      progress.style.height = `${timeline.offsetHeight}px`;
      runner.style.top = `${timeline.offsetHeight}px`;
      moments.forEach((moment) => moment.classList.add("active"));
      return;
    }

    let ticking = false;
    const update = () => {
      const rect = timeline.getBoundingClientRect();
      const marker = Math.max(0, Math.min(timeline.offsetHeight, window.innerHeight * 0.55 - rect.top));
      progress.style.height = `${marker}px`;
      runner.style.top = `${marker}px`;
      moments.forEach((moment) =>
        moment.classList.toggle("active", moment.offsetTop + moment.offsetHeight / 2 < marker + 105),
      );
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, [children]);

  return (
    <div className="timeline" id="cr-timeline" ref={timelineRef}>
      <div className="track" />
      <div className="progress" ref={progressRef} />
      <div className="runner" ref={runnerRef} aria-hidden="true">
        ✧
      </div>
      {children}
    </div>
  );
}
