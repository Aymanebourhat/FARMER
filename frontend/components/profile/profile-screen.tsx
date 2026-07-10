"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { ApiError, apiClient } from "@/lib/api-client";
import { clearAuthSession, getAccessToken, restoreSession } from "@/lib/auth";
import { getProvinceOptions, getRegionLabel, isKnownRegion, regionOptions } from "@/lib/morocco-regions";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { AuthUser, FarmerProfile, FarmerProfilePayload, FarmSizeLabel, LivestockType } from "@/types/user";

type ProfileScreenProps = {
  locale: Locale;
  dictionary: Dictionary;
};

type LoadState = "loading" | "ready" | "error";

type FormErrors = Partial<Record<"region" | "province", string>>;

const livestockTypes: LivestockType[] = ["sheep", "cow", "goat", "camel", "other"];
const farmSizes: FarmSizeLabel[] = ["small", "medium", "large"];

const animalVisuals: Record<LivestockType, { emoji: string; tone: string }> = {
  sheep: { emoji: "🐑", tone: "bg-primary-fixed" },
  cow: { emoji: "🐄", tone: "bg-secondary-fixed" },
  goat: { emoji: "🐐", tone: "bg-success-container" },
  camel: { emoji: "🐪", tone: "bg-error-container/60" },
  other: { emoji: "🌾", tone: "bg-surface-container-high" },
};

