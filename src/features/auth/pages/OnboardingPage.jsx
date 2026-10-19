import { ArrowRightOutlined, UserOutlined,TeamOutlined,ReadOutlined, BackwardOutlined, ArrowLeftOutlined,SmileOutlined } from "@ant-design/icons";
import { Button, Form, Input, Space, Typography ,Select} from "antd";
import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Bee from "../../../asset/bee.png";
import { onboardingOptions } from "../../../data/careermapData";
import { useAppState } from "../../../state/AppStateContext";
import { useAuthStore } from "../../../store/authStore";
import { AuthShell } from "../components/AuthShell";

const { Title } = Typography;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authenticated, saveOnboarding } = useAppState();
  const pendingInstituteOnboarding = useAuthStore((state) => state.pendingInstituteOnboarding);
  const setPendingInstituteOnboarding = useAuthStore((state) => state.setPendingInstituteOnboarding);
  const canEnterFromAuthEntry = searchParams.get("source") === "auth-entry";
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    userType: "",
    name: "",
    gender: "", 
    childName: "",
    selectedClass: "",
    selectedStream: "",
    otherClass: "",
    otherStream: "",
    selectedInterests: [],
    selectedClarity: "",
    selectedStrengths: [],
    selectedPriorities: [],
  });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleArray(key, value) {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }));
  }

  if (!pendingInstituteOnboarding && !canEnterFromAuthEntry) {
    return <Navigate to={authenticated ? "/app/dashboard" : "/auth-entry"} replace />;
  }

  function canContinue() {
    if (step === 0) return Boolean(form.userType);
  if (step === 2) return Boolean(form.name.trim()) && Boolean(form.gender);

if (step === 3 && form.userType === "parent")
  return Boolean(form.childName.trim());

if (step === 3 && form.userType === "student")
  return Boolean(form.selectedClass) &&
    (form.selectedClass !== "Other" || Boolean(form.otherClass.trim()));   if (step === 4 && form.userType === "student") return Boolean(form.selectedStream) && (form.selectedStream !== "Other" || Boolean(form.otherStream.trim()));
    if (step === 4 && form.userType === "parent") return Boolean(form.selectedClass) && (form.selectedClass !== "Other" || Boolean(form.otherClass.trim()));
    if (step === 5 && form.userType === "student") return form.selectedInterests.length > 0;
    if (step === 5 && form.userType === "parent") return Boolean(form.selectedStream) && (form.selectedStream !== "Other" || Boolean(form.otherStream.trim()));
    if (step === 6 && form.userType === "parent")
  return form.selectedPriorities.length > 0;
   if (step === 6 && form.userType === "student")
  return Boolean(form.selectedClarity);

if (step === 7 && form.userType === "student")
  return form.selectedStrengths.length > 0;

if (step === 8 && form.userType === "student")
  return form.selectedPriorities.length > 0;   return true;
  }

 function next() {
  if (form.userType === "parent") {
    if (step === 6) {
      saveOnboarding({ ...form, selectedGuidance: "" });
      setStep(9); // Go directly to success screen
      return;
    }
  }

  if (step === 8) {
    saveOnboarding({ ...form, selectedGuidance: "" });
    setStep(9);
    return;
  }

  if (step === 9) {
    if (pendingInstituteOnboarding || authenticated) {
      setPendingInstituteOnboarding(false);
      navigate("/app/dashboard", { replace: true });
      return;
    }

    navigate("/login");
    return;
  }

  setStep((current) => current + 1);
}

  const multiGrid = (items, key) => (
    <div className="cm-grid-btn" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
      {items.map((item) => (
        <Button
          key={item}
          block
          size="large"
          type={form[key].includes(item) ? "primary" : "default"}
          style={{ height: "auto", borderRadius: "12px", padding: "12px 10px", textAlign: "left", whiteSpace: "normal", lineHeight: "1.4", fontWeight: "600", fontSize: "13px" }}
          onClick={() => toggleArray(key, item)}
        >
          {item}
        </Button>
      ))}
    </div>
  );

  const singleGrid = (items, key) => (
    <div className="cm-grid-btn" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
      {items.map((item) => (
        <Button
          key={item}
          block
          size="large"
          type={form[key] === item ? "primary" : "default"}
          style={{ height: "auto", borderRadius: "12px", padding: "12px 10px", textAlign: "left", whiteSpace: "normal", lineHeight: "1.4", fontWeight: "600", fontSize: "13px" }}
          onClick={() => update(key, item)}
        >
          {item}
        </Button>
      ))}
    </div>
  );

  const getTitle = () => {
  if (form.userType === "parent") {
    switch (step) {
      case 2: return "Name";
      case 3: return "Child Name";
      case 4: return "Child Class";
      case 5: return "Stream";
      case 6: return "Priority";
      default: return "";
    }
  }

  switch (step) {
    case 2: return "Name";
    case 3: return "Class";
    case 4: return "Stream";
    case 5: return "Interests";
    case 6: return "Clarity";
    case 7: return "Strengths";
    case 8: return "Priority";
    default: return "";
  }
};

