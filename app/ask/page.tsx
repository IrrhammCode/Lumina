"use client";

import { Suspense } from "react";
import RequestWizard from "@/components/RequestWizard";
import PageLoading from "@/components/PageLoading";

export default function AskPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <RequestWizard mode="family" />
    </Suspense>
  );
}