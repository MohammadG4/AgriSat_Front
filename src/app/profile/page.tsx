"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Satellite,
  CheckCircle2,
  Clock,
  Layers,
  Activity,
  Bell,
  LogIn,
  Key,
} from "lucide-react";
import Loader from "@/components/Loader";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout, refreshUser } = useAuth();
  const { t, locale } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return <Loader fullPage size="lg" message={t("profile.retrievingCredentials")} />;
  }

  if (!user) {
    return (
      <div
        className="container"
        style={{
          padding: "80px 24px",
          maxWidth: "500px",
          textAlign: "center",
        }}
      >
        <div className="card" style={{ padding: "40px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto",
              color: "var(--primary)",
            }}
          >
            <ShieldAlert size={28} />
          </div>
          <h2
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              marginBottom: "10px",
              color: "var(--text-main)",
            }}
          >
            {t("profile.notLoggedInTitle")}
          </h2>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              marginBottom: "28px",
              lineHeight: 1.6,
            }}
          >
            {t("profile.notLoggedInDesc")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link href="/login" className="btn btn-primary" style={{ width: "100%" }}>
              <LogIn size={18} />
              <span>{t("profile.signInBtn")}</span>
            </Link>
            <Link href="/register" className="btn btn-secondary" style={{ width: "100%" }}>
              <span>{t("home.ctaRegister")}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const initials =
    user.first_name || user.last_name
      ? `${(user.first_name?.[0] || "").toUpperCase()}${(
          user.last_name?.[0] || ""
        ).toUpperCase()}`
      : user.email.slice(0, 2).toUpperCase();

  const formattedCreated = user.created_at
    ? new Date(user.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : t("profile.activeVerified");

  const formattedUpdated = user.updated_at
    ? new Date(user.updated_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : t("common.active");

  return (
    <div className="container" style={{ padding: "40px 24px 60px 24px" }}>
      {/* Top Banner Card */}
      <div
        className="card"
        style={{
          marginBottom: "32px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          padding: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "14px",
              backgroundColor: "var(--bg-surface)",
              border: "2px solid var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--primary)",
              letterSpacing: "0.05em",
            }}
          >
            {initials}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <h1
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  color: "var(--text-main)",
                  letterSpacing: "-0.01em",
                }}
              >
                {user.first_name || user.last_name
                  ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                  : "Agronomist Operator"}
              </h1>

              {user.is_active ? (
                <span className="badge badge-success">
                  <CheckCircle2 size={12} /> {t("common.active")}
                </span>
              ) : (
                <span className="badge badge-warning">{t("common.inactive")}</span>
              )}

              {user.is_verified ? (
                <span className="badge badge-success">
                  <ShieldCheck size={12} /> {t("profile.activeVerified")}
                </span>
              ) : (
                <span className="badge badge-neutral">Unverified</span>
              )}
            </div>

            <div
              style={{
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Mail size={15} color="var(--text-dim)" />
              <span>{user.email}</span>
              <span style={{ color: "var(--border-subtle)" }}>|</span>
              <span>{t("profile.userId")}: #{user.id}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
            title={t("profile.refreshBtn")}
            disabled={isRefreshing}
          >
            <span>{isRefreshing ? t("common.loading") : t("profile.refreshBtn")}</span>
          </button>
          <button onClick={handleLogout} className="btn btn-danger">
            <LogOut size={16} />
            <span>{t("profile.signOutBtn")}</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Account Details + Satellite Status */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Personal Credentials */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <UserIcon size={20} color="var(--primary)" />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              {t("profile.personalInfo")}
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <div
                style={{
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
              >
                {t("profile.fullName")}
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--text-main)" }}>
                {user.first_name || user.last_name
                  ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                  : "—"}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
              >
                {t("profile.email")}
              </div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Mail size={16} color="var(--primary)" />
                {user.email}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
              >
                {t("profile.phone")}
              </div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Phone size={16} color="var(--primary)" />
                {user.phone_number || "—"}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
              >
                {t("common.date")}
              </div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Calendar size={16} color="var(--primary)" />
                {user.date_of_birth || "—"}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
              >
                {t("profile.memberSince")}
              </div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Clock size={16} color="var(--primary)" />
                {formattedCreated}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <Shield size={20} color="var(--primary)" />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              {t("profile.platformOverview")}
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <div
                style={{
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
              >
                {t("profile.serviceAccessTitle")}
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--text-main)" }}>
                {t("profile.serviceAccessDesc")}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
              >
                {t("profile.landsAccessTitle")}
              </div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "var(--text-main)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Key size={16} color="var(--primary)" />
                {t("profile.landsAccessDesc")}
              </div>
            </div>

            <div
              style={{
                marginTop: "8px",
                padding: "12px",
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.825rem",
                color: "var(--text-muted)",
              }}
            >
              FastAPI OAuth2 Engine &bull; Bearer JWT HS256 &bull; Bcrypt Cryptographic Hash
            </div>
          </div>
        </div>

        {/* Telemetry and Monitoring Access */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <Satellite size={20} color="var(--primary)" />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              {t("nav.service")}
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Layers size={18} color="var(--primary)" />
                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Sentinel Hub Pipeline</span>
              </div>
              <span className="badge badge-success">{t("common.active")}</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Activity size={18} color="var(--primary)" />
                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>NDVI, NDRE, NDWI</span>
              </div>
              <span className="badge badge-success">{t("common.active")}</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Bell size={18} color="var(--primary)" />
                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{t("alertOptions.title")}</span>
              </div>
              <span className="badge badge-neutral">{t("alertOptions.active")}</span>
            </div>

            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link
                href="/service"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Satellite size={16} />
                <span>{t("home.ctaExplore")}</span>
              </Link>
              <Link
                href="/lands"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Layers size={16} />
                <span>{t("lands.title")}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
