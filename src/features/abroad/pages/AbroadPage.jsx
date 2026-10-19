import { useEffect, useState } from "react";
import {
  ArrowRightOutlined,
  BookOutlined,
  BuildOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  ReadOutlined,
   LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { ModuleScreen, PageHero } from "../../../components/ui";
import { createStudyAbroadConsultation, getStudyAbroadCountries } from "../../../api/studyabroadApi";
import { studyAbroadCountries as fallbackStudyAbroadCountries } from "../../../data/careermapData";
import { useAppState } from "../../../state/AppStateContext";
import { UnlockRedirectModal, usePortalNavigation } from "../../portal/components/portalPageShared";

// Fixed, common to all destinations — shown once on the listing page, not per country
const INTRO_TEXT =
  "Explore world-class education opportunities in the world's leading study destinations. We help students secure admission to top-ranked universities offering Undergraduate (UG) and Postgraduate (PG) programs across the UK, USA, Canada, Europe, Singapore, and Dubai.";

const UG_PROGRAMS = [
  "BBA",
  "B.Com",
  "B.Tech / Engineering",
  "Computer Science",
  "Artificial Intelligence",
  "Data Science",
  "Nursing",
  "Psychology",
  "Architecture",
  "Hospitality Management",
  "Media & Communication",
  "Biotechnology",
];

const PG_PROGRAMS = [
  "MBA",
  "MSc Computer Science",
  "MSc Data Science",
  "MSc Artificial Intelligence",
  "MSc Engineering",
  "MSc Finance",
  "MSc Marketing",
  "Master of Public Health (MPH)",
  "Master of Laws (LLM)",
  "Master of Education (M.Ed.)",
  "MSc Cybersecurity",
  "MSc Business Analytics",
];

function ProgramList({ icon, title, programs }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fdf0ee] text-[#9a2119]">
          {icon}
        </div>
        <h3 className="m-0 text-base font-bold text-gray-800">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {programs.map((program) => (
          <span
            key={program}
            className="rounded-full border border-[#f5d8d1] bg-[#fdf4f2] px-3 py-1.5 text-sm font-semibold text-[#9a2119]"
          >
            {program}
          </span>
        ))}
      </div>
    </div>
  );
}

function RadioGroup({
  label,
  value,
  options,
  onChange,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#241312]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                selected
                  ? "border-[#9a2119] bg-[#fdf0ee] text-[#9a2119]"
                  : "border-[#ead9d5] bg-white text-gray-700 hover:border-[#d9b5ad]"
              }`}
            >
              <input
                type="radio"
                name={label}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 accent-[#9a2119]"
              />

              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function CheckboxGroup({
  label,
  values = [],
  options,
  onChange,
  required = false,
}) {
  const safeValues = Array.isArray(values) ? values : [];

  const handleToggle = (value) => {
    if (safeValues.includes(value)) {
      onChange(
        safeValues.filter((item) => item !== value)
      );
    } else {
      onChange([...safeValues, value]);
    }
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#241312]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = safeValues.includes(option.value);

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                checked
                  ? "border-[#9a2119] bg-[#fdf0ee] text-[#9a2119]"
                  : "border-[#ead9d5] bg-white text-gray-700 hover:border-[#d9b5ad]"
              }`}
            >
              <input
                type="checkbox"
                value={option.value}
                checked={checked}
                onChange={() => handleToggle(option.value)}
                className="h-4 w-4 accent-[#9a2119]"
              />

              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function FormInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#241312]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-3 text-sm outline-none transition focus:border-[#9a2119] focus:ring-2 focus:ring-[#9a2119]/10"
      />
    </div>
  );
}

