import { useEffect, useState } from "react";
import { checkModuleAccess } from "../api/moduleAccessApi";

// Re-verifies module access on mount instead of trusting router history state
// (which survives reloads and Back/Forward after a subscription expires).
export function useVerifiedAccessStatus(locationState) {
  const stateStatus = locationState?.accessStatus || "preview";
  const moduleId = locationState?.moduleId;
  const [status, setStatus] = useState(stateStatus);

  useEffect(() => {
    setStatus(stateStatus);
    if (!moduleId) return undefined;
    let active = true;
    checkModuleAccess(moduleId)
      .then((response) => {
        if (!active) return;
        if (response?.allowed === false) {
          setStatus("preview");
        } else if (response?.mode) {
          setStatus(response.mode);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [moduleId, stateStatus]);

  return status;
}
