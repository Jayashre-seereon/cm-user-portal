import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { notifications as notificationItems } from "../data/careermapData";
import { getDashboard } from "../api/dashboardApi";
import { useAuthStore } from "../store/authStore";
import { getNotifications } from "../api/notificationApi";
import { getMentorBookings, getSubscriptions, getTestHistory } from "../api/profile";

const STORAGE_KEY = "careermap-userportal-state";
const LEGACY_DEMO_EMAIL = "aarav.sharma@email.com";
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

const initialState = {
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
  testHistory: [
    { id: "1", title: "Personality Snapshot", subtitle: "Completed on 08 Apr 2026", status: "Completed" },
    { id: "2", title: "Career Aptitude Test", subtitle: "Scheduled for 13 Apr 2026", status: "Upcoming" },
    { id: "3", title: "Psychometric Summary", subtitle: "Available in reports", status: "Available" },
  ],
  bookings: [
    { id: "1", mentorName: "Dr. Priya Sharma", date: "12 Apr 2026", time: "4:00 PM", status: "Confirmed" },
    { id: "2", mentorName: "Prof. Rahul Verma", date: "15 Apr 2026", time: "6:30 PM", status: "Upcoming" },
  ],
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

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
  const price = item?.price != null ? `Rs ${item.price}` : item?.amount != null ? `Rs ${item.amount}` : "";

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
      price: amount !== "" ? `Rs ${amount}` : mapped.price,
    };
  });
}

export function AppStateProvider({ children }) {
  const [state, setState] = useState(readInitialState);
  const accessToken = useAuthStore((current) => current.accessToken);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      if (!accessToken) {
        return;
      }

      try {
        const items = await getNotifications();
        if (active && items.length) {
          setState((current) => ({ ...current, notifications: items }));
        }
      } catch {
        // Keep the local fallback notifications when the API is unavailable.
      }
    }

    loadNotifications();
    return () => {
      active = false;
    };
  }, [accessToken]);

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
          setState((current) => ({ ...current, dashboardData: response.data || null }));
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

    async function loadProfileSections() {
      try {
        const [testResponse, bookingResponse, subscriptionResponse] = await Promise.all([
          getTestHistory().catch(() => null),
          getMentorBookings().catch(() => null),
          getSubscriptions().catch(() => null),
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
          (item) => String(item?.status || "").toLowerCase() === "active"
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
          testHistory: testItems.length > 0 ? normalizeTestHistoryItems(testItems) : initialState.testHistory,
          bookings: bookingItems.length > 0 ? normalizeBookingItems(bookingItems) : initialState.bookings,
          subscriptionRecords: normalizeSubscriptionItems(userSubscriptions),
          activePlanIds: freshActivePlanIds,
          activePlanId: freshActivePlanIds[0] || null,
        }));
      } catch {
        if (!active) {
          return;
        }

        setState((current) => ({
          ...current,
          testHistory: initialState.testHistory,
          bookings: initialState.bookings,
          subscriptionRecords: initialState.subscriptionRecords,
          activePlanIds: [],
          activePlanId: null,
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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
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
    const unlockedFeatures = new Set(
      activePlanIds.flatMap((planId) => planFeatures[planId] || [])
    );

    return {
      ...state,
      activePlanIds,
      hasActiveSubscription: activePlanIds.length > 0,
      unreadNotificationsCount: notificationItems.filter((item) => item.unread).length,
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
            getTestHistory().catch(() => null),
            getMentorBookings().catch(() => null),
            getSubscriptions().catch(() => null),
            getDashboard().catch(() => null),
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
            (item) => String(item?.status || "").toLowerCase() === "active"
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
            testHistory: testItems.length > 0 ? normalizeTestHistoryItems(testItems) : current.testHistory,
            bookings: bookingItems.length > 0 ? normalizeBookingItems(bookingItems) : current.bookings,
            subscriptionRecords: normalizeSubscriptionItems(userSubscriptions),
            activePlanIds: freshActivePlanIds,
            activePlanId: freshActivePlanIds[0] || null,
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
          const hasUnlockedFeature = currentPlanIds.some((planId) => planFeatures[planId]?.includes(feature));

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
      subscriptionRecords: state.subscriptionRecords?.length
        ? state.subscriptionRecords
        : activePlanIds.map((planId) => ({
            id: planId,
            planName:
              planId === "psychometric"
                ? "Psychometric Test"
                : planId === "premium"
                  ? "Psychometric + Counselling"
                  : planId === "infocentre"
                    ? "Infocentre Access"
                    : "Study Abroad Access",
            price:
              planId === "psychometric"
                ? "Rs 1,500"
                : planId === "premium"
                  ? "Rs 3,000"
                  : planId === "infocentre"
                    ? "Rs 5,000"
                    : "Rs 2,500",
            expiryDate: "10 Apr 2027",
            transactionId: `TXN-${planId.toUpperCase()}-2401`,
          })),
      dashboardData: state.dashboardData,
      profileIncomplete: state.profileIncomplete,
    };
  }, [state]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return value;
}