function FormTextarea({
  label,
  name,
  value,
  onChange,
  placeholder = "",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#241312]">
        {label}
      </label>

      <textarea
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-3 text-sm outline-none transition focus:border-[#9a2119] focus:ring-2 focus:ring-[#9a2119]/10"
      />
    </div>
  );
}


export default function AbroadPage() {
  const { isUnlocked } = useAppState();
  const { navigate, location, goToDashboard } = usePortalNavigation();
  const accessStatus = location.state?.accessStatus || "preview";
  const unlocked = accessStatus === "full" || isUnlocked("abroad-consultancy");

  const [countryList, setCountryList] = useState(fallbackStudyAbroadCountries);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [unlockModalItem, setUnlockModalItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

const initialConsultForm = {
  // Student Information
  fullName: "",
  dateOfBirth: "",
  gender: "",
  email: "",
  mobileNumber: "",
  whatsappNumber: "",
  currentCityState: "",
  countryOfCitizenship: "",

  // Parent / Guardian
  parentGuardianName: "",
  parentRelationship: "",
  parentMobileNumber: "",
  parentEmail: "",
  parentOccupation: "",
  primaryFundingSource: [],

  // Academic
  highestQualification: "",
  schoolCollegeUniversity: "",
  boardUniversity: "",
  passingYear: "",
  class10PercentageCGPA: "",
  class12PercentageCGPA: "",

  // Study Abroad
  intendedStudyLevel: "",
  preferredIntake: "",
  preferredCountries: [],
  preferredCourseProgramme: "",
  preferredSpecialization: "",
  preferredUniversities: "",
  openToAlternativeUniversities: "",

  // English / Entrance
  englishTest: "",
  englishTestScoreDate: "",
  otherEntranceExams: [],
  entranceExamScoreDate: "",

  // Career / Budget
  preferredCareerDomain: "",
  reasonToStudyAbroad: "",
  topPriorities: [],
  annualTuitionBudget: "",
  totalEducationBudget: "",
  scholarshipRequired: "",
  educationLoanRequired: "",

  // Passport
  passportStatus: "",
  passportExpiryDate: "",
  documentsAvailable: [],

  // Services
  servicesRequired: [],

  // Additional
  message: "",
};


const handleConsultChange = (event) => {
  const { name, value } = event.target;

  setConsultForm((current) => ({
    ...current,
    [name]: value,
  }));
};

const updateConsultField = (name, value) => {
  setConsultForm((current) => ({
    ...current,
    [name]: value,
  }));
};



const [consultForm, setConsultForm] = useState(initialConsultForm);



  const activeCountry = selectedCountry;

  function buildAbroadReturnTo(countryRef = activeCountry) {
    const countryName = typeof countryRef === "string" ? countryRef : countryRef?.name;
    const countryId = typeof countryRef === "object" ? countryRef?.id : "";
    const nextParams = new URLSearchParams();

    if (countryId) nextParams.set("countryId", countryId);
    if (countryName) nextParams.set("country", countryName);

    const query = nextParams.toString();
    return query ? `${location.pathname}?${query}` : location.pathname;
  }

  useEffect(() => {
    let active = true;

    async function loadCountries() {
      try {
        setLoadError("");
        const items = await getStudyAbroadCountries();
        if (active) {
       setCountryList(items.length ? [...items].sort((a, b) => b.id - a.id) : fallbackStudyAbroadCountries); }
      } catch (error) {
        if (active) {
          setLoadError(error?.response?.data?.message || error?.message || "Failed to load study abroad destinations.");
          setCountryList(fallbackStudyAbroadCountries);
        }
      }
    }

    loadCountries();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const countryParam = searchParams.get("countryId") || searchParams.get("country");

    if (!countryParam) {
      return;
    }

    const country = countryList.find(
      (item) => String(item.id) === String(countryParam) || item.name === countryParam || item.countryName === countryParam
    );

    if (country) {
      setSelectedCountry(country);
    }
  }, [countryList, location.search]);

 function handleCardConsult(country, isFree, event) {
  event.stopPropagation();

  if (!isFree) {
    setUnlockModalItem(country.name);
    return;
  }

  setSelectedCountry(country);
  setFormOpen(true);
}

  if (submitted && activeCountry) {
    return (
      <ModuleScreen className="space-y-6">
        <PageHero backOnly onBack={() => setSubmitted(false)} />
        <div className="motion-item rounded-[28px] border border-[#f0e4e2] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fdf0ee] text-xl text-[#9a2119]">
            <CheckCircleOutlined />
          </div>
          <h2 className="text-xl font-bold text-[#9a2119]">Request Submitted</h2>
          <p className="mt-2 text-gray-600">
            Your consultation request for {activeCountry.name} has been recorded.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setSelectedCountry(null);
            }}
            className="mt-4 rounded-lg bg-[#9a2119] px-5 py-2 text-white"
          >
            Back to Home
          </button>
        </div>
      </ModuleScreen>
    );
  }

 
if (selectedCountry) {
  return (
    <ModuleScreen className="space-y-6  pb-28">
      {/* Back */}
      <PageHero
        backOnly
        onBack={() => setSelectedCountry(null)}
      />

      {/* Hero */}
      <div className="overflow-hidden rounded-[30px] border border-[#f0e4e2] bg-white shadow-sm">
        <div className="relative px-6 py-8 md:px-10 md:py-10">
          {/* Decorative background */}
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#fdf0ee]" />
          <div className="absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-[#fdf5f3]" />

          <div className="relative flex flex-col items-center text-center md:flex-row md:items-center md:text-left">
            {/* Country Icon */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[5px] border-[#f8ddd7] bg-[#fff7f5] text-4xl text-[#9a2119] shadow-sm">
              <GlobalOutlined />
            </div>

            {/* Country Details */}
            <div className="mt-5 md:ml-7 md:mt-0">
              <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
               

                <span className="rounded-full bg-[#fdf0ee] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9a2119]">
                  Study Destination
                </span>
              </div>

              <h1 className="m-0 text-3xl font-extrabold tracking-tight text-[#241312] md:text-4xl">
                 {selectedCountry.name}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8c6c67]">
                Explore education opportunities, universities, programs,
                and study options in {selectedCountry.name}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Description */}
        <div className="rounded-[28px] border border-[#f0e4e2] bg-white p-6 shadow-sm md:p-8">
          {/* Section Header */}
          <div className="mb-6 flex items-center gap-3 border-b border-[#f4e6e3] pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fdf0ee] text-lg text-[#9a2119]">
              <ReadOutlined />
            </div>

            <div>
              <h2 className="m-0 text-xl font-bold text-[#241312]">
                About {selectedCountry.name}
              </h2>

              <p className="m-0 mt-1 text-xs text-[#9b817c]">
                Everything you need to know about studying here
              </p>
            </div>
          </div>

          {/* API Content */}
          <div
            className="
              text-sm leading-7 text-gray-700

              [&_h1]:mb-3
              [&_h1]:mt-5
              [&_h1]:text-2xl
              [&_h1]:font-bold
              [&_h1]:text-[#9a2119]

              [&_h2]:mb-3
              [&_h2]:mt-7
              [&_h2]:text-xl
              [&_h2]:font-bold
              [&_h2]:text-[#9a2119]

              [&_h3]:mb-2
              [&_h3]:mt-6
              [&_h3]:text-lg
              [&_h3]:font-bold
              [&_h3]:text-[#9a2119]

              [&_p]:mb-4

              [&_ul]:mb-5
              [&_ul]:list-disc
              [&_ul]:space-y-2
              [&_ul]:pl-6

              [&_ol]:mb-5
              [&_ol]:list-decimal
              [&_ol]:space-y-2
              [&_ol]:pl-6

              [&_li]:text-gray-700

              [&_strong]:font-bold
              [&_strong]:text-[#241312]

              [&_a]:font-semibold
              [&_a]:text-[#9a2119]
              [&_a]:underline
            "
            dangerouslySetInnerHTML={{
              __html:
                selectedCountry.descriptionHtml ||
                selectedCountry.description,
            }}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
         

          {/* Consultation Card */}
          <div className="overflow-hidden rounded-[26px] border border-[#f0e4e2] bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fdf0ee] text-xl text-[#9a2119]">
              <BookOutlined />
            </div>

            <h3 className="m-0 text-xl font-bold text-[#241312]">
              Need Help Choosing?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Get personalized guidance about courses, universities,
              applications, and studying in {selectedCountry.name}.
            </p>

            <button
              type="button"
              onClick={() => {
                if (!unlocked) {
                  setUnlockModalItem(selectedCountry.name);
                  return;
                }

                setFormOpen(true);
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#9a2119] py-3 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-[#7f1913] hover:shadow-md"
            >
              {unlocked
                ? "Get Free Consultation"
                : "Unlock Consultation"}

              <ArrowRightOutlined />
            </button>
          </div>

          {/* Quick Benefits */}
          <div className="rounded-[26px] border border-[#f0e4e2] bg-white p-5 shadow-sm">
            <h3 className="m-0 text-base font-bold text-[#241312]">
              Why Get Guidance?
            </h3>

            <div className="mt-4 space-y-3">
              {[
                "Course selection guidance",
                "University selection",
                "Application assistance",
                "Study destination guidance",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-[#fff8f6] px-3 py-2.5"
                >
                  <CheckCircleOutlined className="text-[#9a2119]" />

                  <span className="text-sm font-medium text-gray-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

  
{/* ===================================================== */}
{/* CONSULTATION MODAL */}
{/* ===================================================== */}

{formOpen ? (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

    <div className="flex max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="shrink-0 border-b border-[#f0e4e2] bg-white px-6 py-5">

        <div className="flex items-start justify-between gap-4">

          <div>
            <h2 className="m-0 text-xl font-bold text-[#241312]">
              Foreign University Admission
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Student Registration & Free Counselling Form
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormOpen(false);
              setSubmitError("");
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-500 transition hover:bg-[#fdf0ee] hover:text-[#9a2119]"
          >
            ×
          </button>

        </div>
      </div>


      {/* ===================================================== */}
      {/* FORM BODY */}
      {/* ===================================================== */}

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">

        <div className="space-y-8">


          {/* ===================================================== */}
          {/* 1. STUDENT BASIC DETAILS */}
          {/* ===================================================== */}

          <section>

            <div className="mb-5 border-b border-[#f0e4e2] pb-3">
              <h3 className="text-lg font-bold text-[#9a2119]">
                1. Student Basic Details
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* Full Name */}
              <input
                type="text"
                placeholder="Full Name *"
                value={consultForm.fullName}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    fullName: e.target.value,
                  }))
                }
                className="form-input"
              />

              {/* Date of Birth */}
              <input
                type="date"
                value={consultForm.dateOfBirth}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    dateOfBirth: e.target.value,
                  }))
                }
                className="form-input"
              />

              {/* Gender */}
              <div className="rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-3 lg:col-span-2">

                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Gender
                </p>

                <div className="flex flex-wrap gap-4">

                  {[
                    "Male",
                    "Female",
                    "Other",
                    "Prefer not to say",
                  ].map((option) => (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={option}
                        checked={consultForm.gender === option}
                        onChange={(e) =>
                          setConsultForm((current) => ({
                            ...current,
                            gender: e.target.value,
                          }))
                        }
                        className="accent-[#9a2119]"
                      />

                      {option}
                    </label>
                  ))}

                </div>
              </div>


              {/* Email */}
              <input
                type="email"
                placeholder="Email Address *"
                value={consultForm.email}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    email: e.target.value,
                  }))
                }
                className="form-input"
              />

              {/* Mobile */}
              <input
                type="tel"
                maxLength={10}
                placeholder="Mobile Number *"
                value={consultForm.mobileNumber}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    mobileNumber: e.target.value.replace(/\D/g, ""),
                  }))
                }
                className="form-input"
              />

              {/* WhatsApp */}
              <input
                type="tel"
                maxLength={10}
                placeholder="WhatsApp Number"
                value={consultForm.whatsappNumber}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    whatsappNumber: e.target.value.replace(/\D/g, ""),
                  }))
                }
                className="form-input"
              />

              {/* Current City */}
              <input
                type="text"
                placeholder="Current City / State *"
                value={consultForm.currentCityState}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    currentCityState: e.target.value,
                  }))
                }
                className="form-input"
              />

              {/* Citizenship */}
              <input
                type="text"
                placeholder="Country of Citizenship"
                value={consultForm.countryOfCitizenship}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    countryOfCitizenship: e.target.value,
                  }))
                }
                className="form-input"
              />

            </div>
          </section>


          {/* ===================================================== */}
          {/* 2. PARENT / GUARDIAN */}
          {/* ===================================================== */}

          <section>

            <div className="mb-5 border-b border-[#f0e4e2] pb-3">
              <h3 className="text-lg font-bold text-[#9a2119]">
                2. Parent / Guardian Details
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <input
                type="text"
                placeholder="Parent / Guardian Name"
                value={consultForm.parentGuardianName}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    parentGuardianName: e.target.value,
                  }))
                }
                className="form-input"
              />

              <input
                type="text"
                placeholder="Relationship"
                value={consultForm.parentRelationship}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    parentRelationship: e.target.value,
                  }))
                }
                className="form-input"
              />

              <input
                type="tel"
                maxLength={10}
                placeholder="Mobile Number"
                value={consultForm.parentMobileNumber}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    parentMobileNumber: e.target.value.replace(/\D/g, ""),
                  }))
                }
                className="form-input"
              />

              <input
                type="email"
                placeholder="Email Address"
                value={consultForm.parentEmail}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    parentEmail: e.target.value,
                  }))
                }
                className="form-input"
              />

              <input
                type="text"
                placeholder="Occupation"
                value={consultForm.parentOccupation}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    parentOccupation: e.target.value,
                  }))
                }
                className="form-input"
              />


            {/* Primary Funding Source - Multi Select */}
