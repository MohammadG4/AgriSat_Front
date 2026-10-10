"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Layers,
  Plus,
  ArrowRight,
  Sliders,
  FileText,
  Search,
  Calendar,
  Compass,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getLandsApi, getToken } from "@/lib/api";
import { Land } from "@/types/farm";
import { formatAreaKm2 } from "@/components/service/geoUtils";
import Loader from "@/components/Loader";

export default function LandsDirectoryPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Route Protection (Requirement 2)
  useEffect(() => {
    if (!isLoading && !user && !getToken()) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    getLandsApi(token)
      .then((data) => {
        setLands(data);
      })
      .catch((err) => {
        console.error("Failed to load user lands:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  if (isLoading || (!user && !getToken())) {
    return <Loader fullPage size="lg" message="Authenticating session..." />;
  }

  const filteredLands = lands.filter((l) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      (l.location && l.location.toLowerCase().includes(q)) ||
      String(l.id).includes(q)
    );
  });

  return (
    <main
      style={{
        minHeight: "calc(100vh - 70px)",
        backgroundColor: "#070B12",
        color: "#F8FAFC",
        padding: "40px 24px 60px 24px",
      }}
    >
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        {/* Page Top Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "36px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "24px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  color: "#F8FAFC",
                  margin: 0,
                }}
              >
                Your Lands Directory
              </h1>
              <span
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  color: "#10B981",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                {lands.length} {lands.length === 1 ? "Parcel" : "Parcels"}
              </span>
            </div>
            <p style={{ color: "#94A3B8", fontSize: "0.88rem", marginTop: "6px" }}>
              Comprehensive registry of your active agricultural holdings and automated satellite telemetry watches.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/service"
              className="btn btn-secondary"
              style={{
                fontSize: "0.85rem",
                padding: "10px 18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Compass size={16} style={{ color: "#38BDF8" }} />
              <span>Open Live Map</span>
            </Link>

            <button
              type="button"
              onClick={() => window.open("/service/register-land", "_blank")}
              className="btn btn-primary"
              style={{
                fontSize: "0.85rem",
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Plus size={16} />
              <span>Register New Land</span>
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              position: "relative",
              flex: 1,
              maxWidth: "460px",
            }}
          >
            <Search
              size={17}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748B",
              }}
            />
            <input
              type="text"
              placeholder="Search lands by name, location, or ID..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 42px",
                borderRadius: "10px",
                backgroundColor: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#F8FAFC",
                fontSize: "0.88rem",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Content State */}
        {loading ? (
          <Loader size="md" message="Loading registered lands directory..." />
        ) : lands.length === 0 ? (
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.5)",
              border: "1px dashed rgba(255, 255, 255, 0.12)",
              borderRadius: "16px",
              padding: "60px 24px",
              textAlign: "center",
              maxWidth: "520px",
              margin: "40px auto",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
                margin: "0 auto 16px auto",
              }}
            >
              <MapPin size={26} />
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>
              No Lands Registered Yet
            </h3>
            <p style={{ color: "#94A3B8", fontSize: "0.85rem", marginBottom: "24px" }}>
              Draw your farm boundary on our high-resolution satellite map to unlock NDVI monitoring and automated alerts.
            </p>
            <button
              type="button"
              onClick={() => window.open("/service/register-land", "_blank")}
              className="btn btn-primary"
              style={{ padding: "10px 22px", fontSize: "0.88rem" }}
            >
              <Plus size={16} />
              <span>Register Your First Land</span>
            </button>
          </div>
        ) : filteredLands.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748B" }}>
            No lands match your search query &ldquo;{searchFilter}&rdquo;.
          </div>
        ) : (
          /* Grid of Horizontal Cards (Requirement 3) */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {filteredLands.map((land) => {
              return (
                <div
                  key={land.id}
                  style={{
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "20px",
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.35)";
                    e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.95)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.75)";
                  }}
                >
                  {/* Left: Parcel Core Identification */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: "260px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(16, 185, 129, 0.14)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#10B981",
                        flexShrink: 0,
                      }}
                    >
                      <MapPin size={22} />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#F8FAFC", margin: 0 }}>
                          {land.name}
                        </h3>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                            color: "#94A3B8",
                            fontWeight: 700,
                          }}
                        >
                          #{land.id}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#94A3B8",
                          marginTop: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {land.location ? (
                          <span>{land.location}</span>
                        ) : (
                          <span style={{ color: "#64748B" }}>Egypt Agricultural Basin</span>
                        )}
                        <span>&bull;</span>
                        <span style={{ color: "#64748B" }}>
                          Registered: {new Date(land.created_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Attributes in km² and Soil */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "28px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                        Parcel Area
                      </div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "#34D399", marginTop: "2px" }}>
                        {land.area_hectares != null ? formatAreaKm2(land.area_hectares) : "Calculated"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                        Soil &amp; Irrigation
                      </div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#E2E8F0", marginTop: "2px" }}>
                        {land.soil_type || "Standard"} &bull; {land.irrigation_type || "Drip"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                        Telemetry Status
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#10B981",
                            boxShadow: "0 0 6px #10B981",
                          }}
                        />
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#10B981" }}>
                          Active Watch
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: The Two Primary Action Buttons (Requirement 3) */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Primary Button 1: Land details */}
                    <button
                      type="button"
                      onClick={() => router.push(`/lands/landdetails?land_id=${land.id}`)}
                      className="btn btn-secondary"
                      style={{
                        padding: "9px 16px",
                        fontSize: "0.84rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        color: "#F8FAFC",
                        fontWeight: 600,
                      }}
                    >
                      <FileText size={15} style={{ color: "#10B981" }} />
                      <span>Land details</span>
                    </button>

                    {/* Primary Button 2: Alert Options */}
                    <button
                      type="button"
                      onClick={() => router.push(`/lands/AlertOptions?land_id=${land.id}`)}
                      className="btn btn-primary"
                      style={{
                        padding: "9px 18px",
                        fontSize: "0.84rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        fontWeight: 700,
                      }}
                    >
                      <Sliders size={15} />
                      <span>Alert Options</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
