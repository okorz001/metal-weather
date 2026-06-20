import { Suspense } from "react";

import HomeContent from "@/components/HomeContent";

export default function Home() {
  return (
    <main className="flex flex-col items-center px-2 pt-14 pb-8">
      <Suspense fallback={<div>Loading…</div>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
