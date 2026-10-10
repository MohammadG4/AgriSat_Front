"use client";

import React from "react";

interface LoaderProps {
  /** Message shown below the spinner. Defaults to "Loading..." */
  message?: string;
  /** Controls the overall size variant */
  size?: "sm" | "md" | "lg";
  /** If true, the loader fills the full remaining viewport height */
  fullPage?: boolean;
}

/**
 * AgriSat global loader — a pulsing satellite-orbit ring
 * with an emerald gradient glow, used consistently across
 * every loading state in the application.
 */
export default function Loader({
  message = "Loading...",
  size = "md",
  fullPage = false,
}: LoaderProps) {
  const dims = { sm: 36, md: 52, lg: 72 }[size];
  const stroke = { sm: 3, md: 3.5, lg: 4 }[size];
  const fontSize = { sm: "0.78rem", md: "0.88rem", lg: "1rem" }[size];

  return (
    <div
      className={`agrisat-loader ${fullPage ? "agrisat-loader--full" : ""}`}
    >
      {/* Orbital ring spinner */}
      <div className="agrisat-loader__ring" style={{ width: dims, height: dims }}>
        <svg viewBox="0 0 50 50" className="agrisat-loader__svg">
          {/* Background track */}
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="rgba(16, 185, 129, 0.1)"
            strokeWidth={stroke}
          />
          {/* Spinning arc */}
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="url(#agrisat-loader-gradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray="80, 200"
            strokeDashoffset="0"
            className="agrisat-loader__arc"
          />
          <defs>
            <linearGradient id="agrisat-loader-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center pulsing dot */}
        <span className="agrisat-loader__dot" />
      </div>

      {/* Message */}
      {message && (
        <p className="agrisat-loader__msg" style={{ fontSize }}>
          {message}
        </p>
      )}
    </div>
  );
}