<div>
  <label className="mb-2 block text-sm font-semibold text-gray-700">
    Primary Funding Source
  </label>

  <div className="flex flex-wrap gap-3">
    {[
      "Parents/Guardian",
      "Student",
      "Education Loan",
      "Scholarship",
      "Other",
    ].map((option) => (
      <label
        key={option}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
      >
        <input
          type="checkbox"
          value={option}
          checked={
            consultForm.primaryFundingSource.includes(option)
          }
          onChange={(e) =>
            setConsultForm((current) => {
              const selectedSources = current.primaryFundingSource;

              return {
                ...current,
                primaryFundingSource: e.target.checked
                  ? [...selectedSources, option]
                  : selectedSources.filter((source) => source !== option),
              };
            })
          }
          className="accent-[#9a2119]"
        />

        {option}
      </label>
    ))}
  </div>
</div>

            </div>
          </section>


          {/* ===================================================== */}
          {/* 3. ACADEMIC DETAILS */}
          {/* ===================================================== */}

          <section>

            <div className="mb-5 border-b border-[#f0e4e2] pb-3">
              <h3 className="text-lg font-bold text-[#9a2119]">
                3. Academic Details
              </h3>
            </div>

{/* Current / Highest Qualification - Single Select */}
<div>
  <label className="mb-2 block text-sm font-semibold text-gray-700">
    Current / Highest Qualification
  </label>

  <div className="flex flex-wrap gap-3">
    {[
      "Class 10",
      "Class 12",
      "Diploma",
      "Bachelor's",
      "Master's",
      "Other",
    ].map((option) => (
      <label
        key={option}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
      >
        <input
          type="radio"
          name="highestQualification"
          value={option}
          checked={
            consultForm.highestQualification === option
          }
          onChange={(e) =>
            setConsultForm((current) => ({
              ...current,
              highestQualification: e.target.value,
            }))
          }
          className="accent-[#9a2119]"
        />

        {option}
      </label>
    ))}
  </div>
