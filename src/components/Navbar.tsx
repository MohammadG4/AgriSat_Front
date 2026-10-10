"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Satellite,
  User as UserIcon,
  LogOut,
  LogIn,
  UserPlus,
  Globe,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, locale, toggleLocale } = useLanguage();

  if (pathname === "/service/register-land") {
    return null;
  }

  return (
    <header
      style={{
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "70px",
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              backgroundColor: "var(--primary-light)",
              border: "1px solid var(--primary)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
            }}
          >
            <Satellite size={20} />
          </div>
          <div>
            <div
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                letterSpacing: "0.02em",
                color: "var(--text-main)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              AgriSat
              <span
                style={{
                  fontSize: "0.65rem",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: "var(--bg-subtle)",
                  color: "var(--primary)",
                  border: "1px solid var(--border-subtle)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                PRO
              </span>
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-dim)",
                fontWeight: 500,
              }}
            >
              {t("nav.brandSubtitle")}
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color:
                pathname === "/" ? "var(--primary)" : "var(--text-muted)",
              transition: "color 0.15s ease",
            }}
          >
            {t("nav.home")}
          </Link>

          <Link
            href="/service"
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color:
                pathname === "/service" ? "var(--primary)" : "var(--text-muted)",
              transition: "color 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {t("nav.service")}
          </Link>

          {user && (
            <Link
              href="/lands"
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color:
                  pathname.startsWith("/lands")
                    ? "var(--primary)"
                    : "var(--text-muted)",
                transition: "color 0.15s ease",
              }}
            >
              {t("nav.lands")}
            </Link>
          )}

          {user && (
            <Link
              href="/profile"
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color:
                  pathname === "/profile"
                    ? "var(--primary)"
                    : "var(--text-muted)",
                transition: "color 0.15s ease",
              }}
            >
              {t("nav.profile")}
            </Link>
          )}
        </nav>

        {/* Language Switcher & Auth CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={toggleLocale}
            className="btn btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              fontSize: "0.825rem",
              fontWeight: 700,
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              borderColor: "rgba(16, 185, 129, 0.35)",
              color: "var(--primary)",
              cursor: "pointer",
              borderRadius: "20px",
              transition: "all 0.2s ease",
            }}
            title={locale === "en" ? "تبديل إلى العربية" : "Switch to English"}
          >
            <Globe size={15} />
            <span>{t("nav.language")}</span>
          </button>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Link
                href="/profile"
                className="btn btn-secondary"
                style={{
                  fontSize: "0.85rem",
                  padding: "8px 14px",
                }}
              >
                <UserIcon size={16} />
                <span>
                  {user.first_name
                    ? `${user.first_name} ${user.last_name || ""}`.trim()
                    : user.email}
                </span>
              </Link>
              <button
                onClick={logout}
                className="btn btn-secondary"
                title={t("nav.signOut")}
                style={{
                  padding: "8px 12px",
                  color: "var(--text-dim)",
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link
                href="/login"
                className="btn btn-secondary"
                style={{
                  fontSize: "0.875rem",
                  padding: "8px 16px",
                }}
              >
                <LogIn size={16} />
                <span>{t("nav.signIn")}</span>
              </Link>
              <Link
                href="/register"
                className="btn btn-primary"
                style={{
                  fontSize: "0.875rem",
                  padding: "8px 16px",
                }}
              >
                <UserPlus size={16} />
                <span>{t("nav.register")}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
