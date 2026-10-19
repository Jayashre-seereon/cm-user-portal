import { Avatar, Button, Modal, Rate, Input, message } from "antd";
import { BankOutlined, BellOutlined, RightOutlined, TrophyFilled, CreditCardOutlined, HistoryOutlined, TrophyOutlined, CommentOutlined ,ArrowRightOutlined} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { getDashboard } from "../../../api/dashboardApi";
import { checkModuleAccess } from "../../../api/moduleAccessApi";
import { createMentorReview } from "../../../api/mentorApi";
import { personalityQuestions, personalityTypes, palette } from "../../../data/careermapData";
import { useAppState } from "../../../state/AppStateContext";
import {
  buildDashboardInstitutes,
  buildDashboardEntranceExams,
  buildDashboardMentors,
  buildDashboardScholarships,
  normalizeModuleTitle,
} from "../../../utils/dashboard";
import { usePortalNavigation } from "../../portal/components/portalPageShared";
import { DashboardHeroSection } from "../../portal/components/DashboardHeroSection";
import { ExploreModulesSection } from "../../portal/components/ExploreModulesSection";
import { PersonalityQuizQuestion, PersonalityQuizResults } from "../../portal/components/PersonalityQuizSections";

function parseDateForReview(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const numericDate = new Date(value);
    return Number.isNaN(numericDate.getTime()) ? null : numericDate;
  }

  const rawValue = String(value).trim();
  if (!rawValue) {
    return null;
  }

  const isoDate = new Date(rawValue);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate;
  }

  const match = rawValue.match(/^(\d{1,2})\s([A-Za-z]{3})\s(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, day, monthLabel, year] = match;
  const monthMap = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  const monthIndex = monthMap[monthLabel];
  if (monthIndex === undefined) {
    return null;
  }

  const parsedDate = new Date(Number(year), monthIndex, Number(day));
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function parseSlotEndTime(timeSlot) {
  if (!timeSlot) {
    return null;
  }

  const rawValue = String(timeSlot).trim();
  if (!rawValue) {
    return null;
  }

  const rangePart = rawValue.split("-").pop()?.trim() || rawValue;
  const twentyFourHourMatch = rangePart.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!twentyFourHourMatch) {
    return null;
  }

  let hours = Number(twentyFourHourMatch[1]);
  const minutes = Number(twentyFourHourMatch[2]);
  const period = twentyFourHourMatch[3]?.toUpperCase() || "";

  if (period === "PM" && hours < 12) {
    hours += 12;
  }
  if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

function getReviewEligibleAt(item) {
  const date = parseDateForReview(item?.date || item?.bookingDate || item?.appointmentDate || item?.scheduledAt || item?.slotDate);
  const endTime = parseSlotEndTime(item?.timeSlot || item?.slot || item?.time || item?.slotTime || item?.appointmentTime || item?.startTime);

  if (!date || !endTime) {
    return null;
  }

  const eligibleAt = new Date(date);
  eligibleAt.setHours(endTime.hours, endTime.minutes, 0, 0);
  return eligibleAt;
}

export default function DashboardPage() {
  const {
    activePlanIds,
    isUnlocked,
    onboarding,
    unreadNotificationsCount,
    userProfile,
    dashboardData: globalDashboardData,
    profileIncomplete,
    requestProfileEdit,
  } = useAppState();
  const { navigate } = usePortalNavigation();
  const [showPersonality, setShowPersonality] = useState(false);
  const [personalityStep, setPersonalityStep] = useState(0);
  const [answers, setAnswers] = useState(Array(personalityQuestions.length).fill(null));
  const [complete, setComplete] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [profileReminderOpen, setProfileReminderOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [lockedSection, setLockedSection] = useState(null);
  const [reviewedMentorBookings, setReviewedMentorBookings] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("careermap-reviewed-mentor-bookings");
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  });

  const personalityResult = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    answers.forEach((answer) => {
      if (answer !== null) counts[answer] += 1;
    });
    return personalityTypes[counts.indexOf(Math.max(...counts))];
  }, [answers]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setError("");
        const response = await getDashboard();
        if (active && response?.success) {
          setDashboardData(response.data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError?.response?.data?.message || loadError?.message || "Failed to load dashboard.");
        }
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "careermap-reviewed-mentor-bookings",
        JSON.stringify(reviewedMentorBookings)
      );
    }
  }, [reviewedMentorBookings]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const dashboardUserName = useMemo(() => {
    const firstName = dashboardData?.user?.firstName?.trim();
    const lastName = dashboardData?.user?.lastName?.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    return fullName || userProfile.name || onboarding.name || "Student";
  }, [dashboardData?.user?.firstName, dashboardData?.user?.lastName, onboarding.name, userProfile.name]);

  const dashboardMentors = useMemo(() => buildDashboardMentors(dashboardData?.mentors || []), [dashboardData?.mentors]);
  const dashboardScholarships = useMemo(() => buildDashboardScholarships(dashboardData?.scholarships || []), [dashboardData?.scholarships]);
  const dashboardInstitutes = useMemo(() => buildDashboardInstitutes(dashboardData?.institutions || []), [dashboardData?.institutions]);
  const dashboardEntranceExams = useMemo(
    () => buildDashboardEntranceExams(dashboardData?.entranceExams || dashboardData?.entranceexams || []),
    [dashboardData?.entranceExams, dashboardData?.entranceexams]
  );
  const dashboardModuleLookup = useMemo(() => {
    const modules = Array.isArray(dashboardData?.modules) ? dashboardData.modules : [];
    const getLookupKeys = (value = "") => {
      const normalized = normalizeModuleTitle(value);
      const keys = new Set([normalized]);

      if (normalized === "scholarship" || normalized === "scholarships") {
        keys.add("scholarship");
        keys.add("scholarships");
      }

      if (normalized === "institute" || normalized === "institutes") {
        keys.add("institute");
        keys.add("institutes");
      }

      if (normalized === "book your mentor" || normalized === "mentor" || normalized === "mentors") {
        keys.add("book your mentor");
        keys.add("mentor");
        keys.add("mentors");
      }

      if (normalized === "entrance exam" || normalized === "entrance exams" || normalized === "exam" || normalized === "exams") {
        keys.add("entrance exam");
        keys.add("entrance exams");
        keys.add("exam");
        keys.add("exams");
      }

      return [...keys];
    };

    return new Map(
      modules
        .filter((module) => module?.id || module?.title)
        .flatMap((module) => getLookupKeys(module.title || "").map((key) => [key, module]))
    );
  }, [dashboardData?.modules]);
  const dashboardPlans = useMemo(
  () => dashboardData?.plans || [],
  [dashboardData?.plans]
);
  const activePlanIdSet = useMemo(() => new Set((activePlanIds || []).map((id) => String(id))), [activePlanIds]);
  const pendingMentorReviews = useMemo(
    () => (dashboardData?.pendingMentorReviews || globalDashboardData?.pendingMentorReviews || []).filter((item) => {
      if (!item?.canReview || reviewedMentorBookings.includes(String(item.bookingId))) {
        return false;
      }

      const eligibleAt = item?.reviewEligibleAt ? parseDateForReview(item.reviewEligibleAt) : getReviewEligibleAt(item);
      if (!eligibleAt) {
        return false;
      }

      return eligibleAt.getTime() <= now;
    }),
    [dashboardData?.pendingMentorReviews, globalDashboardData?.pendingMentorReviews, reviewedMentorBookings, now]
  );

  const activeReview = pendingMentorReviews[0] || null;

  useEffect(() => {
    setProfileReminderOpen(Boolean(profileIncomplete));
  }, [profileIncomplete]);

  useEffect(() => {
    if (activeReview) {
      setReviewOpen(true);
      setReviewError("");
      setReviewRating(5);
      setReviewText("");
    } else {
      setReviewOpen(false);
    }
  }, [activeReview?.bookingId]);

  async function submitReview() {
    if (!activeReview) return;

    if (!reviewRating) {
      setReviewError("Please select a star rating.");
      return;
    }

    if (!reviewText.trim()) {
      setReviewError("Please write a short review.");
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewError("");
      await createMentorReview({
        bookingId: activeReview.bookingId,
        rating: reviewRating,
        review: reviewText.trim(),
      });
      setReviewedMentorBookings((current) => [...current, String(activeReview.bookingId)]);
      message.success("Mentor review submitted");
      setReviewOpen(false);
    } catch (reviewSubmitError) {
      setReviewError(
        reviewSubmitError?.response?.data?.message ||
          reviewSubmitError?.message ||
          "Failed to submit review."
      );
    } finally {
      setReviewSubmitting(false);
    }
  }
  if (showPersonality && !complete) {
    return (
      <PersonalityQuizQuestion
        personalityStep={personalityStep}
        answers={answers}
        setAnswers={setAnswers}
        setShowPersonality={setShowPersonality}
        setPersonalityStep={setPersonalityStep}
        setComplete={setComplete}
      />
    );
  }

  if (showPersonality && complete) {
    return (
      <PersonalityQuizResults
        personalityResult={personalityResult}
        setShowPersonality={setShowPersonality}
        navigate={navigate}
      />
    );
  }
  function handleTestClick() {
    navigate("/app/assessment");
  }

  async function handleProtectedSectionClick({ route, title, moduleTitle, itemLabel }) {
    const normalizedTitle = normalizeModuleTitle(moduleTitle || title || "");
    const lookupKeys = new Set([normalizedTitle]);

    if (normalizedTitle === "scholarship" || normalizedTitle === "scholarships") {
      lookupKeys.add("scholarship");
      lookupKeys.add("scholarships");
    }

    if (normalizedTitle === "institute" || normalizedTitle === "institutes") {
      lookupKeys.add("institute");
      lookupKeys.add("institutes");
    }

    if (normalizedTitle === "book your mentor" || normalizedTitle === "mentor" || normalizedTitle === "mentors") {
      lookupKeys.add("book your mentor");
      lookupKeys.add("mentor");
      lookupKeys.add("mentors");
    }

    if (normalizedTitle === "entrance exam" || normalizedTitle === "entrance exams" || normalizedTitle === "exam" || normalizedTitle === "exams") {
      lookupKeys.add("entrance exam");
      lookupKeys.add("entrance exams");
      lookupKeys.add("exam");
      lookupKeys.add("exams");
    }

    const resolvedModule = [...lookupKeys].map((key) => dashboardModuleLookup.get(key)).find(Boolean);
    const moduleId = resolvedModule?.id;

    if (!moduleId) {
      setLockedSection({
        title,
        itemLabel,
        route,
        message: "This section is currently unavailable. Please try again later.",
      });
      return;
    }

    try {
      const response = await checkModuleAccess(moduleId);

      if (!response?.allowed) {
        setLockedSection({
          title,
          itemLabel,
          route,
          message:
            response?.message ||
            "Free preview already used. Please purchase a subscription to continue accessing this section.",
        });
        return;
      }

      navigate(route, {
        state: {
          accessStatus: response.mode,
          moduleId,
        },
      });
    } catch (error) {
      setLockedSection({
        title,
        itemLabel,
        route,
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to verify access right now. Please try again.",
      });
    }
  }

  function handleCompleteProfile() {
    requestProfileEdit();
    setProfileReminderOpen(false);
    navigate("/app/profile", {
      state: {
        returnTo: "/app/dashboard",
        profileCompletionPrompt: true,
      },
    });
  }

  return (
    <div className="motion-stack space-y-6">
    

      <DashboardHeroSection onTestClick={handleTestClick} userName={dashboardUserName} />
      <ExploreModulesSection modules={dashboardData?.modules || []} />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="display-font text-2xl font-bold text-ink">Explore Your Mentors</div>
  <button
    type="button"
    className="text-sm font-bold text-brand"
    onClick={() =>
      handleProtectedSectionClick({
        route: "/app/book-mentor",
        title: "Mentors",
        moduleTitle: "Book Your Mentor",
      })
    }
  >
            See all
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardMentors.map((mentor) => (
         <button
  key={mentor.id || mentor.name}
  type="button"
  className="rounded-[22px] border border-[#eaded9] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  onClick={() =>
    handleProtectedSectionClick({
      route: "/app/book-mentor",
      title: "Mentors",
      moduleTitle: "Book Your Mentor",
      itemLabel: mentor.name,
    })
  }
>
  {/* Row Layout */}
  <div className="flex items-start gap-4">
    
    {/* Avatar */}
    <div
      className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[18px]"
      style={{ backgroundColor: `${mentor.accent}15` }}
    >
      {mentor.image ? (
        <Avatar
          src={mentor.image}
          size={52}
          shape="square"
          className="!flex !items-center !justify-center !bg-transparent"
          style={{ borderRadius: 18 }}
        />
      ) : (
        <span
          className="text-[18px] font-black"
          style={{ color: mentor.accent }}
        >
          {mentor.avatar}
        </span>
      )}
    </div>

    {/* Right Side Content */}
    <div className="flex-1">
      {/* Name */}
      <div className="text-[15px] font-black text-ink">
        {mentor.name}
      </div>

      {/* Specialty */}
      <div className="mt-1 text-[12px] font-bold text-brand">
        {mentor.specialty}
      </div>
      
    </div>
    
  </div>
  <div className="mt-2 pt-2 ">
        <Rate
          disabled
          allowHalf
          value={Number(mentor.rating)}
          style={{ fontSize: 12 }}
        />
         
        <span className="ml-1 text-[11px] text-muted">
        {mentor.rating} ({mentor.totalReviews}) • 🎓 {mentor.experience}
       
        </span>
      </div>
</button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="display-font text-2xl font-bold text-ink">Explore Scholarships</div>
          <button
            type="button"
            className="text-sm font-bold text-brand"
            onClick={() =>
              handleProtectedSectionClick({
                route: "/app/scholarships",
                title: "Scholarships",
                moduleTitle: "Scholarships",
              })
            }
          >
            See all
          </button>
        </div>
        <div className="space-y-3">
          {dashboardScholarships.map((item) => (
            <button
              key={item.id || item.name}
              type="button"
              className="flex w-full items-center gap-4 rounded-[22px] border border-[#eaded9] bg-white p-4 text-left shadow-sm transition hover:shadow-md"
              onClick={() =>
                handleProtectedSectionClick({
                  route: "/app/scholarships",
                  title: "Scholarships",
                  moduleTitle: "Scholarships",
                  itemLabel: item.name,
                })
              }
            >
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[14px] bg-[#edf9f1]">
                <TrophyOutlined style={{ color: palette.green, fontSize: 20 }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-extrabold text-ink">{item.name}</div>
                <div className="text-[12px] font-bold text-[#2f9367]">{item.amount}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold uppercase tracking-wide text-brand">{item.tag}</div>
                <div className="text-[11px] text-muted">{item.deadline}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="display-font text-2xl font-bold text-ink">Explore Institutes</div>
          <button
            type="button"
            className="text-sm font-bold text-brand"
            onClick={() =>
              handleProtectedSectionClick({
                route: "/app/institutes",
                title: "Institutes",
                moduleTitle: "Institutes",
              })
            }
          >
            See all
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardInstitutes.map((item) => (
            <button
              key={item.id || item.name}
              type="button"
              className="rounded-[22px] border border-[#eaded9] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              onClick={() =>
                handleProtectedSectionClick({
                  route: "/app/institutes",
                  title: "Institutes",
                  moduleTitle: "Institutes",
                  itemLabel: item.name,
                })
              }
            >
              <div className="mb-4 flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[18px] bg-[#edf3ff]">
                {item.logo ? (
                  <img
                    src={item.logo}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <BankOutlined style={{ color: palette.blue, fontSize: 22 }} />
                )}
              </div>
              <div className="min-h-[52px] text-[15px] font-black text-ink">{item.name}</div>
              <div className="mt-1 text-[12px] font-bold text-brand">{item.location}</div>
              <div className="mt-2 text-[12px] text-muted">{item.type}</div>
             
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="display-font text-2xl font-bold text-ink">Explore Entrance Exams</div>
          <button
            type="button"
            className="text-sm font-bold text-brand"
            onClick={() =>
              handleProtectedSectionClick({
                route: "/app/entrance-exam",
                title: "Entrance Exams",
                moduleTitle: "Entrance Exam",
              })
            }
          >
            See all
          </button>
        </div>
        {dashboardEntranceExams.length > 0 ? (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  {dashboardEntranceExams.map((item) => (
    <button
      key={item.id || item.name}
      type="button"
      className="group relative flex flex-col overflow-hidden rounded-[20px] bg-white p-5 text-left ring-1 ring-[#eaded9] transition-all duration-200 hover:-translate-y-1 hover:ring-2 hover:ring-brand/40 hover:shadow-lg hover:shadow-[#9a2119]/10"
      onClick={() =>
        handleProtectedSectionClick({
          route: "/app/entrance-exam",
          title: "Entrance Exams",
          moduleTitle: "Entrance Exam",
          itemLabel: item.name,
        })
      }
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-[#fdf0ee] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf8f6] transition-colors group-hover:bg-[#dff2ee]">
          <CreditCardOutlined style={{ color: palette.secondary, fontSize: 20 }} />
        </div>
        <ArrowRightOutlined className="mt-1 text-[13px] text-[#c7aaa3] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
      </div>

      <div className="text-[15px] font-black leading-snug text-ink line-clamp-2">
        {item.name}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        {item.authority ? (
          <span className="inline-flex w-fit items-center rounded-full bg-[#fdf0ee] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand">
            {item.authority}
          </span>
        ) : (
          <span className="text-[12px] font-medium text-muted">Entrance Exam</span>
        )}
      </div>
    </button>
  ))}
</div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-[#eaded9] bg-white p-5 text-sm text-muted">
            No entrance exams available right now.
          </div>
        )}
      </section>

  <section>
  {/* Header */}
  <div className="mb-6 flex items-center justify-between">
    <h2 className="display-font text-2xl font-extrabold tracking-tight text-ink">
      Explore Plans
    </h2>

    <button
      type="button"
      className="text-sm font-semibold text-brand hover:underline"
      onClick={() => navigate("/app/subscription")}
    >
      See all →
    </button>
  </div>

  {/* Cards */}
  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
    {dashboardPlans.map((plan) => {
      const isCurrentPlan = activePlanIdSet.has(String(plan.id));
      // Determine ribbon color based on type
      const isBestSeller = plan.plan_type?.toUpperCase() === "BEST SELLER";
      const isRecommended = plan.plan_type?.toUpperCase() === "RECOMMENDED";
      
      const ribbonBgColor = isBestSeller 
        ? "bg-[#d4af37] text-white"   // Golden ribbon
        : isRecommended 
          ? "bg-[#991b1b] text-white " // Crimson/Red ribbon
          : "bg-brand text-white";

      return (
        <button
          key={plan.id}
          type="button"
          onClick={() => {
            if (!isCurrentPlan) {
              navigate("/app/subscription");
            }
          }}
          disabled={isCurrentPlan}
          className={`group relative rounded-2xl border border-[#eee] bg-white p-5 text-left shadow-sm transition-all duration-300 overflow-hidden ${
            isCurrentPlan ? "cursor-not-allowed opacity-75" : "hover:-translate-y-1 hover:shadow-xl"
          }`}
        >
          {/* Top Glow Effect */}
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-brand opacity-80"></div>

          {/* Corner Ribbon Tag */}
          {plan.plan_type && (
            <div className="absolute top-0 right-0 h-16 w-16 overflow-hidden pointer-events-none">
              <div className={`absolute transform rotate-45 text-center font-bold text-[6px] tracking-wider py-1 uppercase left-[-18px] top-[18px] w-[110px] shadow-sm ${ribbonBgColor}`}>
                {plan.plan_type}
              </div>
            </div>
          )}

          {/* Name */}
          <h3 className="text-[17px] font-bold text-ink leading-snug">
            {plan.name}
          </h3>

          {/* Price */}
          <div className="mt-3 flex items-end gap-1">
            <span className="text-2xl font-extrabold text-brand">
              ₹{plan.price}
            </span>
            <span className="text-xs text-muted mb-1">/plan</span>
          </div>

          {/* Divider */}
          <div className="my-3 h-[1px] w-full bg-gray-100"></div>

          {/* Validity */}
          <p className="text-[12px] text-muted">
            Valid for{" "}
            <span className="font-semibold text-ink">
              {plan.validity} days
            </span>
          </p>

          {/* CTA */}
          <div className="mt-4 flex items-center justify-between text-sm font-semibold text-brand">
            <span className={isCurrentPlan ? "text-green-400" : "group-hover:underline"}>
              {isCurrentPlan ? "Current Plan" : "View Details"}
            </span>
            <RightOutlined className={isCurrentPlan ? "text-gray-300" : "transition-transform group-hover:translate-x-1"} />
          </div>
        </button>
      );
    })}
  </div>
      </section>

      <Modal
        open={profileReminderOpen}
        centered
        footer={null}
        closable
        onCancel={() => setProfileReminderOpen(false)}
        width={440}
        className="[&_.ant-modal-content]:!rounded-[24px] [&_.ant-modal-content]:!p-6"
      >
        <div className="space-y-4">
          <div>
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a2119]">
              Profile Incomplete
            </p>
            <h3 className="m-0 mt-2 text-[22px] font-black text-[#1a0a09]">
              Complete your profile
            </h3>
            <p className="m-0 mt-2 text-sm leading-7 text-[#6f6663]">
             Login successful. A few profile details are still missing.
Please complete your profile to continue.
 </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="primary"
              block
              className="!h-11 !rounded-xl !border-[#9a2119] !bg-[#9a2119] !font-semibold"
              onClick={handleCompleteProfile}
            >
              Complete Profile
            </Button>
            <Button
              block
              className="!h-11 !rounded-xl !font-semibold"
              onClick={() => setProfileReminderOpen(false)}
            >
              Later
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
  open={reviewOpen}
  centered
  footer={null}
  closable={false}
  maskClosable={false}
  keyboard={false}
  width={360}
  className="[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!p-5"
>
  <div className="space-y-4">

    {/* Heading */}
    <div className="text-center">
      <div className="text-lg font-semibold text-[#1a0a09]">
        How was your session?
      </div>
      <div className="text-xs text-[#8f7d79] mt-1">
        with {activeReview?.mentorName || "your mentor"}
      </div>
    </div>

    {/* Rating */}
    <div className="flex justify-center">
      <Rate value={reviewRating} onChange={setReviewRating} />
    </div>

    {/* Review Input */}
    <Input.TextArea
      value={reviewText}
      onChange={(e) => setReviewText(e.target.value)}
      rows={3}
      maxLength={200}
      placeholder="Write your review..."
      className="!rounded-lg !text-sm"
    />

    {/* Error */}
    {reviewError && (
      <div className="text-xs text-red-600 text-center font-medium">
        {reviewError}
      </div>
    )}

    {/* Submit Button */}
    <Button
      block
      type="primary"
      loading={reviewSubmitting}
      onClick={submitReview}
      disabled={!reviewRating} // 👈 prevents empty rating
      className="!h-10 !rounded-lg !bg-[#9a2119] !border-none !font-semibold"
    >
      Submit Review
    </Button>

  </div>
</Modal>

      <Modal
        open={Boolean(lockedSection)}
        centered
        footer={null}
        closable
        onCancel={() => setLockedSection(null)}
        width={440}
        className="[&_.ant-modal-content]:!rounded-[24px] [&_.ant-modal-content]:!p-6"
      >
        <div className="space-y-4">
          <div>
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a2119]">
              {lockedSection?.title || "Module Locked"}
            </p>
            <h3 className="m-0 mt-2 text-[22px] font-black text-[#1a0a09]">
              Unlock access to continue
            </h3>
            <p className="m-0 mt-2 text-sm leading-7 text-[#6f6663]">
              {lockedSection?.message}
              {lockedSection?.itemLabel ? ` ${lockedSection.itemLabel}` : ""}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="primary"
              block
              className="!h-11 !rounded-xl !border-[#9a2119] !bg-[#9a2119] !font-semibold"
              onClick={() => {
                const returnTo = lockedSection?.route || "/app/dashboard";
                setLockedSection(null);
                navigate(`/app/subscription?returnTo=${encodeURIComponent(returnTo)}`);
              }}
            >
              Unlock Now
            </Button>
            <Button
              block
              className="!h-11 !rounded-xl !font-semibold"
              onClick={() => setLockedSection(null)}
            >
              Later
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
