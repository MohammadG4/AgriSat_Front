"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Satellite, Shield, Cpu, Globe } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  if (pathname === "/service") {
    return null;
  }
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-subtle)",
        backgroundColor: "var(--bg-surface)",
        padding: "40px 0 24px 0",
        marginTop: "auto",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "32px",
            marginBottom: "36px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <Satellite size={20} color="var(--primary)" />
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  color: "var(--text-main)",
                }}
              >
                AgriSat
              </span>
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                lineHeight: 1.6,
              }}
            >
              Multispectral satellite analytics platform for precision crop monitoring, vegetation index analysis, and yield optimization.
            </p>
          </div>

          <div>
            <h4
              style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "var(--text-main)",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              System Capabilities
            </h4>
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
              }}
            >
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Cpu size={14} color="var(--primary)" /> Sentinel 2 MSI Processing
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Globe size={14} color="var(--primary)" /> NDVI, NDRE, NDWI, EVI Indices
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={14} color="var(--primary)" /> Anomaly and Stress Detection
              </li>
            </ul>
          </div>

          <div>
            <h4
              style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "var(--text-main)",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Architecture
            </h4>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                lineHeight: 1.6,
              }}
            >
              FastAPI asynchronous backend connected with Sentinel Hub Copernicus Data Space Ecosystem and modern Next.js frontend.
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "20px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.8rem",
            color: "var(--text-dim)",
            gap: "12px",
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} AgriSat Crop Intelligence Platform. All rights reserved.
          </div>
          <div>
            System Version 1.0.0 (FastAPI Core / Next.js)
          </div>
        </div>
      </div>
    </footer>
  );
}
