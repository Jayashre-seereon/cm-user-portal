import { create } from "zustand";
import { persist } from "zustand/middleware";
import { COOKIE_MODE } from "../utils/cookieMode";

const initialSignupForm = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  confirmPassword: "",
  city: "",
  state: "",
};

const initialOnboardingData = {
  userType: "",
  name: "",
  childName: "",
  selectedClass: "",
  selectedStream: "",
  selectedInterests: [],
  selectedClarity: "",
  selectedStrengths: [],
  selectedPriorities: [],
  selectedGuidance: "",
};

export const useAuthStore = create(
  persist(
    (set) => ({
      signupForm: initialSignupForm,
      onboardingData: initialOnboardingData,
      pendingInstituteOnboarding: false,
      tempToken: "",
      accessToken: "",
      refreshToken: "",
      user: null,

      setSignupForm: (data) =>
        set((state) => ({
          signupForm: {
            ...state.signupForm,
            ...data,
          },
        })),

      setOnboardingData: (data) =>
        set(() => ({
          onboardingData: data,
        })),

      setPendingInstituteOnboarding: (pendingInstituteOnboarding) =>
        set(() => ({
          pendingInstituteOnboarding,
        })),

      setTempToken: (tempToken) => set(() => ({ tempToken })),

      setAuthSession: ({ accessToken = "", refreshToken = "", user = null }) =>
        set((state) => {
          // A different account is signing in: remove the previous user's cached
          // assessment answers, bookings and profile so nothing leaks across users.
          const previousId = state.user?.id ?? state.user?._id;
          const nextId = user?.id ?? user?._id;
          if (
            previousId != null &&
            nextId != null &&
            String(previousId) !== String(nextId) &&
            typeof window !== "undefined"
          ) {
            try {
              window.localStorage.removeItem("careermap-userportal-state");
              window.localStorage.removeItem("careermap-reviewed-mentor-bookings");
              window.localStorage.removeItem("careermap_responses");
              Object.keys(window.localStorage)
                .filter((key) => key.startsWith("assessment:"))
                .forEach((key) => window.localStorage.removeItem(key));
              window.sessionStorage.clear();
            } catch {
              // storage unavailable
            }
          }
          return {
            accessToken,
            refreshToken: COOKIE_MODE ? "" : refreshToken,
            user,
            tempToken: "",
          };
        }),

      updateAuthSession: ({ accessToken, refreshToken, user } = {}) =>
        set((state) => ({
          accessToken: accessToken ?? state.accessToken,
          refreshToken: COOKIE_MODE && refreshToken !== "" && refreshToken !== undefined ? "" : (refreshToken ?? state.refreshToken),
          user: user ?? state.user,
          tempToken: "",
        })),

      setUser: (user) => set(() => ({ user })),

      clearAuthFlow: () =>
        set(() => ({
          signupForm: initialSignupForm,
          tempToken: "",
        })),

      logout: () => {
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem("careermap-auth-store");
            window.localStorage.removeItem("careermap-userportal-state");
            window.localStorage.removeItem("careermap-reviewed-mentor-bookings");
            window.localStorage.removeItem("userPortalData");
            window.localStorage.removeItem("token");
            window.localStorage.removeItem("user");
            window.localStorage.removeItem("accessToken");
            window.localStorage.removeItem("refreshToken");
            window.localStorage.removeItem("careermap_responses");
            Object.keys(window.localStorage)
              .filter((key) => key.startsWith("assessment:"))
              .forEach((key) => window.localStorage.removeItem(key));
            window.sessionStorage.clear();
          } catch (e) {
            console.error("Storage clear error on authStore logout:", e);
          }
        }
        return set(() => ({
          signupForm: initialSignupForm,
          onboardingData: initialOnboardingData,
          pendingInstituteOnboarding: false,
          tempToken: "",
          accessToken: "",
          refreshToken: "",
          user: null,
        }));
      },
    }),
    {
      name: "careermap-auth-store",
      version: 2,
      migrate: (persistedState) => ({
        ...persistedState,
        signupForm: persistedState?.signupForm
          ? { ...persistedState.signupForm, password: "", confirmPassword: "" }
          : persistedState?.signupForm,
        pendingInstituteOnboarding: false,
      }),
      partialize: (state) => ({
        // Never persist the signup password to localStorage
        signupForm: { ...state.signupForm, password: "", confirmPassword: "" },
        onboardingData: state.onboardingData,
        tempToken: state.tempToken,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
