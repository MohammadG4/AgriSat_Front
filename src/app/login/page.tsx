"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Satellite,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to profile
  React.useEffect(() => {
    if (user) {
      router.push("/profile");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg(t("login.fillBothError"));
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push("/profile");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(t("login.failedAuth"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
        }}
      >
        {/* Brand header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "52px",
              height: "52px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              color: "var(--primary)",
              marginBottom: "16px",
            }}
          >
            <Satellite size={26} />
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--text-main)",
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            {t("login.title")}
          </h1>
          <p
            style={{
              fontSize: "0.925rem",
              color: "var(--text-muted)",
            }}
          >
            {t("login.subtitle")}
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "32px" }}>
          {errorMsg && (
            <div className="alert-box error" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                {t("login.emailLabel")}
              </label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  className="form-input"
                  placeholder={t("login.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="form-label">
                <label htmlFor="login-password">{t("login.passwordLabel")}</label>
              </div>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "13px",
                marginTop: "12px",
                fontSize: "0.95rem",
              }}
            >
              {isSubmitting ? (
                <>{t("login.signingIn")}</>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>{t("login.signInBtn")}</span>
                </>
              )}
            </button>
          </form>

          {/* Integration notice */}
          <div
            style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.825rem",
              color: "var(--text-dim)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={14} color="var(--primary)" />
              FastAPI OAuth2 Engine
            </div>
            <div>Token Bearer 256-bit</div>
          </div>
        </div>

        {/* Footer Link */}
        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "0.9rem",
            color: "var(--text-muted)",
          }}
        >
          {t("login.noAccount")}{" "}
          <Link
            href="/register"
            style={{
              color: "var(--primary)",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {t("login.registerLink")}{" "}
            <ArrowRight size={14} className="icon-flip" />
          </Link>
        </div>
      </div>
    </div>
  );
}
