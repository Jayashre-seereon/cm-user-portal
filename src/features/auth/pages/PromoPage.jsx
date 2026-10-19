import { Alert, Button, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../../state/AppStateContext";
import { AuthShell } from "../components/AuthShell";
import { authPrimaryButtonStyle } from "../components/authShared";

export default function PromoPage() {
  const navigate = useNavigate();
  const { clearPromoMessage, promoMessage } = useAppState();

  return (
    <AuthShell title="What You Can Explore" subtitle="Everything you need for career guidance." backTo="/profile-setup">
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {promoMessage ? <Alert type="success" title={promoMessage} afterClose={clearPromoMessage} closable style={{ borderRadius: "12px" }} /> : null}
        <div style={{ display: "grid", gap: "10px" }}>
          {[
            ["Psychometric Tests", "Discover strengths and ideal fit.", "PT"],
            ["Career Archive", "500+ career options across streams.", "CL"],
            ["Expert Mentors", "Guidance from counsellors and experts.", "EM"],
            ["Scholarships & Exams", "Stay updated on opportunities.", "SE"],
            ["Study Abroad", "Explore international education paths.", "SA"],
          ].map(([title, desc, icon]) => (
            <div key={title} className="cm-promo-item">
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#fdf5f4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#9a2119",
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "#1a0a09" }}>{title}</div>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{desc}</div>
              </div>
              <div style={{ color: "#9a2119", fontSize: "16px", flexShrink: 0 }}>{"->"}</div>
            </div>
          ))}
        </div>
        <Button type="primary" block size="large" onClick={() => navigate("/app/dashboard")} style={authPrimaryButtonStyle}>
          Next
        </Button>
      </Space>
    </AuthShell>
  );
}
