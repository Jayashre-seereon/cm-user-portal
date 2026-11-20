import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getDashboard } from "../api/dashboardApi";
import { useAuthStore } from "../store/authStore";
import { getNotifications } from "../api/notificationApi";
import { getMentorBookings, getSubscriptions, getTestHistory } from "../api/profile";
import { formatCurrency, formatDate as formatSharedDate } from "../utils/format";
import { mapApiUserToProfile, mergeServerProfile } from "../utils/auth";

const STORAGE_KEY = "careermap-userportal-state";
const emptyUserProfile = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  address: "",
  city: "",
  stateName: "",
  district: "",
  country: "India",
  gender: "",
  dob: "",
  childName: "",
};

const planFeatures = {
  psychometric: ["psychometric-test"],
  premium: ["psychometric-test", "book-mentor", "master-class"],
  infocentre: ["psychometric-test", "book-mentor", "master-class", "scholarship", "career-library"],
  abroad: ["abroad-consultancy"],
};

// Feature keys unlocked by the modules that a plan includes (server-driven).
const MODULE_FEATURE_PATTERNS = [
  [/psychometric|assessment|\btest\b/i, "psychometric-test"],
  [/mentor/i, "book-mentor"],
  [/master\s*class/i, "master-class"],
  [/scholar/i, "scholarship"],
  [/abroad/i, "abroad-consultancy"],
  [/newsletter/i, "newsletter"],
  [/quiz/i, "quiz"],
  [/library|career\s*path/i, "career-library"],
];

function deriveFeaturesFromSubscriptions(items = []) {
  const features = new Set();
  items.forEach((item) => {
    const modules = Array.isArray(item?.plan?.modules) ? item.plan.modules : [];
    modules.forEach((module) => {
      const title = String(module?.title ?? module?.name ?? module ?? "");
      MODULE_FEATURE_PATTERNS.forEach(([pattern, feature]) => {
        if (pattern.test(title)) features.add(feature);
      });
    });
  });
  return Array.from(features);
}

// A subscription is active only when its status is active and it has not expired.
function isActiveSubscription(item) {
  if (String(item?.status || "").toLowerCase() !== "active") return false;
  const end = item?.endDate || item?.expiryDate || item?.expiry_date || item?.validUntil;
  if (end) {
    const endTime = new Date(end).getTime();
    if (!Number.isNaN(endTime) && endTime < Date.now()) return false;
  }
  return true;
}

const initialState = {
  serverFeatures: [],
  activePlanId: null,
  activePlanIds: [],
  promoMessage: "",
  onboarding: {
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
  },
  userProfile: {
    ...emptyUserProfile,
  },
  preferences: {
    notifications: {
      pushNotifications: true,
      scholarshipAlerts: true,
      mentorReminders: false,
    },
  },
  savedCareers: ["Software Engineering", "UX Design", "Psychology", "Digital Marketing"],
  testHistory: [],
  bookings: [],
  subscriptionRecords: [],
  dashboardData: null,
  profileIncomplete: false,
  freeAccessUsage: {
    "career-library": null,
    "master-class": null,
    "book-mentor": null,
    scholarship: null,
    "abroad-consultancy": null,
  },
  profileEditRequestKey: 0,
  authenticated: false,
};

const AppStateContext = createContext(null);

function readInitialState() {
  const isAuthenticated = Boolean(useAuthStore.getState().accessToken);

  if (!isAuthenticated || typeof window === "undefined") {
    return { ...initialState, authenticated: false };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...initialState, authenticated: isAuthenticated };
    }
    const parsed = JSON.parse(stored);
    // Persisted profile/bookings/test history belong to one user. If a different
    // user is signed in now, never show the previous user's data.
    const currentUser = useAuthStore.getState().user;
    const currentOwnerId = currentUser?.id ?? currentUser?._id;
    if (
      currentOwnerId == null ||
      parsed.ownerId == null ||
      String(parsed.ownerId) !== String(currentOwnerId)
    ) {
      return { ...initialState, authenticated: isAuthenticated };
    }
    const migratedPlanIds = Array.isArray(parsed.activePlanIds)
      ? parsed.activePlanIds
      : parsed.activePlanId
        ? [parsed.activePlanId]
        : [];

    return {
      ...initialState,
      ...parsed,
      profileEditRequestKey: 0,
      authenticated: isAuthenticated,
      userProfile: {
        ...emptyUserProfile,
        ...(parsed.userProfile || {}),
      },
      activePlanIds: migratedPlanIds,
      activePlanId: parsed.activePlanId ?? migratedPlanIds[migratedPlanIds.length - 1] ?? null,
    };
  } catch {
    return { ...initialState, authenticated: isAuthenticated };
  }
}

