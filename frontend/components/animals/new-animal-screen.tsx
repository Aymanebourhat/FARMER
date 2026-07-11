"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AnimalForm } from "@/components/animals/animal-form";
import { FarmerOnly, LoadingPanel } from "@/components/animals/animal-ui";
import { ApiError, apiClient } from "@/lib/api-client";
import type { Dictionary, Locale } from "@/lib/i18n";
import { useFarmerSession } from "@/lib/use-farmer-session";
import type { AnimalCreateInput } from "@/types/animal";

export function NewAnimalScreen({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const router = useRouter();
  const { state, token, handleApiError } = useFarmerSession(locale);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (state === "loading") return <LoadingPanel label={dictionary.common.loading} />;
  if (state === "forbidden") return <FarmerOnly dictionary={dictionary} />;

  const submit = async (payload: AnimalCreateInput) => {
    if (!token || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const animal = await apiClient.createAnimal(token, payload);
      router.push(`/${locale}/animals/${animal.id}?created=1`);
    } catch (submitError) {
      if (!handleApiError(submitError)) {
        setError(submitError instanceof ApiError ? submitError.detail : dictionary.animals.form.generalError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-page-in">
      <Link href={`/${locale}/animals`} className="mb-5 inline-flex min-h-11 items-center text-sm font-bold text-primary hover:underline">← {dictionary.animals.detail.back}</Link>
      <section className="overflow-hidden rounded-2xl border border-secondary-container bg-white shadow-sm">
        <header className="border-b border-secondary-container bg-[#F5EBE0] p-6 sm:p-8">
          <h1 className="text-2xl font-black text-primary">{dictionary.animals.form.createTitle}</h1>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{dictionary.animals.form.subtitle}</p>
        </header>
        <div className="p-5 sm:p-8">
          <AnimalForm dictionary={dictionary} submitting={submitting} error={error} onSubmit={submit} />
        </div>
      </section>
    </div>
  );
}
