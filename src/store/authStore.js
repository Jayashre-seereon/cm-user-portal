import { create } from "zustand";
import { persist } from "zustand/middleware";

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
        set(() => ({
          accessToken,
          refreshToken,
          user,
          tempToken: "",
        })),

      updateAuthSession: ({ accessToken, refreshToken, user } = {}) =>
        set((state) => ({
          accessToken: accessToken ?? state.accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
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
        pendingInstituteOnboarding: false,
      }),
      partialize: (state) => ({
        signupForm: state.signupForm,
        onboardingData: state.onboardingData,
        tempToken: state.tempToken,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
