"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { ApiError, apiClient } from "@/lib/api-client";
import { setAuthSession } from "@/lib/auth";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { BackendLanguage, RegisterPayload } from "@/types/user";

type AuthScreenProps = {
  locale: Locale;
  dictionary: Dictionary;
  mode: "login" | "register";
};

type FieldErrors = Partial<Record<"fullName" | "phone" | "password", string>>;

type PhraseSet = {
  fullName: string[];
  phone: string[];
  password: string[];
};

export function AuthScreen({ locale, dictionary, mode }: AuthScreenProps) {
  const router = useRouter();
  const isRtl = locale !== "fr";
  const auth = dictionary.auth;
  const common = dictionary.common;
  const reducedMotion = useReducedMotion();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterPayload["role"]>("farmer");
  const [preferredLanguage, setPreferredLanguage] = useState<BackendLanguage>(locale === "fr" ? "fr" : "ar");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<"fullName" | "phone" | "password" | null>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const phrases = useMemo<PhraseSet>(
    () => ({
      fullName: [auth.placeholders.fullNameOne, auth.placeholders.fullNameTwo],
      phone: [auth.placeholders.phoneOne, auth.placeholders.phoneTwo],
      password: [auth.placeholders.passwordOne, auth.placeholders.passwordTwo],
    }),
    [auth.placeholders],
  );

  const typed = useSynchronizedPlaceholders(phrases, reducedMotion);

  const title = mode === "register" ? auth.registerTitle : auth.loginTitle;
  const subtitle = mode === "register" ? auth.registerSubtitle : auth.loginSubtitle;

  const features = [
    {
      title: auth.featureOneTitle,
      desc: auth.featureOneDesc,
      badge: auth.featureOneBadge,
      icon: <RoleIcon />,
    },
    {
      title: auth.featureTwoTitle,
      desc: auth.featureTwoDesc,
      badge: auth.featureTwoBadge,
      icon: <SessionIcon />,
    },
    {
      title: auth.featureThreeTitle,
      desc: auth.featureThreeDesc,
      badge: auth.featureThreeBadge,
      icon: <FarmIcon />,
    },
  ];

  const validate = () => {
    const errors: FieldErrors = {};
    if (mode === "register" && !fullName.trim()) {
      errors.fullName = common.required;
    }
    if (!phone.trim()) {
      errors.phone = common.required;
    }
    if (!password.trim()) {
      errors.password = common.required;
    } else if (password.length < 8) {
      errors.password = common.passwordTooShort;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const response =
        mode === "register"
          ? await apiClient.register({
              full_name: fullName.trim(),
              phone: phone.trim(),
              password,
              role,
              preferred_language: preferredLanguage,
            })
          : await apiClient.login({ phone: phone.trim(), password });

      setAuthSession(response);
      setSuccess(true);
      window.setTimeout(() => {
        router.push(response.user.role === "farmer" && mode === "register" ? `/${locale}/profile` : `/${locale}/dashboard`);
      }, 1500);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.detail : common.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl animate-page-in py-4 md:py-8 lg:py-12">
      <div className={`mb-6 flex ${isRtl ? "justify-end" : "justify-start"}`}>
        <Link
          href={`/${locale}`}
          className="group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-secondary transition-all hover:bg-surface-container hover:text-primary"
        >
          {isRtl ? (
            <>
              <span>{common.backHome}</span>
              <ArrowIcon direction="right" className="animate-pulse transition-transform group-hover:translate-x-1" />
            </>
          ) : (
            <>
              <ArrowIcon direction="left" className="animate-pulse transition-transform group-hover:-translate-x-1" />
              <span>{common.backHome}</span>
            </>
          )}
        </Link>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12" style={{ direction: isRtl ? "rtl" : "ltr" }}>
        <aside className="relative hidden flex-col justify-between overflow-hidden rounded-2xl border border-secondary-fixed-dim/50 bg-gradient-to-br from-primary-fixed/30 via-secondary-fixed/20 to-surface-container-low p-8 shadow-sm lg:col-span-5 lg:flex">
          <div>
            <div className="mb-6 flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-fixed shadow-md shadow-primary/10">
                <FarmIcon />
              </span>
              <span className="text-xl font-extrabold tracking-tight text-primary">FellahLink</span>
            </div>

            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                <SparkIcon className="animate-pulse" />
                {auth.sideBadge}
              </span>
              <h1 className="text-2xl font-black leading-snug text-primary">{auth.sideTitle}</h1>
              <p className="text-sm leading-relaxed text-on-surface-variant/90">{auth.sideDescription}</p>
            </div>

            <div className="mt-8 space-y-3">
              {features.map((feature, index) => (
                <button
                  key={feature.title}
                  type="button"
                  onMouseEnter={() => setActiveFeature(index)}
                  onFocus={() => setActiveFeature(index)}
                  className={`w-full rounded-xl border p-3.5 text-start transition-all duration-300 ${
                    activeFeature === index
                      ? "scale-[1.02] border-primary/20 bg-white shadow-sm"
                      : "border-secondary-container/20 bg-white/50 hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                      {feature.icon}
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-primary">{feature.title}</span>
                        <span className="rounded-full bg-secondary-fixed px-1.5 py-0.5 font-mono text-[9px] font-bold text-on-secondary-container">
                          {feature.badge}
                        </span>
                      </span>
                      <span className="mt-1 block text-[11px] text-on-surface-variant/80">{feature.desc}</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-secondary-container/30 pt-4">
            <div className="mt-2.5 flex items-center gap-2">
              <span className="size-2.5 animate-ping rounded-full bg-success" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {dictionary.hero.trustNote}
              </span>
            </div>
          </div>
        </aside>

        <section className="col-span-1 flex flex-col justify-center lg:col-span-7">
          <div className="relative overflow-hidden rounded-2xl border border-secondary-fixed-dim bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary via-primary-container to-primary-fixed" />

            <div className="mb-6 text-center lg:hidden">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FarmIcon className="size-7" />
              </div>
              <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-primary">FellahLink</h1>
              <p className="text-sm font-medium text-on-surface-variant">{title}</p>
            </div>

            <div className={`mb-6 hidden lg:block ${isRtl ? "text-right" : "text-left"}`}>
              <h1 className="mb-1 text-2xl font-black tracking-tight text-primary">{title}</h1>
              <p className="text-xs text-on-surface-variant">{subtitle}</p>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" />
                  <CheckIcon className="relative z-10 size-16 animate-bounce text-primary" />
                </div>
                <h2 className="text-xl font-black text-primary">
                  {mode === "login" ? auth.successLogin : auth.successRegister}
                </h2>
                <p className="text-xs text-on-surface-variant">{auth.redirecting}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {formError && (
                  <div className="rounded-lg border border-error/20 bg-error-container/30 p-3.5 text-center text-xs font-semibold text-error">
                    {formError}
                  </div>
                )}

                {mode === "register" && (
                  <InputField
                    id="full-name"
                    label={auth.fullName}
                    value={fullName}
                    onChange={setFullName}
                    onFocus={() => setFocused("fullName")}
                    onBlur={() => setFocused(null)}
                    placeholder={focused === "fullName" || fullName ? "" : typed.fullName}
                    showCursor={!reducedMotion && focused !== "fullName" && !fullName && typed.cursorVisible}
                    error={fieldErrors.fullName}
                    icon={<UserIcon />}
                    isRtl={isRtl}
                    autoComplete="name"
                  />
                )}

                <InputField
                  id="phone"
                  label={auth.phone}
                  value={phone}
                  onChange={setPhone}
                  onFocus={() => setFocused("phone")}
                  onBlur={() => setFocused(null)}
                  placeholder={focused === "phone" || phone ? "" : typed.phone}
                  showCursor={!reducedMotion && focused !== "phone" && !phone && typed.cursorVisible}
                  error={fieldErrors.phone}
                  icon={<PhoneIcon />}
                  isRtl={isRtl}
                  type="tel"
                  autoComplete="tel"
                  helpText={common.phoneHelp}
                />

                {mode === "register" && (
                  <div className="space-y-2">
                    <span className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant/90 ${isRtl ? "text-right" : "text-left"}`}>
                      {auth.role}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <RoleButton label={auth.farmer} active={role === "farmer"} onClick={() => setRole("farmer")} />
                      <RoleButton label={auth.vet} active={role === "vet"} onClick={() => setRole("vet")} />
                    </div>
                  </div>
                )}

                <PasswordField
                  label={auth.password}
                  value={password}
                  onChange={setPassword}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder={focused === "password" || password ? "" : typed.password}
                  showCursor={!reducedMotion && focused !== "password" && !password && typed.cursorVisible}
                  error={fieldErrors.password}
                  isRtl={isRtl}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword((shown) => !shown)}
                  helpText={common.passwordHelp}
                />

                <label className="block space-y-1">
                  <span className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant/90 ${isRtl ? "text-right" : "text-left"}`}>
                    {auth.preferredLanguage}
                  </span>
                  <span className="relative block">
                    <span className={`pointer-events-none absolute inset-y-0 z-10 flex items-center text-outline-variant ${isRtl ? "right-3" : "left-3"}`}>
                      <GlobeIcon />
                    </span>
                    <select
                      value={preferredLanguage}
                      onChange={(event) => setPreferredLanguage(event.target.value as BackendLanguage)}
                      className={`relative z-0 block w-full appearance-none rounded-lg border border-secondary-fixed-dim bg-surface-container-lowest py-3 text-sm text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                        isRtl ? "pr-10 pl-8 text-right" : "pl-10 pr-8 text-left"
                      }`}
                    >
                      <option value="ar">العربية</option>
                      <option value="fr">Français</option>
                    </select>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 flex w-full transform justify-center rounded-lg border border-transparent bg-primary px-4 py-3.5 text-sm font-bold text-on-primary shadow-md transition-all hover:scale-[1.01] hover:bg-primary-container active:shadow-inner disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? common.saving : mode === "login" ? auth.loginButton : auth.registerButton}
                </button>
              </form>
            )}

            {!success && (
              <div className="mt-6 border-t border-secondary-container/30 pt-4 text-center">
                <p className="text-xs font-medium text-on-surface-variant">
                  {mode === "login" ? auth.needAccount : auth.haveAccount}{" "}
                  <Link
                    href={`/${locale}/${mode === "login" ? "register" : "login"}`}
                    className="animate-pulse text-xs font-bold text-primary underline-offset-2 transition-colors hover:text-primary-container hover:underline"
                  >
                    {mode === "login" ? auth.switchToRegister : auth.switchToLogin}
                  </Link>
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function useSynchronizedPlaceholders(phrases: PhraseSet, reducedMotion: boolean) {
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

    const activeTexts = [phrases.fullName, phrases.phone, phrases.password].map(
      (items) => items[phraseIndex % items.length],
    );
    const maxLength = Math.max(...activeTexts.map((text) => text.length));
    let timeoutId: number;

    if (phase === "typing") {
      if (charIndex < maxLength) {
        timeoutId = window.setTimeout(() => setCharIndex((index) => index + 1), 50);
      } else {
        timeoutId = window.setTimeout(() => setPhase("holding"), 50);
      }
    } else if (phase === "holding") {
      timeoutId = window.setTimeout(() => setPhase("deleting"), 2500);
    } else if (charIndex > 0) {
      timeoutId = window.setTimeout(() => setCharIndex((index) => index - 1), 25);
    } else {
      timeoutId = window.setTimeout(() => {
        setPhraseIndex((index) => (index + 1) % 2);
        setPhase("typing");
      }, 300);
    }

    return () => window.clearTimeout(timeoutId);
  }, [charIndex, phase, phraseIndex, phrases, reducedMotion]);

  const current = phraseIndex % 2;
  const slice = (values: string[]) => (reducedMotion ? values[0] : values[current].slice(0, charIndex));

  return {
    fullName: slice(phrases.fullName),
    phone: slice(phrases.phone),
    password: slice(phrases.password),
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

type InputFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  placeholder: string;
  showCursor: boolean;
  error?: string;
  helpText?: string;
  icon: React.ReactNode;
  isRtl: boolean;
  type?: string;
  autoComplete?: string;
};

function InputField({ id, label, value, onChange, onFocus, onBlur, placeholder, showCursor, error, helpText, icon, isRtl, type = "text", autoComplete }: InputFieldProps) {
  return (
    <label className="block space-y-1" htmlFor={id}>
      <span className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant/90 ${isRtl ? "text-right" : "text-left"}`}>
        {label}
      </span>
      <span className="relative block">
        <span className={`pointer-events-none absolute inset-y-0 z-10 flex items-center text-outline-variant ${isRtl ? "right-3" : "left-3"}`}>
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={`relative z-0 block w-full rounded-lg border border-secondary-fixed-dim bg-surface-container-lowest py-3 text-sm text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
            isRtl ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"
          }`}
        />
        {!value && placeholder && (
          <span className={`pointer-events-none absolute inset-y-0 z-10 flex items-center text-sm text-on-surface-variant/50 ${isRtl ? "right-10" : "left-10"}`}>
            <span>{placeholder}</span>
            {showCursor && <span className="ms-0.5 font-mono font-semibold text-primary/70">|</span>}
          </span>
        )}
      </span>
      {helpText && <span className={`block text-[10px] text-outline ${isRtl ? "text-right" : "text-left"}`}>{helpText}</span>}
      {error && <span className={`block text-xs font-semibold text-error ${isRtl ? "text-right" : "text-left"}`}>{error}</span>}
    </label>
  );
}