</div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <input
                type="text"
                placeholder="School / College / University"
                value={consultForm.schoolCollegeUniversity}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    schoolCollegeUniversity: e.target.value,
                  }))
                }
                className="form-input lg:col-span-2"
              />

              <input
                type="text"
                placeholder="Board / University"
                value={consultForm.boardUniversity}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    boardUniversity: e.target.value,
                  }))
                }
                className="form-input lg:col-span-2"
              />

              <input
                type="text"
                placeholder="Year of Passing / Expected Graduation"
                value={consultForm.passingYear}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    passingYear: e.target.value,
                  }))
                }
                className="form-input"
              />

              <input
                type="text"
                placeholder="Class 10 Percentage / CGPA"
                value={consultForm.class10PercentageCGPA}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    class10PercentageCGPA: e.target.value,
                  }))
                }
                className="form-input"
              />

              <input
                type="text"
                placeholder="Class 12 Percentage / CGPA"
                value={consultForm.class12PercentageCGPA}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    class12PercentageCGPA: e.target.value,
                  }))
                }
                className="form-input"
              />

            </div>
          </section>


          {/* ===================================================== */}
          {/* 4. FOREIGN EDUCATION PREFERENCES */}
          {/* ===================================================== */}

          <section>

            <div className="mb-5 border-b border-[#f0e4e2] pb-3">
              <h3 className="text-lg font-bold text-[#9a2119]">
                4. Foreign Education Preferences
              </h3>
            </div>


            {/* Intended Study Level */}
            <div className="mb-4 rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-4">

              <p className="mb-3 text-sm font-semibold text-gray-700">
                Intended Study Level
              </p>

              <div className="flex flex-wrap gap-3">

                {[
                  "Undergraduate",
                  "Postgraduate",
                  "PhD",
                  "Diploma/Certificate",
                ].map((option) => (

                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >

                    <input
                      type="radio"
                      name="intendedStudyLevel"
                      value={option}
                      checked={
                        consultForm.intendedStudyLevel === option
                      }
                      onChange={(e) =>
                        setConsultForm((current) => ({
                          ...current,
                          intendedStudyLevel: e.target.value,
                        }))
                      }
                      className="accent-[#9a2119]"
                    />

                    {option}

                  </label>

                ))}

              </div>
            </div>


            {/* Preferred Intake */}
            <div className="mb-4 rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-4">

              <p className="mb-3 text-sm font-semibold text-gray-700">
                Preferred Intake
              </p>

              <div className="flex flex-wrap gap-3">

                {[
                  "Jan",
                  "Feb",
                  "May",
                  "Sep",
                  "Other",
                ].map((option) => {
                  return (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >

                      <input
                        type="radio"
                        name="preferredIntake"
                        value={option}
                        checked={consultForm.preferredIntake === option}
                        onChange={(e) =>
                          setConsultForm((current) => ({
                            ...current,
                            preferredIntake: e.target.value,
                          }))
                        }
                        className="accent-[#9a2119]"
                      />

                      {option}

                    </label>
                  );
                })}

              </div>
            </div>


            {/* Preferred Countries */}
            <div className="mb-4 rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-4">

              <p className="mb-3 text-sm font-semibold text-gray-700">
                Preferred Countries
              </p>

              <div className="flex flex-wrap gap-3">

                {[
                  "USA",
                  "UK",
                  "Canada",
                  "Australia",
                  "NZ",
                  "Germany",
                  "Ireland",
                ].map((option) => {

                  const selected =
                    Array.isArray(consultForm.preferredCountries) &&
                    consultForm.preferredCountries.includes(option);

                  return (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >

                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {

                          setConsultForm((current) => {

                            const oldValues =
                              Array.isArray(current.preferredCountries)
                                ? current.preferredCountries
                                : [];

                            return {
                              ...current,
                              preferredCountries:
                                e.target.checked
                                  ? [...oldValues, option]
                                  : oldValues.filter(
                                      (item) => item !== option
                                    ),
                            };
                          });

                        }}
                        className="accent-[#9a2119]"
                      />

                      {option}

                    </label>
                  );
                })}

              </div>
            </div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <input
                type="text"
                placeholder="Preferred Course / Programme *"
                value={consultForm.courseInterest}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    courseInterest: e.target.value,
                  }))
                }
                className="form-input"
              />

              <input
                type="text"
                placeholder="Preferred Specialization"
                value={consultForm.preferredSpecialization}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    preferredSpecialization: e.target.value,
                  }))
                }
                className="form-input"
              />

              <input
                type="text"
                placeholder="Preferred Universities"
                value={consultForm.preferredUniversities}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    preferredUniversities: e.target.value,
                  }))
                }
                className="form-input"
              />


              {/* Alternative Universities */}
              <div className="rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-3">

                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Open to Alternative Universities?
                </p>

                <div className="flex gap-5">

                  {["Yes", "No"].map((option) => (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="radio"
                        name="alternativeUniversities"
                        value={option}
                        checked={
                          consultForm.openToAlternativeUniversities ===
                          option
                        }
                        onChange={(e) =>
                          setConsultForm((current) => ({
                            ...current,
                            openToAlternativeUniversities:
                              e.target.value,
                          }))
                        }
                        className="accent-[#9a2119]"
                      />

                      {option}
                    </label>
                  ))}

                </div>
              </div>

            </div>
          </section>


          {/* ===================================================== */}
          {/* 5. ENGLISH & ENTRANCE EXAMS */}
          {/* ===================================================== */}

          <section>

            <div className="mb-5 border-b border-[#f0e4e2] pb-3">
              <h3 className="text-lg font-bold text-[#9a2119]">
                5. English & Entrance Exams
              </h3>
            </div>

          {/* English Test - Single Select */}