const getQuestion = () => {
  if (form.userType === "parent") {
    switch (step) {
      case 2: return "What's your name?";
      case 3: return "What is your child's name?";
      case 4: return "Which class is your child currently studying in?";
      case 5: return "What stream is your child interested in?";
      case 6: return "What matters most for your child's career?";
      default: return "";
    }
  }

  switch (step) {
    case 2: return "What's your name?";
    case 3: return "Which class are you in?";
    case 4: return "What is your preferred stream?";
    case 5: return "What are your interests?";
    case 6: return "How clear are you about your direction?";
    case 7: return "What are your core strengths?";
    case 8: return "What matters most to you in a career?";
    default: return "";
  }
};
  return (
    <AuthShell title="Choose Your Roadmap" subtitle="Tell us a little about yourself so we can personalize the full portal experience." backTo="/auth-entry">
<h3
  style={{
    fontWeight: "700",
    textAlign: "center",
    color: "#9a2119",
    marginBottom: "8px",
  }}
>
  {getTitle()}
</h3>

<div
  style={{
    fontSize: "14px",
    fontWeight: "600",
    color: "#595656",
    marginBottom: "12px",
  }}
>
  {getQuestion()}
</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {step === 0 ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
           
            <div style={{ display: "grid", gap: "10px" }}>
              {[
                ["student", <ReadOutlined />, "I'm a Student"],
                ["parent", <TeamOutlined />, "I'm a Parent"],
              ].map(([value, icon, label]) => (
                <div
                  key={value}
                  onClick={() => update("userType", value)}
                  style={{
                    borderRadius: "14px",
                    padding: "14px 18px",
                    cursor: "pointer",
                    border: `2px solid ${form.userType === value ? "#9a2119" : "#ede8e7"}`,
                    background: form.userType === value ? "#fdf5f4" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: form.userType === value ? "linear-gradient(135deg, #9a2119, #c0392b)" : "#f7ece8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: form.userType === value ? "#fff" : "#9a2119",
                      fontSize: "16px",
                    }}
                  >
                    {icon}
                  </div>
                  <div style={{ fontWeight: "700", color: "#1a0a09", fontSize: "15px" }}>{label}</div>
                  {form.userType === value ? <div style={{ marginLeft: "auto", color: "#9a2119", fontWeight: "900" }}>✓</div> : null}
                </div>
              ))}
            </div>
          </Space>
        ) : null}

        {step === 1 ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div
              style={{
               
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                     }}
            >
              <img src={Bee} alt="Bee" style={{ width: "100px", height: "100px", objectFit: "contain" }} />
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#1a0a09", marginBottom: "8px", fontFamily: "'Georgia', serif" }}>
              {form.userType === "parent"
                ? "Welcome, Parent!"
                : form.userType === "student"
                  ? "Hi! I'm your Career Guide"
                  : "Hello! Let's personalize your experience"}
            </div>
            <div style={{ fontSize: "14px", color: "#888", lineHeight: "1.6", maxWidth: "300px", margin: "0 auto" }}>
              {form.userType === "parent"
                ? "We'll help you explore career options for your child's future."
                : form.userType === "student"
                  ? "We'll help you discover the best career path and portal modules for your goals."
                  : "Tell us a little about yourself so we can personalize your portal experience."}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <Form layout="vertical" className="cm-form-label">
            <Form.Item >
              <Input
                className="cm-input-field"
                prefix={<UserOutlined style={{ color: "#9a2119" }} />}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                size="large"
                style={{ borderRadius: "10px" }}
              />
            </Form.Item>
             <Form.Item label="Gender">
      <Select
       className="cm-input-field"
        prefix={<SmileOutlined style={{ color: "#9a2119" }} />}
        value={form.gender}
        onChange={(value) => update("gender", value)}
        size="large"
        style={{ borderRadius: "10px" }}
        placeholder="Select gender"
        style={{ borderRadius: "10px" }}
        options={[
          { label: "Male", value: "male" },
          { label: "Female", value: "female" },
          { label: "Other", value: "other" },
        ]}
      />
    </Form.Item>
          </Form>
        ) : null}

        {step === 3 && form.userType === "student" ? (
          <div>
            {singleGrid(onboardingOptions.studentClassOptions, "selectedClass")}
            {form.selectedClass === "Other" ? (
              <Form layout="vertical" className="cm-form-label" style={{ marginTop: "14px" }}>
                <Form.Item label="Please specify your class">
                  <Input className="cm-input-field" value={form.otherClass} onChange={(event) => update("otherClass", event.target.value)} style={{ borderRadius: "10px" }} />
                </Form.Item>
              </Form>
            ) : null}
          </div>
        ) : null}

        {step === 3 && form.userType === "parent" ? (
          <Form layout="vertical" className="cm-form-label">
            <Form.Item >
              <Input
                className="cm-input-field"
                prefix={<UserOutlined style={{ color: "#9a2119" }} />}
                value={form.childName}
                onChange={(event) => update("childName", event.target.value)}
                size="large"
                style={{ borderRadius: "10px" }}
              />
            </Form.Item>
          </Form>
        ) : null}

        {step === 4 && form.userType === "student" ? (
          <div>
            {singleGrid(onboardingOptions.streamOptions, "selectedStream")}
            {form.selectedStream === "Other" ? (
              <Form layout="vertical" className="cm-form-label" style={{ marginTop: "14px" }}>
                <Form.Item label="Please specify your stream">
                  <Input className="cm-input-field" value={form.otherStream} onChange={(event) => update("otherStream", event.target.value)} style={{ borderRadius: "10px" }} />
                </Form.Item>
              </Form>
            ) : null}
          </div>
        ) : null}

        {step === 4 && form.userType === "parent" ? (
          <div>
            {singleGrid(onboardingOptions.studentClassOptions, "selectedClass")}
            {form.selectedClass === "Other" ? (
              <Form layout="vertical" className="cm-form-label" style={{ marginTop: "14px" }}>
                <Form.Item label="Please specify your child's class">
                  <Input className="cm-input-field" value={form.otherClass} onChange={(event) => update("otherClass", event.target.value)} style={{ borderRadius: "10px" }} />
                </Form.Item>
              </Form>
            ) : null}
          </div>
        ) : null}

        {step === 5 && form.userType === "student" ? multiGrid(onboardingOptions.interestOptions, "selectedInterests") : null}

        {step === 5 && form.userType === "parent" ? (
          <div>
            {singleGrid(onboardingOptions.streamOptions, "selectedStream")}
            {form.selectedStream === "Other" ? (
              <Form layout="vertical" className="cm-form-label" style={{ marginTop: "14px" }}>
                <Form.Item label="Please specify your stream">
                  <Input className="cm-input-field" value={form.otherStream} onChange={(event) => update("otherStream", event.target.value)} style={{ borderRadius: "10px" }} />
                </Form.Item>
              </Form>
            ) : null}
          </div>
        ) : null}

      {step === 6 && form.userType === "student"
  ? singleGrid(onboardingOptions.clarityOptions, "selectedClarity")
  : null}

