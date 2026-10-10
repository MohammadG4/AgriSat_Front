"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  Calendar,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Satellite,
  ArrowRight,
  Shield,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register, login, user } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to profile
  React.useEffect(() => {
    if (user) {
      router.push("/profile");
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.email || !formData.password) {
      setErrorMsg(t("register.fillRequired"));
      return;
    }

    if (formData.password.length < 8) {
      setErrorMsg(t("register.passwordTooShort"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg(t("register.passwordsMismatch"));
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone_number: formData.phone.trim(),
        date_of_birth: formData.dob || undefined,
      });

      setSuccessMsg(t("register.successMsg"));

      // Attempt immediate login for seamless UX
      try {
        await login(formData.email.trim(), formData.password);
        router.push("/profile");
      } catch {
        // If auto-login fails, redirect to login page
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Registration failed. Please check inputs and server connection.");
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
          maxWidth: "580px",
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
            {t("register.title")}
          </h1>
          <p
            style={{
              fontSize: "0.925rem",
              color: "var(--text-muted)",
            }}
          >
            {t("register.subtitle")}
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

          {successMsg && (
            <div className="alert-box success" role="alert">
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* First & Last Name */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="register-first-name">
                  {t("register.firstNameLabel")}
                </label>
                <div className="input-icon-wrapper">
                  <UserIcon size={18} className="input-icon" />
                  <input
                    id="register-first-name"
                    name="firstName"
                    type="text"
                    className="form-input"
                    placeholder={t("register.firstNamePlaceholder")}
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-last-name">
                  {t("register.lastNameLabel")}
                </label>
                <div className="input-icon-wrapper">
                  <UserIcon size={18} className="input-icon" />
                  <input
                    id="register-last-name"
                    name="lastName"
                    type="text"
                    className="form-input"
                    placeholder={t("register.lastNamePlaceholder")}
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label className="form-label" htmlFor="register-email">
                {t("register.emailLabel")}
              </label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="form-input"
                  placeholder={t("register.emailPlaceholder")}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Phone & Date of Birth */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="register-phone">
                  {t("register.phoneLabel")}
                </label>
                <div className="input-icon-wrapper">
                  <Phone size={18} className="input-icon" />
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    className="form-input"
                    placeholder={t("register.phonePlaceholder")}
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-dob">
                  {t("common.date")}
                </label>
                <div className="input-icon-wrapper">
                  <Calendar size={18} className="input-icon" />
                  <input
                    id="register-dob"
                    name="dob"
                    type="date"
                    className="form-input"
                    value={formData.dob}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="register-password">
                  {t("register.passwordLabel")}
                </label>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-confirm-password">
                  {t("register.confirmPasswordLabel")}
                </label>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Password notice */}
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-dim)",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Shield size={14} color="var(--primary)" />
              {t("register.passwordTooShort")}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "13px",
                fontSize: "0.95rem",
              }}
            >
              {isSubmitting ? (
                <>{t("register.registering")}</>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>{t("register.registerBtn")}</span>
                </>
              )}
            </button>
          </form>

          {/* Security badge */}
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
              PostgreSQL Secure Storage
            </div>
            <div>Bcrypt Salt Rounds 12</div>
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
          {t("register.haveAccount")}{" "}
          <Link
            href="/login"
            style={{
              color: "var(--primary)",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {t("register.signInLink")}{" "}
            <ArrowRight size={14} className="icon-flip" />
          </Link>
        </div>
      </div>
    </div>
  );
}
