"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard for MVP
    router.push("/dashboard");
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Blue-Collar Voice Screener
        </h1>
        <p className="text-gray-600 mb-4">Redirecting to dashboard...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </main>
  );
}