function extractResponseItems(response) {
  const candidates = [
    response?.data?.data,
    response?.data?.results,
    response?.data,
    response?.results,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(Boolean);
    }
  }

  return [];
}

function formatDateLabel(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return formatSharedDate(date);
}

function formatValidityDays(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue) && String(value).trim() !== "") {
    return `${numericValue} days`;
  }

  return formatDateLabel(value);
}

function mapTestHistoryItem(item, index = 0) {
  const title = item?.title || item?.testName || item?.quizName || item?.name || `Test ${index + 1}`;
  const statusText = item?.status || item?.result || item?.attemptStatus || "";
  const dateText = formatDateLabel(item?.completedAt || item?.completed_at || item?.createdAt || item?.created_at || item?.date);
  const scoreText = item?.score != null ? `Score: ${item.score}` : "";
  const subtitle = [statusText ? `Status: ${statusText}` : "", dateText ? `Date: ${dateText}` : "", scoreText].filter(Boolean).join(" • ");

  return {
    id: String(item?.id ?? `test-${index}`),
    title,
    subtitle: subtitle || item?.subtitle || "Test history item",
    status: statusText || "Completed",
  };
}

function mapBookingItem(item, index = 0) {
  const mentorName = item?.mentorName || item?.mentor?.name || item?.mentor?.fullName || item?.mentor?.mentorName || `Mentor Booking ${index + 1}`;
  const date = formatDateLabel(item?.date || item?.bookingDate || item?.appointmentDate || item?.scheduledAt || item?.slotDate);
  const time = item?.time || item?.slotTime || item?.startTime || item?.appointmentTime || item?.slot || "";

  return {
    id: String(item?.id ?? `booking-${index}`),
    mentorName,
    date: date || "Date not available",
    time: time || "Time not available",
    status: item?.status || item?.bookingStatus || "Confirmed",
  };
}

function mapSubscriptionItem(item, index = 0) {
  const planName = item?.planName || item?.plan_name || item?.plan?.name || item?.plan || `Subscription ${index + 1}`;
  const expiryDate = formatDateLabel(item?.expiryDate || item?.expiry_date || item?.endDate || item?.validUntil || item?.renewalDate);
  const transactionId = item?.transactionId || item?.transaction_id || item?.transaction || item?.reference || "";
  const price = item?.price != null ? formatCurrency(item.price) || `Rs ${item.price}` : item?.amount != null ? formatCurrency(item.amount) || `Rs ${item.amount}` : "";

  return {
    id: String(item?.id ?? `subscription-${index}`),
    planName,
    planId: item?.planId ?? item?.plan_id ?? item?.plan?.id ?? null,
    price: price || "Subscription active",
    expiryDate: expiryDate || "Expiry date not available",
    transactionId: transactionId || "Transaction not available",
    status: item?.status || "Active",
  };
}

function getPlanIdFromSubscription(item) {
  const rawPlanId = item?.planId ?? item?.plan_id ?? item?.plan?.id ?? null;
  if (rawPlanId !== null && rawPlanId !== undefined && rawPlanId !== "") {
    return String(rawPlanId);
  }

  const planText = String(item?.planName || item?.plan_name || item?.plan?.name || item?.plan || "").toLowerCase();

  if (planText.includes("psychometric") && planText.includes("counsell")) {
    return "premium";
  }

  if (planText.includes("psychometric")) {
    return "psychometric";
  }

  if (planText.includes("infocentre") || planText.includes("info centre")) {
    return "infocentre";
  }

  if (planText.includes("abroad")) {
    return "abroad";
  }

  if (planText.includes("premium")) {
    return "premium";
  }

  return "";
}