{step === 7 && form.userType === "student"
  ? multiGrid(onboardingOptions.strengthOptions, "selectedStrengths")
  : null}

{(step === 8 && form.userType === "student") ||
 (step === 6 && form.userType === "parent")
  ? multiGrid(onboardingOptions.priorityOptions, "selectedPriorities")
  : null}
        {step === 9 ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #9a2119, #c0392b)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                boxShadow: "0 8px 24px rgba(154,33,25,0.25)",
                fontSize: "32px",
                color: "#fff",
              }}
            >
              ✓
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#1a0a09", marginBottom: "8px", fontFamily: "'Georgia', serif" }}>
              Great! We&apos;ve personalized your experience
            </div>
            <div style={{ fontSize: "14px", color: "#888", lineHeight: "1.6" }}>
              Your career journey is ready. Let&apos;s sign you in to get started.
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #f0e8e6" }}>
          <Button
          icon={<ArrowLeftOutlined/>}
          
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            style={{ borderRadius: "10px", fontWeight: "700", borderColor: "#e2d5d4", color: "#4a2020" }}
          >
            Previous
          </Button>
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={next}
            disabled={!canContinue()}
          
            style={{ borderRadius: "10px", fontWeight: "700", minWidth: "100px", background: "linear-gradient(135deg, #9a2119, #c0392b)", borderColor: "#9a2119" ,color:"#fff"}}
          >
           {
  step === 9
    ? "Continue"
    : (form.userType === "parent" && step === 6) ||
      (form.userType === "student" && step === 8)
    ? "Finish"
    : "Next"
} </Button>
        </div>
      </div>
    </AuthShell>
  );
}
