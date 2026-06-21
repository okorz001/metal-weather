import { Suspense } from "react";

import HomeContent from "@/components/HomeContent";
import Spinner from "@/components/Spinner";

export default function Home() {
  return (
    <main className="flex flex-col items-center px-2 pb-8">
      <Suspense fallback={<Spinner />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
