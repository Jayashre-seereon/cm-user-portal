import { Button } from "antd";
import { Navigate, useLocation, useNavigate, useParams, useRouteError } from "react-router-dom";

function FallbackScreen({ title, message, children }) {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div style={{ maxWidth: 440 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#1a0a09" }}>{title}</h1>
        <p style={{ margin: "12px 0 24px", color: "#756965", fontSize: 15, lineHeight: 1.6 }}>{message}</p>
        {children}
      </div>
    </div>
  );
}

const primaryButtonStyle = { background: "#9a2119", borderColor: "#9a2119", borderRadius: 10, height: 44, fontWeight: 700 };

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <FallbackScreen title="Page not found" message="The page you are looking for does not exist or may have been moved.">
      <Button type="primary" style={primaryButtonStyle} onClick={() => navigate("/app/dashboard", { replace: true })}>
        Go to dashboard
      </Button>
    </FallbackScreen>
  );
}

export function RouteErrorPage() {
  const error = useRouteError();

  if (import.meta.env.DEV) {
    console.error("Route error:", error);
  }

  return (
    <FallbackScreen title="Something went wrong" message="An unexpected error occurred. Please reload the page or go back to your dashboard.">
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Button type="primary" style={primaryButtonStyle} onClick={() => window.location.reload()}>
          Reload
        </Button>
        <Button style={{ borderRadius: 10, height: 44, fontWeight: 700 }} onClick={() => window.location.assign("/app/dashboard")}>
          Go to dashboard
        </Button>
      </div>
    </FallbackScreen>
  );
}

// Redirects a legacy alias route to its canonical path, filling in route params.
export function RedirectTo({ to }) {
  const params = useParams();
  const location = useLocation();
  const target = to.replace(/:(\w+)/g, (_, key) => encodeURIComponent(params[key] ?? ""));

  return <Navigate to={`${target}${location.search || ""}`} replace />;
}
