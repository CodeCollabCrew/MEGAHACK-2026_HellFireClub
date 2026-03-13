"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const user = params.get("user");

    if (user) {
      localStorage.setItem("userId", user);
    }

    router.replace("/dashboard");
  }, [router]);

  return null;
}