import { useState } from "react";
import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";
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

// /profile-setup is only meaningful right after a verified signup OTP (tempToken).
// The check is made once on mount so that completing signup (which clears the
// tempToken) does not bounce the user away before they reach /promo.
export function RequireSignupToken() {
  const [allowed] = useState(() => Boolean(useAuthStore.getState().tempToken));

  if (!allowed) {
    return <Navigate to="/auth-entry" replace />;
  }

  return <Outlet />;
}

// /otp-verify needs to know which number the OTP was sent to.
export function RequireOtpContext() {
  const [params] = useSearchParams();
  const signupMobile = useAuthStore((state) => state.signupForm?.mobile);

  if (!params.get("identifier") && !signupMobile) {
    return <Navigate to="/auth-entry" replace />;
  }

  return <Outlet />;
}
