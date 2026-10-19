import { Typography } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Bee from "../../../asset/bee.png";

const { Paragraph, Title } = Typography;

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/auth-entry", { replace: true }), 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #9a2119 0%, #c0392b 55%, #7b1a13 100%)",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {[400, 280, 180].map((size, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: size,
            height: size,
            borderRadius: "50%",
            border: `1px solid rgba(255,255,255,${0.06 + index * 0.03})`,
            pointerEvents: "none",
          }}
        />
      ))}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div
          style={{
            width: "96px",
            height: "96px",
            borderRadius: "28px",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
          }}
        >
          <img src={Bee} alt="Career Map" style={{ width: "60px", height: "60px", objectFit: "contain" }} />
        </div>
        <Title className="!mb-2 !text-white" style={{ fontFamily: "'Georgia', serif", letterSpacing: "-0.5px" }}>
          Career Map
        </Title>
        <Paragraph className="!mb-8 !text-white/75" style={{ fontSize: "15px" }}>
          Discover Your Future
        </Paragraph>
        <div style={{ margin: "0 auto", height: "4px", width: "180px", borderRadius: "100px", background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: "60%",
              borderRadius: "100px",
              background: "rgba(255,255,255,0.85)",
              animation: "splash-bar 1.6s ease-in-out infinite",
            }}
          />
        </div>
        <style>{`@keyframes splash-bar { 0% { transform: translateX(-150%); } 100% { transform: translateX(300%); } }`}</style>
      </div>
    </div>
  );
}
