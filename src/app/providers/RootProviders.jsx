import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect } from "react";
import { AppProviders } from "../../components/ui";
import { AppStateProvider } from "../../state/AppStateContext";

function ScrollToTopOnRouteChange() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // The browser otherwise restores the previous document position after a
    // client-side route change, which can override an immediate scroll reset.
    window.history.scrollRestoration = "manual";
  }, []);

  useLayoutEffect(() => {
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [pathname, search]);

  return null;
}

export default function RootProviders() {
  return (
    <AppStateProvider>
      <AppProviders>
        <ScrollToTopOnRouteChange />
        <Outlet />
      </AppProviders>
    </AppStateProvider>
  );
}