type PasswordFieldProps = Omit<InputFieldProps, "id" | "type" | "icon" | "autoComplete"> & {
  showPassword: boolean;
  onTogglePassword: () => void;
};

function PasswordField(props: PasswordFieldProps) {
  const { showPassword, onTogglePassword, isRtl, value, placeholder, showCursor } = props;
  return (
    <label className="block space-y-1" htmlFor="password">
      <span className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant/90 ${isRtl ? "text-right" : "text-left"}`}>
        {props.label}
      </span>
      <span className="relative block">
        <span className={`pointer-events-none absolute inset-y-0 z-10 flex items-center text-outline-variant ${isRtl ? "right-3" : "left-3"}`}>
          <LockIcon />
        </span>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => props.onChange(event.target.value)}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          autoComplete="current-password"
          aria-invalid={Boolean(props.error)}
          className={`relative z-0 block w-full rounded-lg border border-secondary-fixed-dim bg-surface-container-lowest py-3 text-sm text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
            isRtl ? "pr-10 pl-10 text-right" : "pl-10 pr-10 text-left"
          }`}
        />
        {!value && placeholder && (
          <span className={`pointer-events-none absolute inset-y-0 z-10 flex items-center text-sm text-on-surface-variant/50 ${isRtl ? "right-10" : "left-10"}`}>
            <span>{placeholder}</span>
            {showCursor && <span className="ms-0.5 font-mono font-semibold text-primary/70">|</span>}
          </span>
        )}
        <button
          type="button"
          onClick={onTogglePassword}
          className={`absolute inset-y-0 z-20 flex items-center text-outline-variant transition-colors hover:text-primary ${isRtl ? "left-3" : "right-3"}`}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
      {props.helpText && <span className={`block text-[10px] text-outline ${isRtl ? "text-right" : "text-left"}`}>{props.helpText}</span>}
      {props.error && <span className={`block text-xs font-semibold text-error ${isRtl ? "text-right" : "text-left"}`}>{props.error}</span>}
    </label>
  );
}

function RoleButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-3 text-sm font-bold transition-all ${
        active
          ? "scale-[1.02] border-primary bg-primary-fixed text-primary shadow-sm"
          : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
      }`}
    >
      {label}
    </button>
  );
}

