"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/api";
import "@/components/service/service.css";

const DedicatedRegisterLandMap = dynamic(
  () => import("@/components/service/DedicatedRegisterLandMap"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#070B12",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748B",
          fontSize: "1rem",
        }}
      >
        Initializing High-Precision Land Boundary Editor...
      </div>
    ),
  }
);

export default function RegisterLandPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user && !getToken()) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || (!user && !getToken())) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#070B12",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#10B981",
          fontSize: "0.95rem",
        }}
      >
        Verifying authorization...
      </div>
    );
  }

  return <DedicatedRegisterLandMap />;
}