export function ProfileScreen({ locale, dictionary }: ProfileScreenProps) {
  const router = useRouter();
  const profileText = dictionary.profile;
  const common = dictionary.common;
  const [state, setState] = useState<LoadState>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const load = async () => {
    setState("loading");
    setError("");
    const sessionUser = await restoreSession();
    if (!sessionUser) {
      router.replace(`/${locale}/login`);
      return;
    }
    setUser(sessionUser);

    if (sessionUser.role !== "farmer") {
      setState("ready");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      router.replace(`/${locale}/login`);
      return;
    }

    try {
      const loadedProfile = await apiClient.getFarmerProfile(token);
      setProfile(loadedProfile);
      setEditing(!loadedProfile);
      setState("ready");
    } catch (loadError) {
      setError(loadError instanceof ApiError ? loadError.detail : common.error);
      setState("error");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = () => {
    clearAuthSession();
    router.push(`/${locale}/login`);
  };

  if (state === "loading") {
    return (
      <CenteredCard>
        <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="text-sm font-bold text-primary">{common.loading}</p>
      </CenteredCard>
    );
  }

  if (state === "error") {
    return (
      <CenteredCard error>
        <h1 className="text-lg font-black text-error">{common.error}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-all hover:bg-primary-container"
        >
          {common.retry}
        </button>
      </CenteredCard>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== "farmer") {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-2xl animate-page-in items-center justify-center px-4">
        <div className="rounded-2xl border border-secondary-container bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-black text-primary">{profileText.farmerOnlyTitle}</h1>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{profileText.farmerOnlyDescription}</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-6 rounded-xl bg-error-container/20 px-5 py-2.5 text-xs font-bold text-error transition-all hover:bg-error-container/40"
          >
            {common.signOut}
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center px-4">
        <div className="relative flex w-full max-w-2xl animate-scale-in flex-col items-center justify-center space-y-6 overflow-hidden rounded-xl border border-secondary-container bg-surface-container-lowest p-12 text-center shadow-lg">
          <div className="absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r from-primary-fixed via-primary to-primary-container" />
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10 blur-2xl" />
            <CheckIcon className="relative z-10 size-[72px] animate-bounce text-primary" />
          </div>
          <h2 className="text-2xl font-black text-primary">{profileText.success}</h2>
          <p className="text-sm font-medium text-on-surface-variant">{dictionary.dashboard.profileReadyDescription}</p>
          <div className="mt-2 h-1 w-32 overflow-hidden rounded-full bg-surface-variant">
            <div className="h-full rounded-full bg-primary animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!editing && profile) {
    return (
      <ProfileDetails
        locale={locale}
        dictionary={dictionary}
        user={user}
        profile={profile}
        onEdit={() => setEditing(true)}
        onSignOut={signOut}
      />
    );
  }

  return (
    <ProfileForm
      locale={locale}
      dictionary={dictionary}
      profile={profile}
      onCancel={profile ? () => setEditing(false) : undefined}
      onSaved={(savedProfile) => {
        setProfile(savedProfile);
        setEditing(false);
        setSuccess(true);
        window.setTimeout(() => {
          router.push(`/${locale}/dashboard`);
        }, 1500);
      }}
    />
  );
}

function ProfileForm({ locale, dictionary, profile, onCancel, onSaved }: { locale: Locale; dictionary: Dictionary; profile: FarmerProfile | null; onCancel?: () => void; onSaved: (profile: FarmerProfile) => void }) {
  const isRtl = locale !== "fr";
  const text = dictionary.profile;
  const common = dictionary.common;
  const reducedMotion = useReducedMotion();
  const initialRegion = profile?.region && isKnownRegion(profile.region) ? profile.region : regionOptions[0];
  const initialProvince = profile?.province && getProvinceOptions(initialRegion).includes(profile.province) ? profile.province : getProvinceOptions(initialRegion)[0];

  const [farmName, setFarmName] = useState(profile?.farm_name ?? "");
  const [region, setRegion] = useState<string>(initialRegion);
  const [province, setProvince] = useState(initialProvince);
  const [commune, setCommune] = useState(profile?.commune ?? "");
  const [livestockType, setLivestockType] = useState<LivestockType>((profile?.main_livestock_type as LivestockType | null) ?? "sheep");
  const [farmSize, setFarmSize] = useState<FarmSizeLabel>((profile?.farm_size_label as FarmSizeLabel | null) ?? "medium");
  const [farmNameFocused, setFarmNameFocused] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const typedFarmName = useTypingPlaceholder(locale, reducedMotion);
  const provinces = getProvinceOptions(region);


  const completion = profile?.profile_completion_score ?? 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const nextErrors: FormErrors = {};
    if (!region) {
      nextErrors.region = common.required;
    }
    if (!province) {
      nextErrors.province = common.required;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setFormError(common.error);
      return;
    }

    const payload: FarmerProfilePayload = {
      farm_name: farmName.trim() || null,
      region,
      province,
      commune: commune.trim() || null,
      main_livestock_type: livestockType,
      farm_size_label: farmSize,
    };

    setSubmitting(true);
    try {
      onSaved(await apiClient.upsertFarmerProfile(token, payload));
    } catch (error) {
      setFormError(error instanceof ApiError ? error.detail : common.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[65vh] w-full items-center justify-center py-10">
      <div className="relative w-full max-w-2xl animate-page-in overflow-hidden rounded-xl border border-secondary-container bg-surface-container-lowest p-6 shadow-sm md:p-8">
        <div className="absolute left-0 right-0 top-0 h-1.5 bg-primary" />
        <div className={`mb-8 ${isRtl ? "text-right" : "text-left"}`}>
          <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
            <SparkIcon className="animate-spin" />
            {text.completionLabel}
          </span>
          <h1 className="mb-2 text-xl font-black tracking-tight text-on-surface md:text-2xl">{text.title}</h1>
          <p className="text-xs leading-relaxed text-on-surface-variant md:text-sm">{text.subtitle}</p>

          <div className="mt-6 rounded-xl border border-secondary-container/40 bg-surface-container p-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface">{text.completionLabel}</span>
              <span className="text-xs font-bold text-primary">{completion}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-variant">
              <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>

        {formError && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error-container/20 p-3.5 text-center text-xs font-bold text-error">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <label className="block space-y-1.5" htmlFor="farm-name">
            <span className={`block text-xs font-black uppercase tracking-wider text-on-surface ${isRtl ? "text-right" : "text-left"}`}>
              {text.farmName}
            </span>
            <span className="relative block">
              <span className={`pointer-events-none absolute inset-y-0 z-10 flex items-center text-outline-variant ${isRtl ? "right-3" : "left-3"}`}>
                <FarmIcon />
              </span>
              <input
                id="farm-name"
                name="farm_name"
                type="text"
                value={farmName}
                onChange={(event) => setFarmName(event.target.value)}
                onFocus={() => setFarmNameFocused(true)}
                onBlur={() => setFarmNameFocused(false)}
                className={`relative z-0 h-12 w-full rounded border border-outline-variant bg-surface-container-lowest text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary ${
                  isRtl ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"
                }`}
              />
              {!farmNameFocused && !farmName && (
                <span className={`pointer-events-none absolute inset-y-0 z-10 flex items-center text-sm text-on-surface-variant/45 ${isRtl ? "right-10" : "left-10"}`}>
                  <span>{typedFarmName.text}</span>
                  {typedFarmName.cursorVisible && <span className="ms-0.5 font-mono font-semibold text-primary">|</span>}
                </span>
              )}
            </span>
          </label>

          <div className="rounded-xl border border-secondary-container bg-surface-container-low p-4">
            <div className={`mb-4 flex items-start gap-3 ${isRtl ? "flex-row-reverse text-right" : "text-left"}`}>
              <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LocationIcon />
              </span>
              <div>
                <h2 className="text-xs font-black text-on-surface md:text-sm">{text.locationHelp}</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant md:text-xs">
                  {text.emptyDescription}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SelectField
                id="region"
                label={text.region}
                value={region}
                onChange={(value) => {
                  setRegion(value);
                  setProvince(getProvinceOptions(value)[0] ?? "");
                }}
                options={regionOptions.map((value) => ({ value, label: getRegionLabel(value, locale) }))}
                error={errors.region}
              />
              <SelectField
                id="province"
                label={text.province}
                value={province}
                onChange={setProvince}
                options={provinces.map((value) => ({ value, label: value }))}
                error={errors.province}
              />
              <TextField id="commune" label={text.commune} value={commune} onChange={setCommune} />
            </div>
          </div>

          <div className="space-y-2">
            <span className={`block text-xs font-black uppercase tracking-wider text-on-surface ${isRtl ? "text-right" : "text-left"}`}>
              {text.mainLivestockType}
            </span>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {livestockTypes.map((type) => (
                <OptionButton
                  key={type}
                  label={text[type]}
                  visual={animalVisuals[type]}
                  active={livestockType === type}
                  onClick={() => setLivestockType(type)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className={`block text-xs font-black uppercase tracking-wider text-on-surface ${isRtl ? "text-right" : "text-left"}`}>
              {text.farmSizeLabel}
            </span>
            <div className="flex flex-wrap gap-4 rounded-xl border border-secondary-container/40 bg-surface-container-lowest p-4">
              {farmSizes.map((size) => (
                <label key={size} className="group flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    name="farm-size"
                    value={size}
                    checked={farmSize === size}
                    onChange={() => setFarmSize(size)}
                    className="size-5 accent-primary"
                  />
                  <span className="text-xs font-semibold text-on-surface transition-colors group-hover:text-primary md:text-sm">
                    {text[size]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={`mt-6 flex items-center gap-3 border-t border-secondary-container pt-6 ${isRtl ? "justify-start" : "justify-end"}`}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-outline/50 px-6 py-2.5 text-xs font-bold text-on-surface-variant transition-all hover:bg-surface-container"
              >
                {common.backHome}
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-xs font-bold uppercase tracking-wider text-on-primary shadow-md shadow-primary/10 transition-all hover:opacity-95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto md:min-w-[160px]"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>{common.saving}</span>
                </span>
              ) : (
                <span>{text.saveProfile}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileDetails({ locale, dictionary, user, profile, onEdit, onSignOut }: { locale: Locale; dictionary: Dictionary; user: AuthUser; profile: FarmerProfile; onEdit: () => void; onSignOut: () => void }) {
  const isRtl = locale !== "fr";
  const text = dictionary.profile;
  const common = dictionary.common;
  const livestockLabel = profile.main_livestock_type && profile.main_livestock_type in text ? text[profile.main_livestock_type as LivestockType] : dictionary.common.empty;
  const farmSizeLabel = profile.farm_size_label && profile.farm_size_label in text ? text[profile.farm_size_label as FarmSizeLabel] : dictionary.common.empty;

  return (
    <div className="mx-auto max-w-4xl animate-page-in space-y-8 py-4">
      <div className={`flex flex-col justify-between gap-4 sm:flex-row sm:items-center ${isRtl ? "text-right sm:flex-row-reverse" : "text-left"}`}>
        <div>
          <h1 className="text-2xl font-extrabold text-primary sm:text-3xl">{text.viewTitle}</h1>
          <p className="mt-1 text-sm text-on-surface-variant/80">{dictionary.hero.trustNote}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="self-start rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container sm:self-center"
        >
          {text.edit}
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
        <aside className="space-y-6 rounded-2xl border border-secondary-container bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-primary/10 bg-primary-fixed text-2xl font-bold text-primary shadow-inner">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-primary">{profile.farm_name ?? text.emptyTitle}</h2>
            <p className="text-xs font-semibold text-on-surface-variant/80">{user.full_name}</p>
          </div>
          <div className="border-t border-secondary-container/30 pt-4">
            <span className="text-xs font-black uppercase tracking-wider text-secondary">{text.completionLabel}</span>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-variant">
              <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${profile.profile_completion_score}%` }} />
            </div>
            <p className="mt-1 text-xl font-black text-primary">{profile.profile_completion_score}%</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full rounded-xl bg-error-container/20 py-2.5 text-xs font-bold text-error transition-all hover:bg-error-container/40"
          >
            {common.signOut}
          </button>
        </aside>

        <section className="space-y-6 rounded-2xl border border-secondary-container bg-white p-6 shadow-sm md:col-span-2">
          <div className="space-y-4">
            <h2 className={`border-b border-secondary-container/30 pb-2 text-sm font-black uppercase tracking-wider text-primary/75 ${isRtl ? "text-right" : "text-left"}`}>
              {text.informationCardTitle}
            </h2>
            <div className="grid grid-cols-1 gap-4 text-xs text-on-surface sm:grid-cols-2">
              <Detail label={text.farmName} value={profile.farm_name ?? common.empty} isRtl={isRtl} />
              <Detail label={text.mainLivestockType} value={livestockLabel} isRtl={isRtl} />
              <Detail label={`${text.region} & ${text.province}`} value={`${profile.province} (${profile.region})`} isRtl={isRtl} />
              <Detail label={text.commune} value={profile.commune ?? common.empty} isRtl={isRtl} />
              <Detail label={text.farmSizeLabel} value={farmSizeLabel} isRtl={isRtl} />
              <Detail label={text.lastUpdated} value={new Date(profile.updated_at).toLocaleDateString(locale !== "fr" ? "ar-MA" : "fr-FR")} isRtl={isRtl} />
            </div>
          </div>

          <div className={`flex gap-3.5 rounded-2xl border border-primary/10 bg-primary/5 p-4 ${isRtl ? "flex-row-reverse text-right" : "text-left"}`}>
            <InfoIcon className="mt-0.5 shrink-0 animate-pulse text-primary" />
            <div className="space-y-1.5">
              <h3 className="text-xs font-black uppercase tracking-wide text-primary">{text.informationCardTitle}</h3>
              <p className="text-[11px] leading-relaxed text-on-surface-variant/90">{text.informationCardText}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function CenteredCard({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className={`w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm ${error ? "border-error/20" : "border-secondary-container"}`}>
        {children}
      </div>
    </div>
  );
}

function SelectField({ id, label, value, onChange, options, error }: { id: string; label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; error?: string }) {
  return (
    <label className="space-y-1" htmlFor={id}>
      <span className="block text-[10px] font-black uppercase tracking-wider text-on-surface">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className="h-11 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-xs text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="block text-xs font-semibold text-error">{error}</span>}
    </label>
  );
}

function TextField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1" htmlFor={id}>
      <span className="block text-[10px] font-black uppercase tracking-wider text-on-surface">{label}</span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-xs text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}

function OptionButton({
  label,
  visual,
  active,
  onClick,
}: {
  label: string;
  visual: { emoji: string; tone: string };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-28 flex-col items-center justify-center rounded-lg border p-3.5 text-center text-xs font-bold transition-all ${
        active
          ? "scale-[1.03] border-primary bg-primary-fixed text-primary font-black shadow-sm"
          : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
      }`}
    >
      <span className="relative mb-2 flex size-12 items-center justify-center" aria-hidden="true">
        <span
          className={`absolute inset-1 rotate-45 rounded-lg border border-white/60 shadow-sm transition-transform duration-200 group-hover:rotate-[52deg] ${visual.tone}`}
        />
        <span className="relative z-10 text-3xl leading-none transition-transform duration-200 group-hover:scale-[1.15]">
          {visual.emoji}
        </span>
      </span>
      <span>{label}</span>
    </button>
  );
}

function Detail({ label, value, isRtl }: { label: string; value: string; isRtl: boolean }) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl bg-surface-container-low p-3.5 ${isRtl ? "text-right" : "text-left"}`}>
      <span className="font-medium text-secondary">{label}</span>
      <span className="text-sm font-extrabold text-primary">{value}</span>
    </div>
  );
}

function useTypingPlaceholder(locale: Locale, reducedMotion: boolean) {
  const phrases = useMemo(
    () =>
      locale !== "fr"
        ? ["مثلا: ضيعة البركة", "أدخل اسم ضيعتك هنا"]
        : ["ex: Domaine Al Baraka", "Saisissez le nom de votre domaine"],
    [locale],
  );
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">("typing");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }
    const interval = window.setInterval(() => setCursorVisible((visible) => !visible), 500);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }
    const activePhrase = phrases[phraseIndex % phrases.length];
    let timeoutId: number;

    if (phase === "typing") {
      if (charIndex < activePhrase.length) {
        timeoutId = window.setTimeout(() => setCharIndex((index) => index + 1), 60);
      } else {
        timeoutId = window.setTimeout(() => setPhase("holding"), 100);
      }
    } else if (phase === "holding") {
      timeoutId = window.setTimeout(() => setPhase("deleting"), 2500);
    } else if (charIndex > 0) {
      timeoutId = window.setTimeout(() => setCharIndex((index) => index - 1), 30);
    } else {
      timeoutId = window.setTimeout(() => {
        setPhraseIndex((index) => (index + 1) % phrases.length);
        setPhase("typing");
      }, 400);
    }

    return () => window.clearTimeout(timeoutId);
  }, [charIndex, phase, phraseIndex, phrases, reducedMotion]);

  return {
    text: reducedMotion ? phrases[0] : phrases[phraseIndex % phrases.length].slice(0, charIndex),
    cursorVisible: !reducedMotion && cursorVisible,
  };
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function SvgIcon({ children, className = "size-5" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function FarmIcon() {
  return <SvgIcon><path d="M5 15.5h12.5M7.5 15.5V11h7l3 4.5M9.5 11V8.5h3.5l1.5 2.5" /><circle cx="7.5" cy="17.5" r="2.3" /><circle cx="17.5" cy="17.5" r="1.6" /></SvgIcon>;
}

function LocationIcon() {
  return <SvgIcon><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></SvgIcon>;
}

function SparkIcon({ className = "" }: { className?: string }) {
  return <SvgIcon className={`size-3 ${className}`}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></SvgIcon>;
}

function CheckIcon({ className = "" }: { className?: string }) {
  return <SvgIcon className={className}><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></SvgIcon>;
}

function InfoIcon({ className = "" }: { className?: string }) {
  return <SvgIcon className={`size-[18px] ${className}`}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></SvgIcon>;
}