function SvgIcon({ children, className = "size-5" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function UserIcon() {
  return <SvgIcon className="size-[18px]"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></SvgIcon>;
}

function PhoneIcon() {
  return <SvgIcon className="size-[18px]"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6A2 2 0 0 1 22 16.9Z" /></SvgIcon>;
}

function LockIcon() {
  return <SvgIcon className="size-[18px]"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></SvgIcon>;
}

function GlobeIcon() {
  return <SvgIcon className="size-[18px]"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9s-1.1 6.5-3.3 9c-2.2-2.5-3.3-5.5-3.3-9S9.8 5.5 12 3Z" /></SvgIcon>;
}

function FarmIcon({ className = "size-5" }: { className?: string }) {
  return <SvgIcon className={className}><path d="M5 15.5h12.5M7.5 15.5V11h7l3 4.5M9.5 11V8.5h3.5l1.5 2.5" /><circle cx="7.5" cy="17.5" r="2.3" /><circle cx="17.5" cy="17.5" r="1.6" /></SvgIcon>;
}

function RoleIcon() {
  return <SvgIcon><path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-5" /></SvgIcon>;
}

function SessionIcon() {
  return <SvgIcon><path d="M4 19V5M4 19h16M7 15l4-4 3 2 5-6" /><path d="M15 7h4v4" /></SvgIcon>;
}

function SparkIcon({ className = "" }: { className?: string }) {
  return <SvgIcon className={`size-3 ${className}`}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></SvgIcon>;
}

function CheckIcon({ className = "" }: { className?: string }) {
  return <SvgIcon className={className}><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></SvgIcon>;
}

function EyeIcon() {
  return <SvgIcon className="size-[18px]"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></SvgIcon>;
}

function EyeOffIcon() {
  return <SvgIcon className="size-[18px]"><path d="m3 3 18 18" /><path d="M10.7 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.6 18.6 0 0 1-3.2 4.1" /><path d="M6.6 6.6C3.6 8.6 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.1-.9" /></SvgIcon>;
}

function ArrowIcon({ direction, className = "" }: { direction: "left" | "right"; className?: string }) {
  return (
    <SvgIcon className={`size-4 ${className}`}>
      {direction === "left" ? <path d="M19 12H5M12 19l-7-7 7-7" /> : <path d="M5 12h14M12 5l7 7-7 7" />}
    </SvgIcon>
  );
}



