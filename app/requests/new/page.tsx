"use client";

import { Suspense } from "react";
import RequestWizard from "@/components/RequestWizard";
import PageLoading from "@/components/PageLoading";

export default function NewRequestPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <RequestWizard mode="caregiver" />
    </Suspense>
  );
}