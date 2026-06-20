import { Suspense } from "react";

import HomeContent from "@/components/HomeContent";

export default function Home() {
  return (
    <main className="flex flex-col px-2 pb-8">
      <Suspense fallback={<div>Loading…</div>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