function normalizeTestHistoryItems(items = []) {
  return items.map((item, index) => {
    const mapped = mapTestHistoryItem(item, index);
    const quizName = item?.quiz?.title || item?.quizName || item?.quiz_name || item?.testName || item?.test_name || mapped.title;
    const attemptedAtRaw = item?.attemptedAt || item?.attempted_at || item?.submittedAt || item?.submitted_at || item?.completedAt || item?.completed_at || item?.createdAt || item?.created_at || item?.date || "";
    const attemptedAt = formatDateLabel(attemptedAtRaw);
    const score = item?.score != null ? String(item.score) : item?.correctAnswers != null && item?.totalQuestions != null ? `${item.correctAnswers}/${item.totalQuestions}` : item?.marks != null ? String(item.marks) : mapped.score || "";

    return {
      ...mapped,
      title: quizName,
      quizName,
      score,
      attemptedAt,
      attemptedAtRaw,
    };
  });
}

function normalizeBookingItems(items = []) {
  return items.map((item, index) => {
    const mapped = mapBookingItem(item, index);
    const mentorFee = item?.mentor?.mentor_fees ?? item?.mentorFee ?? item?.fee ?? item?.amount ?? item?.payment?.amount ?? item?.price ?? item?.mentor?.fee ?? mapped.mentorFee ?? "";
    const timeSlot = item?.timeSlot || item?.slot || item?.payment?.timeSlot || mapped.timeSlot || mapped.time || "";
    const mentorName = item?.mentor?.name || item?.mentorName || item?.mentor?.fullName || item?.mentor?.mentorName || mapped.mentorName;

    return {
      ...mapped,
      mentorName,
      mentorFee,
      timeSlot,
      date: formatDateLabel(item?.date || item?.bookingDate || item?.appointmentDate || item?.scheduledAt || item?.slotDate || mapped.date),
    };
  });
}

function normalizeSubscriptionItems(items = []) {
  return items.map((item, index) => {
    const mapped = mapSubscriptionItem(item, index);
    const subscriptionName = item?.plan?.name || item?.subscriptionName || item?.subscription_name || item?.planName || mapped.planName;
    const amount = item?.amount != null ? item.amount : item?.plan?.price != null ? item.plan.price : item?.price != null ? item.price : mapped.amount || "";
    const validity = formatValidityDays(item?.plan?.validity ?? item?.validity ?? item?.validityDays ?? item?.daysValid ?? item?.subscriptionValidity ?? mapped.validity);
    const expiryDate = formatDateLabel(item?.endDate || item?.expiryDate || item?.expiry_date || item?.validUntil || item?.renewalDate);
    const planId = item?.planId ?? item?.plan_id ?? item?.plan?.id ?? mapped.planId ?? null;

    return {
      ...mapped,
      planId,
      planName: subscriptionName,
      subscriptionName,
      amount,
      validity: validity || mapped.validity,
      expiryDate: expiryDate || mapped.expiryDate,
      price: amount !== "" ? formatCurrency(amount) || `Rs ${amount}` : mapped.price,
    };
  });
}

