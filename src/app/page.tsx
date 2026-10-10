"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Satellite,
  LogIn,
  UserPlus,
  User as UserIcon,
  CheckCircle2,
  ArrowRight,
  Shield,
  Activity,
  Layers,
  MapPin,
  Cpu,
  BarChart3,
  Droplets,
  Sprout,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div style={{ flex: 1 }}>
      {/* Hero Section */}
      <section
        style={{
          padding: "72px 0 64px 0",
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-main)",
        }}
      >
        <div className="container">
          <div style={{ maxWidth: "820px", margin: "0 auto", textAlign: "center" }}>
            {/* Top pill badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "9999px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.825rem",
                fontWeight: 600,
                color: "var(--primary)",
                marginBottom: "24px",
              }}
            >
              <Satellite size={16} />
              <span>{t("home.badge")}</span>
            </div>

            <h1
              style={{
                fontSize: "2.75rem",
                fontWeight: 800,
                color: "var(--text-main)",
                lineHeight: 1.2,
                letterSpacing: "-0.03em",
                marginBottom: "20px",
              }}
            >
              {t("home.heroTitle")}
            </h1>

            <p
              style={{
                fontSize: "1.1rem",
                color: "var(--text-muted)",
                lineHeight: 1.6,
                marginBottom: "36px",
                maxWidth: "680px",
                marginRight: "auto",
                marginLeft: "auto",
              }}
            >
              {t("home.heroSubtitle")}
            </p>

            {/* CTA Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              {user ? (
                <>
                  <Link
                    href="/service"
                    className="btn btn-primary"
                    style={{ padding: "12px 24px", fontSize: "1rem" }}
                  >
                    <Satellite size={18} />
                    <span>{t("home.ctaExplore")}</span>
                  </Link>
                  <Link
                    href="/profile"
                    className="btn btn-secondary"
                    style={{ padding: "12px 24px", fontSize: "1rem" }}
                  >
                    <UserIcon size={18} />
                    <span>{t("home.ctaProfile")}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="btn btn-primary"
                    style={{ padding: "12px 26px", fontSize: "1rem" }}
                  >
                    <UserPlus size={18} />
                    <span>{t("home.ctaRegister")}</span>
                    <ArrowRight size={16} className="icon-flip" />
                  </Link>
                  <Link
                    href="/login"
                    className="btn btn-secondary"
                    style={{ padding: "12px 24px", fontSize: "1rem" }}
                  >
                    <LogIn size={18} />
                    <span>{t("home.ctaSignIn")}</span>
                  </Link>
                </>
              )}
            </div>

            {/* Spec highlights */}
            <div
              style={{
                marginTop: "48px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "32px",
                flexWrap: "wrap",
                fontSize: "0.85rem",
                color: "var(--text-dim)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={16} color="var(--primary)" />
                <span>{t("home.statResolution")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={16} color="var(--primary)" />
                <span>{t("home.statRevisit")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={16} color="var(--primary)" />
                <span>{t("home.statTelemetry")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section style={{ padding: "64px 0", backgroundColor: "var(--bg-surface)" }}>
        <div className="container">
          <div style={{ marginBottom: "40px", textAlign: "center" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "var(--text-main)",
                marginBottom: "8px",
              }}
            >
              {t("home.capabilitiesTitle")}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              {t("footer.brandDesc")}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Card 1 */}
            <div className="card">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                  marginBottom: "16px",
                }}
              >
                <Sprout size={22} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>
                {t("home.capIndicesTitle")}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                {t("home.capIndicesDesc")}
              </p>
            </div>

            {/* Card 2 */}
            <div className="card">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#38BDF8",
                  marginBottom: "16px",
                }}
              >
                <Droplets size={22} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>
                {t("home.capSentinelTitle")}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                {t("home.capSentinelDesc")}
              </p>
            </div>

            {/* Card 3 */}
            <div className="card">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#F59E0B",
                  marginBottom: "16px",
                }}
              >
                <Activity size={22} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>
                {t("home.capAlertsTitle")}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                {t("home.capAlertsDesc")}
              </p>
            </div>

            {/* Card 4 */}
            <div className="card">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#A855F7",
                  marginBottom: "16px",
                }}
              >
                <MapPin size={22} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>
                {t("home.capSpatialTitle")}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                {t("home.capSpatialDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Backend Integration Banner */}
      <section style={{ padding: "48px 0", borderTop: "1px solid var(--border-subtle)" }}>
        <div className="container">
          <div
            className="card"
            style={{
              padding: "32px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
              >
                {t("home.badge")}
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "6px" }}>
                {t("home.readyTitle")}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "560px" }}>
                {t("home.readySubtitle")}
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Link href="/register" className="btn btn-primary">
                <UserPlus size={16} />
                <span>{t("home.registerNowBtn")}</span>
              </Link>
              <Link href="/login" className="btn btn-secondary">
                <LogIn size={16} />
                <span>{t("home.ctaSignIn")}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
