import { Suspense } from "react";

import HomeContent from "@/components/HomeContent";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-8 text-5xl font-black tracking-tight sm:text-7xl">
        metal-weather
      </h1>
      <Suspense fallback={<div>Loading…</div>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
