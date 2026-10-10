"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/api";
import Loader from "@/components/Loader";
import "@/components/service/service.css";

const DedicatedRegisterLandMap = dynamic(
  () => import("@/components/service/DedicatedRegisterLandMap"),
  {
    ssr: false,
    loading: () => (
      <Loader fullPage size="lg" message="Initializing High-Precision Land Boundary Editor..." />
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
    return <Loader fullPage size="lg" message="Verifying authorization..." />;
  }

  return <DedicatedRegisterLandMap />;
}
