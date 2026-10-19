import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppState } from "../../state/AppStateContext";
import { useAuthStore } from "../../store/authStore";

export function RequireAuth() {
  const { authenticated } = useAppState();
  const pendingInstituteOnboarding = useAuthStore((state) => state.pendingInstituteOnboarding);
  const location = useLocation();

  if (!authenticated) {
    return <Navigate to="/auth-entry" state={{ from: location }} replace />;
  }

  if (pendingInstituteOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export function PublicOnly() {
  const { authenticated } = useAppState();
  const pendingInstituteOnboarding = useAuthStore((state) => state.pendingInstituteOnboarding);
  const location = useLocation();

  if (authenticated) {
    if (location.pathname === "/onboarding" && pendingInstituteOnboarding) {
      return <Outlet />;
    }

    if (pendingInstituteOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }

    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
