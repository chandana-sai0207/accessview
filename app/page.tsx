"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const user =
      localStorage.getItem("accessview-user");

    if (user) {
      router.replace("/home");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="loading-page">
      <div className="loading-logo">
        AV
      </div>

      <h1>AccessView</h1>

      <p>Loading...</p>
    </main>
  );
}