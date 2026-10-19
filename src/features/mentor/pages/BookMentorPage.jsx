import { useEffect, useMemo, useState } from "react";
import { ArrowRightOutlined, TrophyOutlined ,StarOutlined, StarFilled,LockOutlined,UnlockOutlined,FileTextOutlined} from "@ant-design/icons";
import { Modal,Rate,Button ,Select} from "antd";
import { useSearchParams, useLocation } from "react-router-dom";
import {
  createMentorOrder,
  getBookedMentorSlots,
  getMentorById,
  getMentors,
  verifyMentorPayment,
} from "../../../api/mentorApi";
import { mentors as fallbackMentors } from "../../../data/careermapData";
import { ModuleScreen, PageHero } from "../../../components/ui";
import { useAppState } from "../../../state/AppStateContext";
import { UnlockRedirectModal, usePortalNavigation } from "../../portal/components/portalPageShared";
import { loadRazorpayScript } from "../../../utils/razorpay.js";

function formatNumericDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return {
    key: parsed.toISOString().split("T")[0],
    day: parsed.toLocaleDateString("en-IN", { weekday: "short" }),
    date: String(parsed.getDate()),
    month: parsed.toLocaleDateString("en-IN", { month: "short" }),
    displayDate: parsed.toLocaleDateString("en-GB"),
  };
}

function normalizeSlotKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s*(am|pm)$/i, "");
}

function parseSlotEndDateTime(dateKey, timeSlot) {
  if (!dateKey || !timeSlot) {
    return null;
  }

  const date = new Date(dateKey);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const rawValue = String(timeSlot).trim();
  if (!rawValue) {
    return null;
  }

  const endPart = rawValue.split("-").pop()?.trim() || rawValue;
  const match = endPart.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase() || "";

  if (period === "PM" && hours < 12) {
    hours += 12;
  }
  if (period === "AM" && hours === 12) {
    hours = 0;
  }

  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);
  return slotDateTime;
}

function getSlotEndTimeValue(timeSlot) {
  if (!timeSlot) {
    return "";
  }

  const rawValue = String(timeSlot).trim();
  if (!rawValue) {
    return "";
  }

  return rawValue.split("-").pop()?.trim() || rawValue;
}

function buildFallbackAvailability() {
  const output = [];
  for (let index = 0; index < 6; index += 1) {
    const current = new Date();
    current.setDate(current.getDate() + index);
    const info = formatNumericDate(current);
    output.push({
      key: info.key,
      day: info.day,
      date: info.date,
      month: info.month,
      slots:
        index % 4 === 1
          ? []
          : ["9:00 AM", "10:00 AM", "11:30 AM", "2:00 PM", "3:30 PM", "5:00 PM", "6:30 PM"].slice(0, 3 + (index % 3)),
    });
  }
  return output;
}

function normalizeAvailability(availability) {
  if (Array.isArray(availability) && availability.length) {
    return availability
      .map((item) => {
        const info = formatNumericDate(item?.rawDate || item?.date);
        if (!info && !item?.key) {
          return null;
        }
        return {
          key: item?.key || info?.key || String(item?.date || ""),
          day: item?.day || info?.day || "Day",
          date: item?.date || info?.date || "",
          month: item?.month || info?.month || "",
          displayDate: item?.displayDate || info?.displayDate || item?.date || "",
          slots: Array.isArray(item?.slots) ? item.slots.filter(Boolean) : [],
        };
      })
      .filter(Boolean);
  }
  return buildFallbackAvailability();
}

