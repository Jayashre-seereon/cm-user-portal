import React from "react";
import Logo from "../../asset/logo_white.png";
export default function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center">
      <img
        src={Logo}
        alt="Career Map"
        className={`${compact ? "h-10 w-auto max-w-[120px]" : "h-12 w-auto max-w-[160px] md:h-14 md:max-w-[190px]"} object-contain`}
      />
    </div>
  );
}