<div>
  <label className="mb-2 block text-sm font-semibold text-gray-700">
    English Test
  </label>

  <div className="flex flex-wrap gap-3">
    {[
      "IELTS",
      "TOEFL",
      "PTE",
      "Duolingo",
      "Cambridge",
      "Not Yet",
      "Other",
    ].map((option) => {
      return (
        <label
          key={option}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <input
            type="radio"
            name="englishTest"
            value={option}
            checked={consultForm.englishTest === option}
            onChange={(e) =>
              setConsultForm((current) => ({
                ...current,
                englishTest: e.target.value,
              }))
            }
            className="accent-[#9a2119]"
          />

          {option}
        </label>
      );
    })}
  </div>
</div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <input
                type="date"
                aria-label="English test score date"
                value={consultForm.englishTestScoreDate}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    englishTestScoreDate: e.target.value,
                  }))
                }
                className="form-input"
              />

            </div>


            {/* Other Entrance Exams */}
            <div className="mt-4 rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-4">

              <p className="mb-3 text-sm font-semibold text-gray-700">
                Other Entrance Exam
              </p>

              <div className="flex flex-wrap gap-3">

                {[
                  "SAT",
                  "ACT",
                  "GRE",
                  "GMAT",
                  "LSAT",
                  "MCAT",
                  "Other",
                  "None",
                ].map((option) => {

                  const selected =
                    Array.isArray(consultForm.otherEntranceExams) &&
                    consultForm.otherEntranceExams.includes(option);

                  return (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >

                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {

                          setConsultForm((current) => {

                            const oldValues =
                              Array.isArray(
                                current.otherEntranceExams
                              )
                                ? current.otherEntranceExams
                                : [];

                            return {
                              ...current,
                              otherEntranceExams:
                                e.target.checked
                                  ? [...oldValues, option]
                                  : oldValues.filter(
                                      (item) => item !== option
                                    ),
                            };
                          });

                        }}
                        className="accent-[#9a2119]"
                      />

                      {option}

                    </label>
                  );
                })}

              </div>
            </div>


            <input
              type="date"
              aria-label="Entrance exam score date"
              value={consultForm.entranceExamScoreDate}
              onChange={(e) =>
                setConsultForm((current) => ({
                  ...current,
                  entranceExamScoreDate: e.target.value,
                }))
              }
              className="form-input mt-4 w-full"
            />

          </section>


          {/* ===================================================== */}
          {/* 6. CAREER & BUDGET */}
          {/* ===================================================== */}

          <section>

            <div className="mb-5 border-b border-[#f0e4e2] pb-3">
              <h3 className="text-lg font-bold text-[#9a2119]">
                6. Career & Budget Preferences
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">

              <input
                type="text"
                placeholder="Preferred Career / Domain"
                value={consultForm.preferredCareerDomain}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    preferredCareerDomain: e.target.value,
                  }))
                }
                className="form-input"
              />


              <textarea
                rows={3}
                placeholder="Why do you want to study abroad?"
                value={consultForm.reasonToStudyAbroad}
                onChange={(e) =>
                  setConsultForm((current) => ({
                    ...current,
                    reasonToStudyAbroad: e.target.value,
                  }))
                }
                className="form-input resize-none"
              />


              {/* Top Priorities */}
              <div className="rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-4">

                <p className="mb-3 text-sm font-semibold text-gray-700">
                  Top Priorities
                </p>

                <div className="flex flex-wrap gap-3">

                  {[
                    "Ranking",
                    "Course Quality",
                    "Jobs",
                    "Fees",
                    "Scholarship",
                    "Location",
                    "Research",
                    "Other",
                  ].map((option) => {

                    const selected =
                      Array.isArray(consultForm.topPriorities) &&
                      consultForm.topPriorities.includes(option);

                    return (
                      <label
                        key={option}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      >

                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {

                            setConsultForm((current) => {

                              const oldValues =
                                Array.isArray(current.topPriorities)
                                  ? current.topPriorities
                                  : [];

                              return {
                                ...current,
                                topPriorities:
                                  e.target.checked
                                    ? [...oldValues, option]
                                    : oldValues.filter(
                                        (item) => item !== option
                                      ),
                              };
                            });

                          }}
                          className="accent-[#9a2119]"
                        />

                        {option}

                      </label>
                    );
                  })}

                </div>
              </div>


              {/* Annual Tuition */}
              <div className="rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-4">

                <p className="mb-3 text-sm font-semibold text-gray-700">
                  Annual Tuition Budget
                </p>

                <div className="flex flex-wrap gap-3">

                  {[
                    "< ₹10L",
                    "₹10–20L",
                    "₹20–30L",
                    "₹30–50L",
                    "₹50L+",
                    "Not Decided",
                  ].map((option) => (

                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >

                      <input
                        type="radio"
                        name="annualTuitionBudget"
                        value={option}
                        checked={
                          consultForm.annualTuitionBudget === option
                        }
                        onChange={(e) =>
                          setConsultForm((current) => ({
                            ...current,
                            annualTuitionBudget: e.target.value,
                          }))
                        }
                        className="accent-[#9a2119]"
                      />

                      {option}

                    </label>

                  ))}

                </div>
              </div>


              {/* Total Education Budget */}
              <div className="rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-4">

                <p className="mb-3 text-sm font-semibold text-gray-700">
                  Total Education Budget
                </p>

                <div className="flex flex-wrap gap-3">

                  {[
                    "< ₹20L",
                    "₹20–40L",
                    "₹40–60L",
                    "₹60L–1Cr",
                    "> ₹1Cr",
                  ].map((option) => (

                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >

                      <input
                        type="radio"
                        name="totalEducationBudget"
                        value={option}
                        checked={
                          consultForm.totalEducationBudget === option
                        }
                        onChange={(e) =>
                          setConsultForm((current) => ({
                            ...current,
                            totalEducationBudget: e.target.value,
                          }))
                        }
                        className="accent-[#9a2119]"
                      />

                      {option}

                    </label>

                  ))}

                </div>
              </div>


              {/* Scholarship */}
              <div className="rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-4">

                <p className="mb-3 text-sm font-semibold text-gray-700">
                  Scholarship Required?
                </p>

                <div className="flex gap-5">

                  {["Yes", "No"].map((option) => (

                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >

                      <input
                        type="radio"
                        name="scholarshipRequired"
                        value={option}
                        checked={
                          consultForm.scholarshipRequired === option
                        }
                        onChange={(e) =>
                          setConsultForm((current) => ({
                            ...current,
                            scholarshipRequired: e.target.value,
                          }))
                        }
                        className="accent-[#9a2119]"
                      />

                      {option}

                    </label>

                  ))}

                </div>
              </div>


              {/* Education Loan */}
              <div className="rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-4">

                <p className="mb-3 text-sm font-semibold text-gray-700">
                  Education Loan Required?
                </p>

                <div className="flex gap-5">

                  {["Yes", "No", "Maybe"].map((option) => (

                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >

                      <input
                        type="radio"
                        name="educationLoanRequired"
                        value={option}
                        checked={
                          consultForm.educationLoanRequired === option
                        }
                        onChange={(e) =>
                          setConsultForm((current) => ({
                            ...current,
                            educationLoanRequired: e.target.value,
                          }))
                        }
                        className="accent-[#9a2119]"
                      />

                      {option}

                    </label>

                  ))}

                </div>
              </div>

            </div>
          </section>


          {/* ===================================================== */}
          {/* 7. PASSPORT & DOCUMENTS */}
          {/* ===================================================== */}

          <section>

            <div className="mb-5 border-b border-[#f0e4e2] pb-3">
              <h3 className="text-lg font-bold text-[#9a2119]">
                7. Passport & Documents
              </h3>
            </div>


            {/* Valid Passport */}
            <div className="mb-4 rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-4">

              <p className="mb-3 text-sm font-semibold text-gray-700">
                Valid Passport
              </p>

              <div className="flex flex-wrap gap-3">

                {[
                  "Yes",
                  "No",
                  "Applied",
                  "Renewal in Process",
                ].map((option) => (

                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >

                    <input
                      type="radio"
                      name="passportStatus"
                      value={option}
                      checked={
                        consultForm.passportStatus === option
                      }
                      onChange={(e) =>
                        setConsultForm((current) => ({
                          ...current,
                          passportStatus: e.target.value,
                        }))
                      }
                      className="accent-[#9a2119]"
                    />

                    {option}

                  </label>

                ))}

              </div>
            </div>


            {/* Passport Expiry */}
            <input
              type="date"
              value={consultForm.passportExpiryDate}
              onChange={(e) =>
                setConsultForm((current) => ({
                  ...current,
                  passportExpiryDate: e.target.value,
                }))
              }
              className="form-input mb-4 w-full"
            />


            {/* Documents */}
            <div className="rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-4">

              <p className="mb-3 text-sm font-semibold text-gray-700">
                Documents Available
              </p>

              <div className="flex flex-wrap gap-3">

                {[
                  "Passport",
                  "10th",
                  "12th",
                  "Degree",
                  "Marksheets",
                  "English Score",
                  "CV",
                  "SOP",
                  "LOR",
                  "Financial Docs",
                ].map((option) => {

                  const selected =
                    Array.isArray(consultForm.documentsAvailable) &&
                    consultForm.documentsAvailable.includes(option);

                  return (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >

                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {

                          setConsultForm((current) => {

                            const oldValues =
                              Array.isArray(
                                current.documentsAvailable
                              )
                                ? current.documentsAvailable
                                : [];

                            return {
                              ...current,
                              documentsAvailable:
                                e.target.checked
                                  ? [...oldValues, option]
                                  : oldValues.filter(
                                      (item) => item !== option
                                    ),
                            };
                          });

                        }}
                        className="accent-[#9a2119]"
                      />

                      {option}

                    </label>
                  );
                })}

              </div>
            </div>

          </section>


          {/* ===================================================== */}
          {/* 9. SERVICES REQUIRED */}
          {/* ===================================================== */}

          <section>

            <div className="mb-5 border-b border-[#f0e4e2] pb-3">
              <h3 className="text-lg font-bold text-[#9a2119]">
                9. Services Required
              </h3>
            </div>

            <div className="rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-4">

              <p className="mb-3 text-sm font-semibold text-gray-700">
                Select Required Services
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

                {[
                  "Counselling / University Selection",
                  "Eligibility Assessment",
                  "Application Processing",
                  "SOP",
                  "LOR",
                  "CV/Resume",
                  "Test Guidance",
                  "Scholarship",
                  "Loan Guidance",
                  "Visa Guidance",
                  "Pre-departure",
                  "Accommodation",
                  "Complete Admission Support",
                ].map((option) => {

                  const selected =
                    Array.isArray(consultForm.servicesRequired) &&
                    consultForm.servicesRequired.includes(option);

                  return (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        selected
                          ? "border-[#9a2119] bg-[#fff1ee] text-[#9a2119]"
                          : "border-gray-200 bg-white text-gray-700"
                      }`}
                    >

                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {

                          setConsultForm((current) => {

                            const oldValues =
                              Array.isArray(
                                current.servicesRequired
                              )
                                ? current.servicesRequired
                                : [];

                            return {
                              ...current,
                              servicesRequired:
                                e.target.checked
                                  ? [...oldValues, option]
                                  : oldValues.filter(
                                      (item) => item !== option
                                    ),
                            };
                          });

                        }}
                        className="accent-[#9a2119]"
                      />

                      {option}

                    </label>
                  );
                })}

              </div>
            </div>

          </section>


          {/* ===================================================== */}
          {/* ADDITIONAL MESSAGE */}
          {/* ===================================================== */}

          <section>

            <div className="mb-5 border-b border-[#f0e4e2] pb-3">
              <h3 className="text-lg font-bold text-[#9a2119]">
                Additional Information
              </h3>
            </div>

            <textarea
              rows={5}
              placeholder="Tell us anything else about your study plans..."
              value={consultForm.message}
              onChange={(e) =>
                setConsultForm((current) => ({
                  ...current,
                  message: e.target.value,
                }))
              }
              className="w-full resize-none rounded-xl border border-[#ead9d5] bg-[#fffdfc] p-3 text-sm outline-none transition focus:border-[#9a2119] focus:ring-2 focus:ring-[#9a2119]/10"
            />

          </section>


          {/* ERROR */}
          {submitError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {submitError}
            </div>
          ) : null}

        </div>
      </div>


      {/* ===================================================== */}
      {/* FOOTER */}
      {/* ===================================================== */}

      <div className="shrink-0 border-t border-[#f0e4e2] bg-white px-6 py-4">

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={() => {
              setFormOpen(false);
              setSubmitError("");
            }}
            className="rounded-xl border border-[#ead9d5] px-6 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Cancel
          </button>


          <button
            type="button"
            disabled={submitting}
            onClick={async () => {

              if (!unlocked) {
                setFormOpen(false);

                navigate(
                  `/app/subscription?returnTo=${encodeURIComponent(
                    buildAbroadReturnTo()
                  )}`
                );

                return;
              }


              /* ================= VALIDATION ================= */

              if (!consultForm.fullName.trim()) {
                setSubmitError("Please enter your full name.");
                return;
              }

              if (!consultForm.dateOfBirth) {
                setSubmitError("Please select your date of birth.");
                return;
              }

              if (!consultForm.gender) {
                setSubmitError("Please select your gender.");
                return;
              }

              if (!consultForm.email.trim()) {
                setSubmitError("Please enter your email address.");
                return;
              }

              if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                  consultForm.email.trim()
                )
              ) {
                setSubmitError("Please enter a valid email address.");
                return;
              }

              if (consultForm.mobileNumber.length !== 10) {
                setSubmitError(
                  "Please enter a valid 10-digit mobile number."
                );
                return;
              }

              if (!consultForm.currentCityState.trim()) {
                setSubmitError(
                  "Please enter your current city / state."
                );
                return;
              }

              if (!consultForm.courseInterest?.trim()) {
                setSubmitError(
                  "Please enter your course / programme."
                );
                return;
              }


              try {

                setSubmitting(true);
                setSubmitError("");


                /* ================= API PAYLOAD ================= */

                const payload = {

                  studyAbroadId: Number(selectedCountry?.id),

                  // Student
                  fullName: consultForm.fullName.trim(),
                  dateOfBirth: consultForm.dateOfBirth,
                  gender: consultForm.gender,
                  email: consultForm.email.trim(),
                  mobileNumber: consultForm.mobileNumber,
                  whatsappNumber:
                    consultForm.whatsappNumber.trim(),
                  currentCityState:
                    consultForm.currentCityState.trim(),
                  countryOfCitizenship:
                    consultForm.countryOfCitizenship.trim(),

                  // Parent
                  parentGuardianName:
                    consultForm.parentGuardianName.trim(),
                  parentRelationship:
                    consultForm.parentRelationship.trim(),
                  parentMobileNumber:
                    consultForm.parentMobileNumber,
                  parentEmail:
                    consultForm.parentEmail.trim(),
                  parentOccupation:
                    consultForm.parentOccupation.trim(),
                  primaryFundingSource:
                    consultForm.primaryFundingSource,

                  // Academic
                  highestQualification:
                    consultForm.highestQualification,
                  schoolCollegeUniversity:
                    consultForm.schoolCollegeUniversity.trim(),
                  boardUniversity:
                    consultForm.boardUniversity.trim(),
                  passingYear:
                    consultForm.passingYear.trim(),
                  class10PercentageCGPA:
                    consultForm.class10PercentageCGPA.trim(),
                  class12PercentageCGPA:
                    consultForm.class12PercentageCGPA.trim(),

                  // Foreign Education
                  intendedStudyLevel:
                    consultForm.intendedStudyLevel,

                  preferredIntake:
                    consultForm.preferredIntake,

                  preferredCountries:
                    consultForm.preferredCountries,

                  preferredCountry:
                    selectedCountry?.name || "",

                  preferredCourseProgramme:
                    consultForm.courseInterest?.trim() || "",

                  preferredSpecialization:
                    consultForm.preferredSpecialization.trim(),

                  preferredUniversities:
                    consultForm.preferredUniversities.trim(),

                  openToAlternativeUniversities:
                    consultForm.openToAlternativeUniversities,

                  // Exams
                  englishTest:
                    consultForm.englishTest,

                  englishTestScoreDate:
                    consultForm.englishTestScoreDate.trim(),

                  otherEntranceExams:
                    consultForm.otherEntranceExams,

                  entranceExamScoreDate:
                    consultForm.entranceExamScoreDate.trim(),

                  // Career
                  preferredCareerDomain:
                    consultForm.preferredCareerDomain.trim(),

                  reasonToStudyAbroad:
                    consultForm.reasonToStudyAbroad.trim(),

                  topPriorities:
                    consultForm.topPriorities,

                  // Budget
                  annualTuitionBudget:
                    consultForm.annualTuitionBudget,

                  totalEducationBudget:
                    consultForm.totalEducationBudget,

                  scholarshipRequired:
                    consultForm.scholarshipRequired,

                  educationLoanRequired:
                    consultForm.educationLoanRequired,

                  // Passport
                  passportStatus:
                    consultForm.passportStatus,

                  passportExpiryDate:
                    consultForm.passportExpiryDate || null,

                  documentsAvailable:
                    consultForm.documentsAvailable,

                  // Services
                  servicesRequired:
                    consultForm.servicesRequired,

                  // Consultation
                  courseInterest:
                    consultForm.courseInterest?.trim() || "",

                  budgetRange:
                    consultForm.budgetRange?.trim() || "",

                  message:
                    consultForm.message.trim(),
                };


                console.log(
                  "Study Abroad Consultation Payload:",
                  payload
                );


                await createStudyAbroadConsultation(payload);


                /* ================= SUCCESS ================= */

                setSubmitted(true);
                setFormOpen(false);
                setSubmitError("");

                setConsultForm({
                  ...initialConsultForm,
                });


              } catch (error) {

                console.error(
                  "Study Abroad Consultation Error:",
                  error
                );

                setSubmitError(
                  error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    error?.message ||
                    "Failed to submit consultation. Please try again."
                );

              } finally {

                setSubmitting(false);

              }

            }}
            className="rounded-xl bg-[#9a2119] px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#7f1913] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Submitting..."
              : unlocked
              ? "Submit Consultation"
              : "Subscribe to Submit"}
          </button>

        </div>
      </div>

    </div>
  </div>
) : null}


      <UnlockRedirectModal
        open={Boolean(unlockModalItem)}
        title="Unlock Study Abroad"
        itemLabel={unlockModalItem}
        description="Your free study abroad access has already been used. Subscribe to unlock"
        onCancel={() => setUnlockModalItem(null)}
        onConfirm={() => {
          const returnTo = buildAbroadReturnTo(unlockModalItem);
          setUnlockModalItem(null);
          navigate(
            `/app/subscription?returnTo=${encodeURIComponent(returnTo)}`
          );
        }}
      />
    </ModuleScreen>
  );
}


  return (
    <ModuleScreen className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#9a2119]">Study Abroad</h1>
          <p className="mt-1 text-sm text-[#8c6c67]">Explore destinations and get a free consultation.</p>
          {loadError ? <p className="mt-2 text-sm font-semibold text-[#9a2119]">{loadError}</p> : null}
        </div>
        <PageHero backOnly onBack={goToDashboard} className="shrink-0" />
      </div>

      {/* Two-column layout: destination cards on the left, programs panel on the right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Left column — intro text + destination cards */}
        <div className="space-y-6 lg:order-1">
          <p className="text-sm leading-7 text-gray-700">{INTRO_TEXT}</p>

          <div className="content-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {countryList.map((country, index) => {
              const isPreviewMode = accessStatus === "preview";
              const isFree = !isPreviewMode || index < 4;

              return (
                <div
                  key={country.id || country.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!isFree) {
                      setUnlockModalItem(country.name);
                      return;
                    }
                    setSelectedCountry(country);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      if (!isFree) {
                        setUnlockModalItem(country.name);
                        return;
                      }
                      setSelectedCountry(country);
                    }
                  }}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-[26px] border border-[#f0e4e2] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#d9b5ad] hover:shadow-lg hover:shadow-[#9a2119]/10"
                >
                  <div className="flex flex-1 flex-col items-center px-5 pb-5 pt-7 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#f5d8d1] bg-[#fff7f5] text-2xl text-[#9a2119] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-[#9a2119] group-hover:text-white">
                      <GlobalOutlined />
                    </div>

                    <h3 className="m-0 mt-2 text-xl font-bold leading-tight text-[#241312] transition-colors group-hover:text-[#9a2119]">
                      {country.name}
                    </h3>

                    {!unlocked ? (
                       <div className={`absolute  right-3 flex h-8 w-8 items-center justify-center rounded-full ${isFree ? "bg-green-50" : "bg-red-50"}`}>
                {isFree ? <UnlockOutlined className="text-green-600" /> : <LockOutlined className="text-red-500" />}
              </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={(event) => handleCardConsult(country, isFree, event)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#9a2119] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#7f1913] hover:shadow-md"
                    >
                      Get Consultation
                      <ArrowRightOutlined className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column — programs panel (same for every destination, shown once here) */}
        <div className="motion-item space-y-6 rounded-[26px] border border-[#f0e4e2] bg-white p-6 shadow-sm lg:sticky lg:top-6 lg:order-2">
          <ProgramList icon={<BookOutlined />} title="Popular Undergraduate (UG) Programs" programs={UG_PROGRAMS} />

          <div className="border-t border-[#f0e4e2] pt-5">
            <ProgramList icon={<ReadOutlined />} title="Popular Postgraduate (PG) Programs" programs={PG_PROGRAMS} />
          </div>
        </div>
      </div>

      <UnlockRedirectModal
        open={Boolean(unlockModalItem)}
        title="Unlock Study Abroad"
        itemLabel={unlockModalItem}
        description="Your free study abroad access has already been used. Subscribe to unlock"
        onCancel={() => setUnlockModalItem(null)}
        onConfirm={() => {
          const returnTo = buildAbroadReturnTo(unlockModalItem);
          setUnlockModalItem(null);
          navigate(`/app/subscription?returnTo=${encodeURIComponent(returnTo)}`);
        }}
      />
    </ModuleScreen>
  );
}