function Avatar({ name, accent, avatar, image }) {
  return (
    <div
      className="flex h-16 w-16 items-center justify-center rounded-[22px] shadow-sm"
      style={{ backgroundColor: `${accent}18` }}
    >
      {image ? (
        <img src={image} alt={name} className="h-full w-full rounded-[22px] object-cover" loading="lazy" />
      ) : (
        <span className="text-[22px] font-black" style={{ color: accent }}>
          {avatar || String(name || "M").slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-[24px] border border-[#f0e4e2] bg-white p-5 shadow-sm">
      <h3 className="m-0 text-[18px] font-black text-[#1a0a09]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function MentorCard({ mentor, isFree, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-[26px] border border-[#f0e4e2] bg-white p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#9a2119] hover:shadow-lg hover:shadow-[#9a2119]/10"
    >
      <div className="absolute left-0 right-0 top-0 h-[3px] bg-[#f0e4e2] transition-colors group-hover:bg-[#9a2119]" />

      <div className="mb-4 flex items-start justify-between gap-3 pt-2">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[18px]"
            style={{ backgroundColor: `${mentor.accent}18` }}
          >
            {mentor.image ? (
              <img src={mentor.image} alt={mentor.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <span className="text-[20px] font-black" style={{ color: mentor.accent }}>
                {mentor.avatar}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-black text-[#1a0a09]">{mentor.name}</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-[#b8837e]">
              {mentor.specialty}
            </div>
          </div>
        </div>
        {!isFree ? (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500"><LockOutlined /></span>
        ) : (
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700"><UnlockOutlined /></span>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2">
       
        <span className="rounded-full bg-[#fff6ef] px-2.5 py-1 text-[11px] font-semibold text-[#9a2119]">
          {mentor.price}
        </span>
                  <StarFilled style={{ color: "#d4a017" }} />
  <span className="text-sm font-semibold text-[#1a0a09]">
    {Number(mentor.rating).toFixed(1)}
  </span>
      </div>

      <div className="border-t border-[#f0e4e2] pt-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide max-w-[70%]">
            {(mentor.tags || []).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full bg-[#fff0ee] px-3 py-1 text-[11px] font-semibold text-[#c13124]"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="text-sm font-bold text-[#9a2119] whitespace-nowrap">
            Explore <ArrowRightOutlined />
          </span>
        </div>
      </div>
    </button>
  );
}

// Shared chevron SVG for all selects
function ChevronDown() {
  return (
    <svg
      className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#b8837e]"
      viewBox="0 0 12 12"
      fill="none"
    >
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BookMentorPage() {
  const { canAccessFreeDetail, isUnlocked, registerFreeDetailAccess, addBooking } = useAppState();
  const { navigate, location, goToDashboard } = usePortalNavigation();
  const pageLocation = useLocation();
  const [params] = useSearchParams();

  const accessStatus = pageLocation.state?.accessStatus || "preview";
  const isModuleUnlocked =
  accessStatus === "full" ||
  accessStatus === "unlocked";
  const frontendUnlocked = isUnlocked("book-mentor");
  const unlocked = isModuleUnlocked || frontendUnlocked;

  const [mentorList, setMentorList] = useState(fallbackMentors);
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [bookedSlotsLoading, setBookedSlotsLoading] = useState(false);
  const [bookedSlotsError, setBookedSlotsError] = useState("");
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [unlockModalItem, setUnlockModalItem] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [booked, setBooked] = useState(false);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [category, setCategory] = useState("");
 
  // ── Category dropdown options ────────────────────────────────────────────
  // category.title | secondcategory.name | subcategory.title
  const categoryOptions = useMemo(
    () => [
      ...new Map(
        mentorList
          .filter((m) => m.categoryObj)
          .map((m) => [m.categoryObj.id, m.categoryObj])
      ).values(),
    ],
    [mentorList]
  );


 function handleCategoryChange(value) {
  setCategory(value || "");
}


  // ── Filtered list ────────────────────────────────────────────────────────
 const filteredMentorList = useMemo(
  () =>
    mentorList
      .filter((mentor) => {
        return (
          !category ||
          String(mentor.categoryObj?.id) === String(category)
        );
      })
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }

        return Number(b.id) - Number(a.id);
      }),

  [mentorList, category]
);

  // ── Active mentor ────────────────────────────────────────────────────────
  const activeMentor = useMemo(() => {
    if (!selectedMentorId) return null;
    return (
      selectedMentor ||
      mentorList.find(
        (item) =>
          String(item.id) === String(selectedMentorId) || item.name === selectedMentorId
      ) ||
      null
    );
  }, [mentorList, selectedMentor, selectedMentorId]);

  const dates = useMemo(() => normalizeAvailability(activeMentor?.availability), [activeMentor]);

  const selectedDateInfo = useMemo(
    () => dates.find((item) => item.key === selectedDate) || dates[0] || null,
    [dates, selectedDate]
  );

  const slots = useMemo(() => {
    if (!dates.length) return [];
    const activeDate = dates.find((item) => item.key === selectedDate) || dates[0];
    const allSlots = activeDate?.slots || [];
    const now = new Date();

    if (!activeDate?.key) {
      return allSlots;
    }

    return allSlots.filter((slot) => {
      const slotDateTime = parseSlotEndDateTime(activeDate.key, slot);
      if (!slotDateTime) {
        return true;
      }

      if (slotDateTime.getTime() <= now.getTime()) {
        return false;
      }

      return true;
    });
  }, [dates, selectedDate]);

  const bookedSlotKeys = useMemo(
    () => new Set((bookedSlots || []).map((slot) => normalizeSlotKey(slot)).filter(Boolean)),
    [bookedSlots]
  );

  const availableSlots = useMemo(() => slots.filter(Boolean), [slots]);

  function buildMentorReturnTo(mentorRef = activeMentor) {
    const mentorName = typeof mentorRef === "string" ? mentorRef : mentorRef?.name;
    const mentorId = typeof mentorRef === "object" ? mentorRef?.id : "";
    const nextParams = new URLSearchParams();
    if (mentorId) nextParams.set("mentorId", mentorId);
    if (mentorName) nextParams.set("mentor", mentorName);
    if (selectedDate) nextParams.set("date", selectedDate);
    if (selectedSlot) nextParams.set("time", selectedSlot);
    const query = nextParams.toString();
    return query ? `${location.pathname}?${query}` : location.pathname;
  }

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    async function loadMentors() {
      try {
        setLoadError("");
        const items = await getMentors();
        if (active) {
          setMentorList(items.length ? items : fallbackMentors);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error?.response?.data?.message || error?.message || "Failed to load mentor list."
          );
          setMentorList(fallbackMentors);
        }
      }
    }
    loadMentors();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const mentorParam =
      params.get("mentorId") ||
      params.get("mentor") ||
      pageLocation.state?.searchItem?.id ||
      pageLocation.state?.searchItem?.title;

    if (!mentorParam) return;
    let active = true;

    async function resolveMentor() {
      const numericId = /^\d+$/.test(String(mentorParam));
      if (numericId) {
        try {
          const mentor = await getMentorById(mentorParam);
          if (active && mentor) {
            setSelectedMentor(mentor);
            setSelectedMentorId(String(mentor.id));
            setShowBookingPanel(true);
            return;
          }
        } catch {
          // fall through to list lookup
        }
      }
      const mentor = mentorList.find(
        (item) =>
          String(item.id) === String(mentorParam) ||
          item.name?.toLowerCase() === String(mentorParam).toLowerCase()
      );
      if (active && mentor) {
        setSelectedMentor(mentor);
        setSelectedMentorId(String(mentor.id || mentor.name));
        setShowBookingPanel(true);
      }
    }
    resolveMentor();
    return () => { active = false; };
  }, [mentorList, params, pageLocation.state]);

  useEffect(() => {
    if (!activeMentor) {
      setSelectedDate("");
      setSelectedSlot("");
      setBookedSlots([]);
      setBookedSlotsError("");
      return;
    }
    if (!selectedDate && dates[0]) {
      setSelectedDate(dates[0].key);
    }
    if (selectedDate && !dates.some((item) => item.key === selectedDate)) {
      setSelectedDate(dates[0]?.key || "");
      setSelectedSlot("");
    }
  }, [activeMentor, dates, selectedDate]);

  useEffect(() => {
    let active = true;
    async function loadBookedSlots() {
      if (!activeMentor?.id || !selectedDate) {
        setBookedSlots([]);
        setBookedSlotsError("");
        return;
      }
      try {
        setBookedSlotsLoading(true);
        setBookedSlotsError("");
        const items = await getBookedMentorSlots(activeMentor.id, selectedDate);
        if (active) setBookedSlots(items);
      } catch (error) {
        if (active) {
          setBookedSlots([]);
          setBookedSlotsError(
            error?.response?.data?.message || error?.message || "Failed to load booked slots."
          );
        }
      } finally {
        if (active) setBookedSlotsLoading(false);
      }
    }
    loadBookedSlots();
    return () => { active = false; };
  }, [activeMentor?.id, selectedDate]);

  useEffect(() => {
    if (!selectedSlot) return;
    if (bookedSlotKeys.has(normalizeSlotKey(selectedSlot))) {
      setSelectedSlot("");
    }
  }, [bookedSlotKeys, selectedSlot]);

  useEffect(() => {
    if (!activeMentor) {
      setShowBookingPanel(false);
    }
  }, [activeMentor]);

  useEffect(() => {
    if (!processing || !activeMentor) return undefined;
    const timer = setTimeout(() => {
      const slotEndTime = getSlotEndTimeValue(selectedSlot);
      addBooking({
        id: `booking-${activeMentor.name}-${selectedDate}-${selectedSlot}`,
        mentorName: activeMentor.name,
        date: selectedDate,
        time: selectedSlot,
        timeSlot: selectedSlot,
        slotEndTime,
        reviewEligibleAt: `${selectedDate} ${slotEndTime}`.trim(),
        status: "Confirmed",
      });
      setProcessing(false);
      setBooked(true);
    }, 1600);
    return () => clearTimeout(timer);
  }, [activeMentor, addBooking, processing, selectedDate, selectedSlot]);

  // ── Payment ──────────────────────────────────────────────────────────────
  const handlePayment = async () => {
    try {
      console.log("PAYMENT CLICKED");
      const loaded = await loadRazorpayScript();
      console.log("SDK LOADED =", loaded);
      if (!loaded) {
        alert("SDK FAILED");
        return;
      }
      const orderResponse = await createMentorOrder({
        mentorId: activeMentor.id,
        date: selectedDate,
        timeSlot: selectedSlot,
      });
      console.log("ORDER RESPONSE", orderResponse);
      const { order, key } = orderResponse;
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: "CareerMap",
        description: "Mentor Booking",
        handler: async function (response) {
          await verifyMentorPayment({
            mentorId: activeMentor.id,
            date: selectedDate,
            timeSlot: selectedSlot,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setBooked(true);
        },
        theme: { color: "#9a2119" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.log("FULL ERROR", err);
      alert(err?.response?.data?.message || err.message);
    }
  };

  const detailUnlocked = activeMentor
    ? canAccessFreeDetail("book-mentor", activeMentor.name)
    : true;

  // ── Processing screen ────────────────────────────────────────────────────
  if (processing && activeMentor) {
    return (
      <ModuleScreen className="space-y-6">
        <div className="motion-item flex items-start justify-between gap-4">
          <div>
            <h1 className="m-0 text-2xl font-black leading-tight text-[#1a0a09]">Book Your Mentor</h1>
            <p className="mt-1 mb-0 text-xs text-[#b8837e]">Confirming your mentor booking.</p>
          </div>
          <PageHero backOnly onBack={() => setProcessing(false)} className="shrink-0" />
        </div>
        <div className="flex min-h-[320px] items-center justify-center px-2">
          <div className="w-full max-w-[560px] rounded-[28px] border border-[#f0e4e2] bg-white px-6 py-7 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#f1d9d3] border-t-[#9a2119] animate-spin" />
            <div className="mt-5 inline-flex rounded-full bg-[#fdf0ee] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#9a2119]">
              Processing
            </div>
            <div className="mt-4 text-[22px] font-black text-[#1a0a09]">Processing Payment</div>
            <div className="mx-auto mt-2 max-w-md text-[14px] leading-7 text-[#6f6663]">
              Please wait while we confirm your mentor booking.
            </div>
            <div className="mx-auto mt-6 h-2 w-full max-w-[280px] overflow-hidden rounded-full bg-[#f3ece8]">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#c72733] to-[#51154c] animate-pulse" />
            </div>
          </div>
        </div>
      </ModuleScreen>
    );
  }

  // ── Booked success screen ────────────────────────────────────────────────
  if (booked && activeMentor) {
    return (
      <ModuleScreen className="space-y-6">
        <div className="rounded-[28px] border border-[#f0e4e2] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-green-50 text-3xl text-green-600">
            ✓
          </div>
          <h2 className="mt-4 text-2xl font-black text-[#1a0a09]">Session booked successfully</h2>
          <p className="mt-2 text-sm leading-7 text-[#6f6663]">
            Payment successful. Your session with{" "}
            <strong className="text-[#1a0a09]">{activeMentor.name}</strong> is confirmed for{" "}
            {selectedDateInfo?.displayDate || selectedDate} at {selectedSlot}.
          </p>
          <div className="mx-auto mt-5 max-w-md rounded-[22px] border border-[#f0e4e2] bg-[#fffaf8] p-4 text-left">
            <div className="text-sm text-[#6f6663]">Mentor: {activeMentor.name}</div>
            <div className="mt-1 text-sm text-[#6f6663]">
              Date: {selectedDateInfo?.displayDate || selectedDate}
            </div>
            <div className="mt-1 text-sm text-[#6f6663]">Time: {selectedSlot}</div>
            <div className="mt-1 text-sm text-[#6f6663]">Price: {activeMentor.price}</div>
          </div>
          <button
            type="button"
            className="mt-6 rounded-[16px] bg-[#9a2119] px-6 py-3 text-sm font-extrabold text-white"
            onClick={() => {
              setBooked(false);
              setSelectedMentorId("");
              setSelectedMentor(null);
              setSelectedDate("");
              setSelectedSlot("");
              setPaymentOpen(false);
            }}
          >
            Back to Mentor List
          </button>
        </div>
      </ModuleScreen>
    );
  }

  // ── Mentor detail / booking view ─────────────────────────────────────────
  if (activeMentor) {
    return (
      <ModuleScreen className="space-y-6 pb-24">
        <div className="motion-item flex items-start justify-between gap-4">
          <div>
            <h1 className="m-0 text-2xl font-black leading-tight text-[#1a0a09]">Book Your Mentor</h1>
            <p className="mt-1 mb-0 text-xs text-[#b8837e]">
              Profile, schedule selection, and booking flow.
            </p>
          </div>
          <PageHero backOnly onBack={() => setSelectedMentorId("")} className="shrink-0" />
        </div>

        {!isModuleUnlocked && !unlocked ? (
          <div className="inline-flex self-start rounded-full bg-green-50 px-3 py-2 text-[12px] font-extrabold text-green-700">
            {detailUnlocked
              ? "1 free mentor detail unlocked"
              : "Subscribe to unlock more mentor profiles"}
          </div>
        ) : null}

   {/* Profile card */}
      <div className="relative overflow-hidden rounded-[32px] border border-[#f0e4e2] bg-white p-6 shadow-sm sm:p-8">
  <button
    type="button"
    onClick={() => setShowBookingPanel((current) => !current)}
    className="absolute right-4 top-4 z-[2] rounded-full bg-[#9a2119] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white shadow-lg shadow-[#9a2119]/20 transition hover:bg-[#7f1711]"
  >
    {showBookingPanel ? "Close booking" : "Book now"}
  </button>
  {/* Decorative background blobs */}
  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-[40%] bg-[#f3d4c8]" />
  <div className="pointer-events-none absolute bottom-8 right-10 h-8 w-8 rounded-full bg-[#f3d4c8]/70" />
  <div className="pointer-events-none absolute bottom-4 right-40 h-16 w-16 rounded-full border border-[#f3d4c8]" />
<div className="pointer-events-none absolute -t-8 right-60 h-8 w-8 rounded-full bg-[#f3d4c8]/70" />

  
  <div className="relative z-[1] flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
    {/* LEFT: Circular photo, overlapping card edge */}
    <div className="relative flex-shrink-0">
      <div className="h-44 w-44 overflow-hidden rounded-full border-4 border-white shadow-lg ring-1 ring-[#e8b8a4] sm:h-56 sm:w-56">
        {activeMentor.image ? (
          <img
            src={activeMentor.image}
            alt={activeMentor.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-[42px] font-black sm:text-[52px]"
            style={{ backgroundColor: `${activeMentor.accent}18`, color: activeMentor.accent }}
          >
            {activeMentor.avatar || String(activeMentor.name || "M").slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    </div>

    {/* Vertical divider, desktop only */}
    <div className="hidden h-52 w-px bg-[#f0e4e2] sm:block" />

    {/* RIGHT: Details */}
    <div className="flex flex-1 flex-col items-center gap-3 text-center sm:items-start sm:pl-2 sm:text-left">
      <div className="rounded-full bg-[#9a2119] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white">
        Mentor Profile
      </div>

      <h2 className="m-0 text-[28px] font-black leading-tight text-[#241008] sm:text-[38px]">
        {activeMentor.name}
      </h2>

      <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#9a2119] sm:text-[13px]">
        {activeMentor.specialty}
      </div>

      <div className="flex flex-wrap items-stretch justify-center gap-2.5 pt-2 text-sm sm:justify-start sm:gap-3">
      

        <span className="inline-flex items-center gap-2 rounded-2xl border border-[#f0e4e2] bg-white px-4 py-2.5 font-bold text-[#241008]">
          <StarFilled style={{ color: "#d4a017" }} />
          {Number(activeMentor.rating).toFixed(1)}
        </span>
        {activeMentor.resume ? (
  <Button
    href={activeMentor.resume}
    target="_blank"
    rel="noopener noreferrer"
    icon={<FileTextOutlined />}
    className="!inline-flex !items-center !gap-2 !rounded-2xl !border !border-[#f0e4e2] !bg-white !px-4 !py-2 !h-auto !font-bold !text-[#9a2119] hover:!bg-[#fdf0ee] hover:!border-[#9a2119]"
  >
    Expert Profile
  </Button>
) : null}

        <span className="inline-flex items-center gap-2.5 rounded-2xl bg-[#fdf0e4] px-4 py-2 font-bold text-[#241008]">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#9a2119] text-white">
            ₹
          </span>
          <span className="whitespace-nowrap text-[15px]">
            {String(activeMentor.price || "").replace(/^rs\.?\s*/i, "")}
          </span>
        </span>
          


       {(activeMentor.tags || []).map((tag) => (
  <span
    key={tag}
    className="inline-flex items-center justify-center rounded-full bg-[#9a2119] px-4 py-1.5 text-center text-[12px] font-bold text-white"
  >
    {tag}
  </span>
))}
      </div>
    </div>
  </div>

  <Modal
    open={showBookingPanel}
    centered
    onCancel={() => setShowBookingPanel(false)}
    footer={null}
    width={760}
    className="[&_.ant-modal-content]:!rounded-[28px] [&_.ant-modal-content]:!overflow-hidden"
  >
    <div className="bg-[#fffaf8] p-1 sm:p-2">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#f0e4e2] bg-white p-5">
        <div>
          <div className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#9a2119]">Booking</div>
          <h3 className="mt-1 text-[20px] font-black text-[#1a0a09]">Select date and time</h3>
        </div>
        <div className="rounded-full bg-[#fffaf8] px-3 py-1.5 text-[12px] font-bold text-[#6f6663] shadow-sm">
          {selectedDateInfo?.displayDate || "Choose a date"}
          {selectedSlot ? ` • ${selectedSlot}` : ""}
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-[#f0e4e2] bg-white p-5">
        <div className="text-[13px] font-bold text-[#1a0a09]">Select Date</div>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {dates.map((date) => {
            const isActive = selectedDate === date.key;
            const hasSlots = (date.slots || []).length > 0;
            return (
              <button
                key={date.key}
                type="button"
                disabled={!hasSlots}
                onClick={() => {
                  setSelectedDate(date.key);
                  setSelectedSlot("");
                }}
                className="w-[88px] rounded-[16px] px-2 py-3 text-center transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-35"
                style={{
                  backgroundColor: isActive ? "#9a2119" : "#f2ebe6",
                  color: isActive ? "#fff" : "#1a0a09",
                }}
              >
                <div className="text-[10px] font-bold">{date.day}</div>
                <div className="text-[12px] font-black leading-tight">{date.displayDate}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-[#f0e4e2] bg-white p-5">
        <div className="text-[13px] font-bold text-[#1a0a09]">Select Time</div>
        {selectedDate ? (
          <div className="mt-3 flex flex-wrap gap-2.5">
            {availableSlots.length ? (
              availableSlots.map((slot) => {
                const isBooked = bookedSlotKeys.has(normalizeSlotKey(slot));
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setSelectedSlot(slot)}
                    className="rounded-[12px] px-3.5 py-2.5 text-[12px] font-extrabold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      backgroundColor: isBooked
                        ? "#efe7e4"
                        : selectedSlot === slot
                        ? "#9a2119"
                        : "#f2ebe6",
                      color: isBooked
                        ? "#a28f89"
                        : selectedSlot === slot
                        ? "#fff"
                        : "#1a0a09",
                    }}
                  >
                    {slot}
                    {isBooked ? " (Booked)" : ""}
                  </button>
                );
              })
            ) : (
              <div className="text-sm text-[#8c6c67]">
                No time slots available for this date.
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 text-sm text-[#8c6c67]">
            Choose a date to see available time slots.
          </div>
        )}
        {bookedSlotsLoading ? (
          <div className="mt-3 text-xs text-[#8c6c67]">Loading booked slots...</div>
        ) : null}
        {bookedSlotsError ? (
          <div className="mt-3 text-xs font-semibold text-[#9a2119]">{bookedSlotsError}</div>
        ) : null}
      </div>

      <button
        type="button"
        disabled={!selectedDate || !selectedSlot}
        onClick={handlePayment}
        className="mt-5 w-full rounded-[18px] py-3.5 text-[14px] font-extrabold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: "linear-gradient(90deg, #c72733 0%, #51154c 100%)" }}
      >
        Book & Pay
      </button>
    </div>
  </Modal>
</div>

       <SectionCard title="About">
          <div
            className="prose prose-sm max-w-none
                       prose-headings:text-black
                       prose-p:text-ink
                       prose-li:text-ink
                       prose-a:text-brand
                       prose-strong:text-ink
                       prose-table:border prose-table:border-line
                       prose-td:border prose-td:border-line prose-td:p-2
                       prose-th:border prose-th:border-line prose-th:p-2
                       prose-blockquote:border-l-brand prose-blockquote:text-ink"
     dangerouslySetInnerHTML={{ __html: activeMentor.descriptionHtml || "" }}     />
        </SectionCard>

        <SectionCard title="Mentor Details">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] bg-[#fffaf8] p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b8837e]">Designation</div>
              <div className="mt-1 text-[14px] font-semibold text-[#1a0a09]">{activeMentor.specialty || "N/A"}</div>
            </div>
            <div className="rounded-[18px] bg-[#fffaf8] p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b8837e]">Place of Work</div>
              <div className="mt-1 text-[14px] font-semibold text-[#1a0a09]">
                {activeMentor.placeOfWork || "N/A"}
              </div>
            </div>
            <div className="rounded-[18px] bg-[#fffaf8] p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b8837e]">Experience</div>
             <div className="mt-1 text-[14px] font-semibold text-[#1a0a09]">
  {(() => {
    const experience = String(activeMentor.experience || "")
      .replace(/[^0-9.]/g, "");

    if (!experience) return "N/A";

    return `${experience} ${Number(experience) === 1 ? "Year" : "Years"}`;
  })()}
</div> </div>
            <div className="rounded-[18px] bg-[#fffaf8] p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b8837e]">Area of Expertise</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(String(activeMentor.raw?.skill || "")
                  .split(/\r?\n|,/)
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .length
                  ? String(activeMentor.raw?.skill || "")
                      .split(/\r?\n|,/)
                      .map((item) => item.trim())
                      .filter(Boolean)
                  : [activeMentor.raw?.skill || "N/A"]
                ).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#9a2119] shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <Modal
          open={paymentOpen}
          centered
          onCancel={() => setPaymentOpen(false)}
          footer={null}
          width={760}
          className="[&_.ant-modal-content]:!rounded-[28px] [&_.ant-modal-content]:!overflow-hidden"
        />
      </ModuleScreen>
    );
  }

  // ── Mentor list view ─────────────────────────────────────────────────────
  return (
    <ModuleScreen className="space-y-6 pb-8">
      <div className="motion-item flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-2xl font-black leading-tight text-[#1a0a09]">Book Your Mentor</h1>
         
          {loadError ? (
            <p className="mt-2 text-xs font-semibold text-[#9a2119]">{loadError}</p>
          ) : null}
        </div>
        <PageHero backOnly onBack={goToDashboard} className="shrink-0" />
      </div>

      

      {/* ── Filter dropdowns ── */}
      <div className="flex flex-wrap items-center gap-2">
  <div className="relative">
    <Select
      showSearch
      allowClear
      placeholder="All Domains"
      optionFilterProp="label"
      value={category || undefined}
      onChange={(value) => handleCategoryChange(value)}
      options={categoryOptions.map((opt) => ({
        value: String(opt.id),
        label: opt.title,
      }))}
      style={{ minWidth: 220 }}
      className="pill-select"
    />
  </div>

  {category ? (
    <button
      type="button"
      onClick={() => setCategory("")}
      className="rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-[#9a2119] underline-offset-2 hover:underline"
    >
      Clear
    </button>
  ) : null}
</div>

      {/* ── Mentor grid ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredMentorList.map((mentor, index) => {
          const mentorFree =
             isModuleUnlocked
              ? true
              : unlocked || index < 4 || canAccessFreeDetail("book-mentor", mentor.name);

          return (
            <MentorCard
              key={mentor.id || mentor.name}
              mentor={mentor}
              isFree={mentorFree}
             onClick={async () => {
  if (!isModuleUnlocked && !unlocked && !mentorFree) {
    setUnlockModalItem(mentor.name);
    return;
  }

  if (!isModuleUnlocked) {
    registerFreeDetailAccess("book-mentor", mentor.name);
  }

  try {
    const mentorDetails = await getMentorById(mentor.id);

    setSelectedMentorId(String(mentor.id));
    setSelectedMentor(mentorDetails);
  } catch (err) {
    console.error(err);

    // Agar API fail ho jaye to old data dikha do
    setSelectedMentorId(String(mentor.id));
    setSelectedMentor(mentor);
  }
}}
            />
          );
        })}
      </div>

      {filteredMentorList.length === 0 ? (
        <div className="py-10 text-center text-gray-500">No mentors match these filters</div>
      ) : null}

      <UnlockRedirectModal
        open={Boolean(unlockModalItem)}
        title="Unlock Mentor Access"
        itemLabel={unlockModalItem}
        description="Your free mentor access has been used. Subscribe to unlock"
        onCancel={() => setUnlockModalItem(null)}
        onConfirm={() => {
          const returnTo = buildMentorReturnTo(unlockModalItem);
          setUnlockModalItem(null);
          navigate(`/app/subscription?returnTo=${encodeURIComponent(returnTo)}`);
        }}
      />
    </ModuleScreen>
  );
}
