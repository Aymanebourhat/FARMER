"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  animalFormDefaults,
  createAnimalFormSchema,
  healthStatusValues,
  saleReadinessValues,
  sexValues,
  speciesValues,
  toAnimalPayload,
  type AnimalFormValues,
} from "@/lib/animal-utils";
import type { Dictionary } from "@/lib/i18n";
import type { Animal, AnimalCreateInput } from "@/types/animal";
import { Notice } from "@/components/animals/animal-ui";

type AnimalFormProps = {
  dictionary: Dictionary;
  animal?: Animal;
  submitting: boolean;
  error: string;
  onSubmit: (payload: AnimalCreateInput) => Promise<void> | void;
  onCancel?: () => void;
};

export function AnimalForm({ dictionary, animal, submitting, error, onSubmit, onCancel }: AnimalFormProps) {
  const text = dictionary.animals.form;
  const schema = createAnimalFormSchema({
    required: dictionary.common.required,
    positive: text.positive,
    futureDate: text.futureDate,
    chooseAge: text.chooseAge,
  });
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AnimalFormValues>({
    resolver: zodResolver(schema),
    defaultValues: animalFormDefaults(animal),
  });
  const ageMode = useWatch({ control, name: "age_mode" });

  useEffect(() => {
    reset(animalFormDefaults(animal));
  }, [animal, reset]);

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => onSubmit(toAnimalPayload(values)))}
      className="space-y-6"
    >
      <Notice message={error} error />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={text.species} error={errors.species?.message} required>
          <select {...register("species")} className={inputClass(Boolean(errors.species))}>
            {speciesValues.map((value) => <option key={value} value={value}>{dictionary.animals.values[value]}</option>)}
          </select>
        </Field>
        <Field label={text.breed} error={errors.breed?.message}>
          <input {...register("breed")} maxLength={120} placeholder={text.breedPlaceholder} className={inputClass(Boolean(errors.breed))} />
        </Field>
        <Field label={text.sex} error={errors.sex?.message} required>
          <select {...register("sex")} className={inputClass(Boolean(errors.sex))}>
            {sexValues.map((value) => <option key={value} value={value}>{dictionary.animals.values[value]}</option>)}
          </select>
        </Field>
        <Field label={text.color} error={errors.color?.message}>
          <input {...register("color")} maxLength={120} placeholder={text.colorPlaceholder} className={inputClass(Boolean(errors.color))} />
        </Field>
      </div>

      <fieldset className="rounded-2xl border border-secondary-container bg-surface-container-low p-4 sm:p-5">
        <legend className="px-2 text-sm font-black text-primary">{text.ageMethod}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={choiceClass(ageMode === "birth_date")}>
            <input type="radio" value="birth_date" {...register("age_mode")} className="size-4 accent-primary" />
            <span className="text-sm font-bold">{text.exactDate}</span>
          </label>
          <label className={choiceClass(ageMode === "estimated")}>
            <input type="radio" value="estimated" {...register("age_mode")} className="size-4 accent-primary" />
            <span className="text-sm font-bold">{text.estimatedAge}</span>
          </label>
        </div>
        <div className="mt-4">
          {ageMode === "birth_date" ? (
            <Field label={text.birthDate} error={errors.birth_date?.message} required>
              <input type="date" {...register("birth_date")} className={inputClass(Boolean(errors.birth_date))} />
            </Field>
          ) : (
            <Field label={text.ageMonths} error={errors.estimated_age_months?.message} required>
              <input type="number" min="1" step="1" inputMode="numeric" {...register("estimated_age_months")} className={inputClass(Boolean(errors.estimated_age_months))} />
            </Field>
          )}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={text.healthStatus} error={errors.health_status?.message} required>
          <select {...register("health_status")} className={inputClass(Boolean(errors.health_status))}>
            {healthStatusValues.map((value) => <option key={value} value={value}>{dictionary.animals.values[value]}</option>)}
          </select>
        </Field>
        <Field label={text.saleReadiness} error={errors.sale_readiness?.message} required>
          <select {...register("sale_readiness")} className={inputClass(Boolean(errors.sale_readiness))}>
            {saleReadinessValues.map((value) => <option key={value} value={value}>{dictionary.animals.values[value]}</option>)}
          </select>
        </Field>
      </div>

      <Field label={text.notes} error={errors.identification_notes?.message}>
        <textarea {...register("identification_notes")} rows={4} placeholder={text.notesPlaceholder} className={inputClass(Boolean(errors.identification_notes))} />
      </Field>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel ? (
          <button type="button" disabled={submitting} onClick={onCancel} className="min-h-11 rounded-xl border border-secondary-container px-6 py-3 text-sm font-bold text-secondary disabled:opacity-60">
            {text.cancel}
          </button>
        ) : null}
        <button type="submit" disabled={submitting} className="min-h-11 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-wait disabled:opacity-60">
          {submitting ? (animal ? text.saving : text.creating) : (animal ? text.save : text.create)}
        </button>
      </div>
    </form>
  );
}

function Field({ label, required = false, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-bold text-on-surface">
      <span>{label}{required ? <span className="text-error" aria-hidden="true"> *</span> : null}</span>
      <span className="mt-2 block">{children}</span>
      {error ? <span role="alert" className="mt-1.5 block text-xs font-medium text-error">{error}</span> : null}
    </label>
  );
}

function inputClass(error: boolean) {
  return `min-h-11 w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-on-surface shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 ${error ? "border-error" : "border-secondary-container"}`;
}

function choiceClass(active: boolean) {
  return `flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${active ? "border-primary bg-primary-fixed/25 text-primary" : "border-secondary-container bg-white text-secondary"}`;
}
