"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
    return <Loader fullPage size="lg" message="Retrieving user credentials..." />;
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
            Session Authentication Required
          </h2>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              marginBottom: "28px",
              lineHeight: 1.6,
            }}
          >
            You must be logged in to inspect your operator profile and satellite monitoring telemetry.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link href="/login" className="btn btn-primary" style={{ width: "100%" }}>
              <LogIn size={18} />
              <span>Go to Sign In</span>
            </Link>
            <Link href="/register" className="btn btn-secondary" style={{ width: "100%" }}>
              <span>Create New Account</span>
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
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Active Member";

  const formattedUpdated = user.updated_at
    ? new Date(user.updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Current Session";

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
                  <CheckCircle2 size={12} /> Active
                </span>
              ) : (
                <span className="badge badge-warning">Inactive</span>
              )}

              {user.is_verified ? (
                <span className="badge badge-success">
                  <ShieldCheck size={12} /> Verified
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
              <span>Operator ID #{user.id}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
            title="Refresh Account Data"
            disabled={isRefreshing}
          >
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
          <button onClick={handleLogout} className="btn btn-danger">
            <LogOut size={16} />
            <span>Sign Out</span>
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
              Account Information
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
                Full Name
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--text-main)" }}>
                {user.first_name || user.last_name
                  ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                  : "Not configured"}
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
                Registered Email
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
                Contact Phone
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
                {user.phone_number || "Not specified"}
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
                Date of Birth
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
                {user.date_of_birth || "Not specified"}
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
                Registration Date
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
              Security and Authorization
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
                Authentication Protocol
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--text-main)" }}>
                OAuth2 Password Bearer with JWT HS256
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
                Password Status
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
                Bcrypt Cryptographic Hash (Secured)
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
                Session Life
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--text-main)" }}>
                8 Days Refresh Window
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
                Last Synchronized
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--text-main)" }}>
                {formattedUpdated}
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
              Account security conforms to FastAPI RBAC policies. All requests are authenticated with a signed bearer header.
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
              Satellite Telemetry Access
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
              <span className="badge badge-success">Online</span>
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
                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Indices Engine (NDVI, NDRE)</span>
              </div>
              <span className="badge badge-success">Active</span>
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
                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Crop Anomaly Alerts</span>
              </div>
              <span className="badge badge-neutral">Enabled</span>
            </div>

            <div style={{ marginTop: "8px" }}>
              <Link
                href="/"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Return to Overview
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
