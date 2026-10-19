import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Bee from "../../asset/bee.png";
import "./careerBee.css";
import "./careerBeeSession";

const loadPanel = () => import("./CareerBeePanel");
const CareerBeePanel = lazy(loadPanel);

// Pages where a floating assistant would distract or cover controls:
// an assessment / psychometric test in progress, and payment screens.
const HIDDEN_ROUTE_PATTERNS = [
  /^\/(?:app\/)?assessment\/attempt\/[^/]+\/?$/i,
  /^\/(?:app\/)?psychometric-test(?:\/|$)/i,
  /^\/(?:app\/)?checkout(?:\/|$)/i,
  // Personality quiz: the question view shares the /app/quiz URL and its
  // full-width "Next" button sits where the bee floats on phones.
  /^\/(?:app\/)?quiz(?:\/|$)/i,
  /^\/(?:app\/)?payment-success(?:\/|$)/i,
];

export function isCareerBeeHiddenOn(pathname = "") {
  return HIDDEN_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

const FOOTER_CONTROLS = 'a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';
const CLEARANCE = 8;

/**
 * When the layout footer scrolls into view, lift the launcher just enough that it
 * never sits on top of a footer link or button (e.g. "Support" in the bottom bar).
 */
function useFooterLift(anchorRef, enabled, frozen) {
  const [lift, setLift] = useState(0);
  const liftRef = useRef(0);

  useEffect(() => {
    if (!enabled || frozen) return undefined;
    let frame = 0;

    const apply = (value) => {
      if (liftRef.current === value) return;
      liftRef.current = value;
      setLift(value);
    };

    const measure = () => {
      frame = 0;
      const anchor = anchorRef.current;
      const footer = anchor?.parentElement?.querySelector(":scope > footer");
      if (!anchor || !footer || footer.getBoundingClientRect().top >= window.innerHeight) {
        apply(0);
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const baseTop = rect.top + liftRef.current;
      const controls = Array.from(footer.querySelectorAll(FOOTER_CONTROLS))
        .map((element) => element.getBoundingClientRect())
        .filter(
          (box) =>
            box.width > 0 &&
            box.height > 0 &&
            box.right > rect.left - CLEARANCE &&
            box.left < rect.right + CLEARANCE
        );

      let next = 0;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const top = baseTop - next - CLEARANCE;
        const bottom = baseTop - next + rect.height + CLEARANCE;
        const hit = controls.find((box) => box.top < bottom && box.bottom > top);
        if (!hit) break;
        next = baseTop + rect.height + CLEARANCE - hit.top;
      }
      apply(Math.max(0, Math.round(next)));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(schedule);
      observer.observe(document.body);
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [anchorRef, enabled, frozen]);

  return lift;
}

export default function CareerBeeLauncher() {
  const location = useLocation();
  const anchorRef = useRef(null);
  const launcherRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activated, setActivated] = useState(false);
  const hidden = isCareerBeeHiddenOn(location.pathname);
  // While the panel is open the launcher stays put (it is the panel's anchor).
  const lift = useFooterLift(anchorRef, !hidden, open);

  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  const handleClose = useCallback(({ restoreFocus = true } = {}) => {
    setOpen(false);
    if (restoreFocus) {
      // Wait for the panel to hide before moving focus back.
      window.requestAnimationFrame(() => launcherRef.current?.focus());
    }
  }, []);

  if (hidden) {
    return null;
  }

  return (
    <>
      {activated ? (
        <Suspense fallback={null}>
          <CareerBeePanel open={open} onClose={handleClose} lift={lift} />
        </Suspense>
      ) : null}

      <div
        ref={anchorRef}
        className={`fixed bottom-4 right-4 z-[990] sm:bottom-5 ${open ? "max-sm:hidden" : ""}`}
        style={{
          marginBottom: "env(safe-area-inset-bottom, 0px)",
          transform: lift ? `translateY(-${lift}px)` : undefined,
        }}
      >
        <button
          ref={launcherRef}
          type="button"
          onClick={() => {
            setActivated(true);
            setOpen((current) => !current);
          }}
          onMouseEnter={() => loadPanel().catch(() => {})}
          onFocus={() => loadPanel().catch(() => {})}
          aria-label={open ? "Close Career Bee assistant" : "Open Career Bee assistant"}
          aria-expanded={open}
          aria-controls={activated ? "career-bee-panel" : undefined}
          aria-haspopup="dialog"
          title="Ask Career Bee"
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#9a2119] bg-white shadow-[0_10px_30px_rgba(154,33,25,0.28)] transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#9a2119]/30"
        >
          <img
            src={Bee}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="career-bee-float pointer-events-none h-10 w-10 select-none object-contain"
          />
        </button>
      </div>
    </>
  );
}
