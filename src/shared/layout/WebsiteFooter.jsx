import {
  FacebookFilled, GlobalOutlined,
  InstagramFilled, LinkedinFilled, YoutubeFilled,
  MailOutlined, PhoneOutlined, TeamOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

const socialLinks = [
  { Icon: YoutubeFilled,   label: "YouTube" , href: "https://www.youtube.com/@careermap2016" },
  { Icon: LinkedinFilled,  label: "LinkedIn" , href: "https://in.linkedin.com/company/career-map" },
  { Icon: InstagramFilled, label: "Instagram" , href: "https://www.instagram.com/thecareermaps/?igsh=MWFpbWJ1bmhxMG5ncA%3D%3D#" },
  { Icon: GlobalOutlined,  label: "Website"   , href: "https://x.com/identitygroup22?s=11" },
  { Icon: FacebookFilled,  label: "Facebook"  , href: "https://www.facebook.com/careermapbhubaneswar?rdid=uJ0Avr7n95yKhI94&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F19nX7dB9TX%2F#" },
];

const contactItems = [
  { Icon: MailOutlined,  label: "Email",  value: "connect@careermap.in" },
  { Icon: PhoneOutlined, label: "Phone",  value: "+91 97768 08179, +91 94372 08179" },
  { Icon: TeamOutlined,  label: "For",    value: "Students & parent career guidance" },
];

export default function WebsiteFooter() {
  return (
    <footer className="mt-10 overflow-hidden relative" style={{ background: "#9a2119", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>

      {/* SVG pattern background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {/* Diagonal lines */}
        {[-100,0,100,200,300,400,500,600,700].map((x, i) => (
          <line key={`d${i}`} x1={x} y1="0" x2={x+400} y2="400" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
        ))}
        {/* Cross diagonals */}
        {[900,800,700,600,500,400].map((x, i) => (
          <line key={`c${i}`} x1={x} y1="0" x2={x-400} y2="400" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
        ))}
        {/* Corner dark fill */}
        <polygon points="680,0 800,90 800,0" fill="rgba(0,0,0,0.08)"/>
        <polygon points="680,0 800,90 740,0" fill="rgba(255,255,255,0.04)"/>
        {/* Dot grid top-right */}
        {[30,50,70].map((cy, ri) =>
          [620,640,660,680].map((cx, ci) => (
            <circle key={`dot${ri}${ci}`} cx={cx} cy={cy} r="1.5" fill={`rgba(255,255,255,${0.18 - ri*0.05})`}/>
          ))
        )}
        {/* Top-left accent lines */}
        <line x1="0" y1="1" x2="80" y2="1" stroke="rgba(255,255,255,0.22)" strokeWidth="2"/>
        <line x1="0" y1="5" x2="40" y2="5" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      </svg>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-between gap-12 px-14 pb-10 pt-12">

        {/* Left */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", marginBottom: 8 }}>
            Career Map
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.55, maxWidth: 260, marginBottom: 32 }}>
            Shaping futures, one step at a time.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
  {socialLinks.map(({ Icon, label }) => (
    <a
      key={label}
      href={socialLinks.find(link => link.label === label)?.href || ""}
      aria-label={label}
      style={{
        width: 42,
        height: 42,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.85)",
        fontSize: 18,
        textDecoration: "none",
        transition: "all 0.25s ease",
        backdropFilter: "blur(6px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.22)";
        e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
        e.currentTarget.style.boxShadow =
          "0 8px 20px rgba(0,0,0,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <Icon />
    </a>
  ))}
</div>
        </div>

        {/* Vertical divider */}
        <div style={{ width: 1, height: 130, background: "rgba(255,255,255,0.14)", flexShrink: 0 }} />

        {/* Right */}
        <div style={{ flexShrink: 0, minWidth: 280 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", marginBottom: 20 }}>
            Reach Us
          </div>
          {contactItems.map(({ Icon, label, value }) => (
            <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "rgba(255,255,255,0.7)", fontSize: 15 }}>
                <Icon />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.88)", lineHeight: 1.5 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 flex items-center justify-between flex-wrap gap-3 px-14 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>© 2026 Career Map. All rights reserved. Developed by Seereon Consulting & IT Services</div>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy Policy", "Terms of Service", "Support"].map(label => (
            <Link key={label} to="#"
              style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", textDecoration: "none", transition: "color .15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.38)"}
            >{label}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}