import { useEffect, useRef } from "react";

/** Store view state in same-URL history entries so browser Back restores prior in-page steps. */
export function useBrowserStepHistory(namespace, snapshot, restore, enabled = true) {
  const restoreRef = useRef(restore);
  const readyRef = useRef(false);
  const skipNextPushRef = useRef(false);
  const snapshotJson = JSON.stringify(snapshot);

  restoreRef.current = restore;

  useEffect(() => {
    if (!enabled) return undefined;
    window.history.replaceState(
      { ...window.history.state, [namespace]: snapshot },
      "",
      window.location.href
    );
    readyRef.current = true;

    const handlePopState = (event) => {
      const previousSnapshot = event.state?.[namespace];
      if (!previousSnapshot) return;
      skipNextPushRef.current = true;
      restoreRef.current(previousSnapshot);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [namespace, enabled]);

  useEffect(() => {
    if (!enabled || !readyRef.current) return;
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }

    const previousSnapshot = window.history.state?.[namespace];
    if (JSON.stringify(previousSnapshot) === snapshotJson) return;

    window.history.pushState(
      { ...window.history.state, [namespace]: snapshot },
      "",
      window.location.href
    );
  }, [namespace, snapshotJson, enabled]);
}
