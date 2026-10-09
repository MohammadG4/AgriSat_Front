"use client";

import React from "react";
import dynamic from "next/dynamic";
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
  return <DedicatedRegisterLandMap />;
}
