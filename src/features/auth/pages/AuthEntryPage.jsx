import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Space } from "antd";
import { Link } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";

export default function AuthEntryPage() {
  return (
    <AuthShell title="Welcome to Career Map" subtitle="Choose how you want to continue into the user portal.">
      <div style={{ display: "grid", gap: "12px" }}>
        <Link to="/onboarding?source=auth-entry" className="cm-entry-card">
          <Space size={16} align="start">
            <div
              style={{
                background: "linear-gradient(135deg, #9a2119, #c0392b)",
                color: "#fff",
                borderRadius: "14px",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              <UserOutlined />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#1a0a09", marginBottom: "3px" }}>New User</div>
              <div style={{ fontSize: "13px", color: "#888" }}>Start onboarding, verify OTP, and create your profile.</div>
            </div>
          </Space>
        </Link>
        <Link to="/login?userType=existing" className="cm-entry-card">
          <Space size={16} align="start">
            <div
              style={{
                background: "#f7ece8",
                color: "#9a2119",
                borderRadius: "14px",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              <LockOutlined />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#1a0a09", marginBottom: "3px" }}>Existing User</div>
              <div style={{ fontSize: "13px", color: "#888" }}>Login with OTP or email and password.</div>
            </div>
          </Space>
        </Link>
      </div>
    </AuthShell>
  );
}