export function AppStateProvider({ children }) {
  const [state, setState] = useState(readInitialState);
  const ownerIdRef = useRef(
    (() => {
      const u = useAuthStore.getState().user;
      return u?.id ?? u?._id ?? null;
    })()
  );
  const accessToken = useAuthStore((current) => current.accessToken);

  const refreshNotifications = useCallback(async () => {
    if (!accessToken) return [];
    const items = await getNotifications();
    if (useAuthStore.getState().accessToken !== accessToken) return [];
    setState((current) => ({ ...current, notifications: items }));
    return items;
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) refreshNotifications().catch(() => {});
  }, [accessToken, refreshNotifications]);

  useEffect(() => {
    if (!accessToken) {
      setState((current) => ({ ...current, dashboardData: null }));
      return undefined;
    }

    let active = true;

    async function loadDashboardData() {
      try {
        const response = await getDashboard();
        if (active && response?.success) {
          // The dashboard carries the signed-in user's saved record. Load the profile (name,
          // email, ...) from it, so it never depends on a copy kept in this browser, which is
          // empty after a reload, a cleared cache or a different browser.
          const serverProfile = mapApiUserToProfile(response.data?.user);
          setState((current) => ({
            ...current,
            dashboardData: response.data || null,
            userProfile: mergeServerProfile(current.userProfile, serverProfile),
          }));
        }
      } catch {
        if (active) {
          setState((current) => ({ ...current, dashboardData: null }));
        }
      }
    }

    loadDashboardData();
    return () => {
      active = false;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      setState(() => ({
        ...initialState,
        authenticated: false,
      }));
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {}
      }
      return undefined;
    }

    let active = true;

    // Safety net: the access token must belong to the signed-in user. If it was issued for a
    // different account, end the session instead of showing that account's data.
    try {
      const store = useAuthStore.getState();
      const payload = JSON.parse(atob(String(store.accessToken).split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      const storedId = store.user?.id ?? store.user?._id;
      if (payload?.id != null && storedId != null && String(payload.id) !== String(storedId)) {
        store.logout();
        window.location.replace("/auth-entry");
        return undefined;
      }
    } catch {
      // token not decodable here; the API will reject it if invalid
    }

    // A different user signed in without a page reload: drop the previous user's
    // in-memory profile, test history and bookings before loading the new user's.
    const signedInUser = useAuthStore.getState().user;
    const signedInId = signedInUser?.id ?? signedInUser?._id ?? null;
    if (ownerIdRef.current != null && signedInId != null && String(ownerIdRef.current) !== String(signedInId)) {
      setState(() => ({ ...initialState, authenticated: true }));
    }
    ownerIdRef.current = signedInId;

    async function loadProfileSections() {
      try {
        const [testResponse, bookingResponse, subscriptionResponse] = await Promise.all([
          getTestHistory().catch(() => null),
          getMentorBookings().catch(() => null),
          getSubscriptions({ force: true }).catch(() => null),
        ]);

        if (!active) {
          return;
        }

        const testItems = extractResponseItems(testResponse);
        const bookingItems = extractResponseItems(bookingResponse);
        const subscriptionItems = extractResponseItems(subscriptionResponse);

        const currentUser = useAuthStore.getState().user;
        const currentUserId = currentUser?.id ?? currentUser?._id;

        const userSubscriptions = subscriptionItems.filter((item) => {
          if (!item) return false;
          const itemUserId = item.userId ?? item.user_id ?? item.user?.id ?? item.user?._id;
          if (currentUserId && itemUserId && String(itemUserId) !== String(currentUserId)) {
            return false;
          }
          return true;
        });

        const activeSubscriptions = userSubscriptions.filter(
          (item) => isActiveSubscription(item)
        );

        const freshActivePlanIds = Array.from(
          new Set(
            activeSubscriptions
              .flatMap((item) => {
                const idFromFn = getPlanIdFromSubscription(item);
                const rawPlanId = item?.planId ?? item?.plan_id ?? item?.plan?.id;
                return [idFromFn, rawPlanId != null ? String(rawPlanId) : null].filter(Boolean);
              })
          )
        );

        setState((current) => ({
          ...current,
          testHistory: normalizeTestHistoryItems(testItems),
          bookings: normalizeBookingItems(bookingItems),
          subscriptionRecords: normalizeSubscriptionItems(userSubscriptions),
          activePlanIds: freshActivePlanIds,
          activePlanId: freshActivePlanIds[0] || null,
          serverFeatures: deriveFeaturesFromSubscriptions(activeSubscriptions),
        }));
      } catch {
        if (!active) {
          return;
        }

        setState((current) => ({
          ...current,
          testHistory: [],
          bookings: initialState.bookings,
          subscriptionRecords: initialState.subscriptionRecords,
          activePlanIds: [],
          activePlanId: null,
          serverFeatures: [],
        }));
      }
    }

    loadProfileSections();
    return () => {
      active = false;
    };
  }, [accessToken]);

  useEffect(() => {
    if (state.authenticated) {
      const { profileEditRequestKey, ...persistedState } = state;
      const owner = useAuthStore.getState().user;
      persistedState.ownerId = owner?.id ?? owner?._id ?? null;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
      } catch {
        // Storage can be unavailable (private mode) or full; the app keeps working in memory.
      }
    } else if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [state]);

  useEffect(() => {
    const syncAuthentication = ({ accessToken }) => {
      setState((current) => {
        const isAuth = Boolean(accessToken);
        if (current.authenticated === isAuth) return current;
        if (!isAuth) {
          return { ...initialState, authenticated: false };
        }
        return { ...current, authenticated: true };
      });
    };

    syncAuthentication(useAuthStore.getState());
    return useAuthStore.subscribe(syncAuthentication);
  }, []);

  const value = useMemo(() => {
    const activePlanId = state.activePlanId;
    const activePlanIds = state.activePlanIds?.length
      ? state.activePlanIds
      : activePlanId
        ? [activePlanId]
        : [];
    const unlockedFeatures = new Set([
      ...activePlanIds.flatMap((planId) => planFeatures[planId] || []),
      ...(state.serverFeatures || []),
    ]);

    return {
      ...state,
      activePlanIds,
      hasActiveSubscription: activePlanIds.length > 0,
      unreadNotificationsCount: (state.notifications || []).filter((item) => item.unread).length,
      refreshNotifications,
      isUnlocked(feature) {
        return unlockedFeatures.has(feature);
      },
      activatePlan(planId) {
        setState((current) => {
          const currentPlanIds = current.activePlanIds?.length
            ? current.activePlanIds
            : current.activePlanId
              ? [current.activePlanId]
              : [];

          if (currentPlanIds.includes(planId) && current.activePlanId === planId) {
            return current;
          }

          return {
            ...current,
            activePlanId: planId,
            activePlanIds: currentPlanIds.includes(planId)
              ? currentPlanIds
              : [...currentPlanIds, planId],
          };
        });
      },
      authenticate() {
        setState((current) => ({ ...current, authenticated: true }));
      },
      logout() {
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
            window.localStorage.removeItem("careermap-auth-store");
            window.localStorage.removeItem("careermap-reviewed-mentor-bookings");
            window.localStorage.removeItem("userPortalData");
            window.localStorage.removeItem("token");
            window.localStorage.removeItem("user");
            window.localStorage.removeItem("accessToken");
            window.localStorage.removeItem("refreshToken");
            window.sessionStorage.clear();
          } catch (e) {
            console.error("Storage clear error on logout:", e);
          }
        }
        useAuthStore.getState().logout();
        setState(() => ({ ...initialState, authenticated: false }));
      },
      async refreshUserData() {
        try {
          const [testResponse, bookingResponse, subscriptionResponse, dashboardResponse] = await Promise.all([
            getTestHistory({ force: true }).catch(() => null),
            getMentorBookings({ force: true }).catch(() => null),
            getSubscriptions({ force: true }).catch(() => null),
            getDashboard({ force: true }).catch(() => null),
          ]);

          const testItems = extractResponseItems(testResponse);
          const bookingItems = extractResponseItems(bookingResponse);
          const subscriptionItems = extractResponseItems(subscriptionResponse);
          const currentUser = useAuthStore.getState().user;
          const currentUserId = currentUser?.id ?? currentUser?._id;

          const userSubscriptions = subscriptionItems.filter((item) => {
            if (!item) return false;
            const itemUserId = item.userId ?? item.user_id ?? item.user?.id ?? item.user?._id;
            if (currentUserId && itemUserId && String(itemUserId) !== String(currentUserId)) {
              return false;
            }
            return true;
          });

          const activeSubscriptions = userSubscriptions.filter(
            (item) => isActiveSubscription(item)
          );

          const freshActivePlanIds = Array.from(
            new Set(
              activeSubscriptions
                .flatMap((item) => {
                  const idFromFn = getPlanIdFromSubscription(item);
                  const rawPlanId = item?.planId ?? item?.plan_id ?? item?.plan?.id;
                  return [idFromFn, rawPlanId != null ? String(rawPlanId) : null].filter(Boolean);
                })
            )
          );

          setState((current) => ({
            ...current,
            dashboardData: dashboardResponse?.success ? dashboardResponse.data : current.dashboardData,
            userProfile: dashboardResponse?.success
              ? mergeServerProfile(current.userProfile, mapApiUserToProfile(dashboardResponse.data?.user))
              : current.userProfile,
            testHistory: normalizeTestHistoryItems(testItems),
            bookings: normalizeBookingItems(bookingItems),
            subscriptionRecords: normalizeSubscriptionItems(userSubscriptions),
            activePlanIds: freshActivePlanIds,
            activePlanId: freshActivePlanIds[0] || null,
            serverFeatures: deriveFeaturesFromSubscriptions(activeSubscriptions),
          }));
        } catch (err) {
          console.warn("refreshUserData error:", err);
        }
      },
      showPromoMessage(message) {
        setState((current) => ({ ...current, promoMessage: message }));
      },
      clearPromoMessage() {
        setState((current) => ({ ...current, promoMessage: "" }));
      },
      saveOnboarding(data) {
        setState((current) => ({ ...current, onboarding: data }));
      },
      saveUserProfile(data) {
        setState((current) => ({ ...current, userProfile: data }));
      },
      setProfileIncomplete(value) {
        setState((current) => ({ ...current, profileIncomplete: Boolean(value) }));
      },
      updatePreferences(data) {
        setState((current) => ({
          ...current,
          preferences: {
            ...current.preferences,
            ...data,
            notifications: {
              ...current.preferences.notifications,
              ...(data.notifications || {}),
            },
          },
        }));
      },
      toggleSavedCareer(career) {
        setState((current) => ({
          ...current,
          savedCareers: current.savedCareers.includes(career)
            ? current.savedCareers.filter((item) => item !== career)
            : [...current.savedCareers, career],
        }));
      },
      addTestHistory(item) {
        setState((current) => ({
          ...current,
          testHistory: [item, ...current.testHistory.filter((entry) => entry.id !== item.id)],
        }));
      },
      addBooking(item) {
        setState((current) => ({
          ...current,
          bookings: [item, ...current.bookings.filter((entry) => entry.id !== item.id)],
        }));
      },
      canAccessFreeDetail(feature, itemKey) {
        if (unlockedFeatures.has(feature)) {
          return true;
        }
        const firstViewedItem = state.freeAccessUsage[feature];
        return firstViewedItem === null || firstViewedItem === itemKey;
      },
      registerFreeDetailAccess(feature, itemKey) {
        setState((current) => {
          const currentPlanIds = current.activePlanIds?.length
            ? current.activePlanIds
            : current.activePlanId
              ? [current.activePlanId]
              : [];
          const hasUnlockedFeature =
            currentPlanIds.some((planId) => planFeatures[planId]?.includes(feature)) ||
            (current.serverFeatures || []).includes(feature);

          if (hasUnlockedFeature) {
            return current;
          }
          if (current.freeAccessUsage[feature] !== null) {
            return current;
          }
          return {
            ...current,
            freeAccessUsage: {
              ...current.freeAccessUsage,
              [feature]: itemKey,
            },
          };
        });
      },
      requestProfileEdit() {
        setState((current) => ({
          ...current,
          profileEditRequestKey: current.profileEditRequestKey + 1,
        }));
      },
      clearProfileEditRequest() {
        setState((current) => ({
          ...current,
          profileEditRequestKey: 0,
        }));
      },
      resetPortalState() {
        setState((current) => ({
          ...initialState,
          preferences: current.preferences,
        }));
      },
      subscriptionRecords: state.subscriptionRecords || [],
      dashboardData: state.dashboardData,
      profileIncomplete: state.profileIncomplete,
    };
  }, [state, refreshNotifications]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return value;
}
