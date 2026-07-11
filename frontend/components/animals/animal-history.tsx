"use client";

import { useCallback, useEffect, useState } from "react";

import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/animals/animal-ui";
import { sortHistoryNewest } from "@/lib/animal-utils";
import { ApiError, apiClient } from "@/lib/api-client";
import { dateLocale, type Dictionary, type Locale } from "@/lib/i18n";
import type { AnimalHistoryEvent } from "@/types/animal";

export function AnimalHistory({
  animalId,
  token,
  locale,
  dictionary,
  onAuthError,
}: {
  animalId: string;
  token: string;
  locale: Locale;
  dictionary: Dictionary;
  onAuthError: (error: unknown) => boolean;
}) {
  const [events, setEvents] = useState<AnimalHistoryEvent[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const text = dictionary.animals.history;

  const load = useCallback(async () => {
    setState("loading");
    try {
      setEvents(sortHistoryNewest(await apiClient.getAnimalHistory(token, animalId)));
      setState("ready");
    } catch (loadError) {
      if (onAuthError(loadError)) return;
      setError(loadError instanceof ApiError ? loadError.detail : text.error);
      setState("error");
    }
  }, [animalId, onAuthError, text.error, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-black text-primary">{text.title}</h2>
      {state === "loading" ? <LoadingPanel label={text.loading} /> : null}
      {state === "error" ? <ErrorPanel title={dictionary.common.error} message={error} retry={load} retryLabel={dictionary.common.retry} /> : null}
      {state === "ready" && events.length === 0 ? <EmptyPanel title={text.emptyTitle} description={text.emptyDescription} /> : null}
      {state === "ready" && events.length > 0 ? (
        <ol className="relative space-y-4 border-s-2 border-secondary-container ps-5">
          {events.map((event, index) => (
            <li key={`${event.event_type}-${event.occurred_at}-${index}`} className="relative rounded-xl border border-secondary-container bg-white p-4 shadow-sm">
              <span className="absolute -start-[1.72rem] top-5 size-3 rounded-full border-2 border-white bg-primary" />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-sm font-black text-primary">{dictionary.animals.values[event.event_type as keyof typeof dictionary.animals.values] ?? event.event_type}</h3>
                <time className="text-xs text-on-surface-variant">{new Date(event.occurred_at).toLocaleDateString(dateLocale(locale))}</time>
              </div>
              <EventDetails event={event} dictionary={dictionary} />
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

function EventDetails({ event, dictionary }: { event: AnimalHistoryEvent; dictionary: Dictionary }) {
  const weight = typeof event.data.weight_kg === "number" || typeof event.data.weight_kg === "string" ? String(event.data.weight_kg) : null;
  const title = typeof event.data.title === "string" ? event.data.title : null;
  const type = typeof event.data.record_type === "string" ? event.data.record_type : null;
  if (weight) return <p className="mt-2 text-sm text-on-surface-variant">{dictionary.animals.history.weight.replace("{weight}", weight)}</p>;
  if (title && type) return <p className="mt-2 text-sm text-on-surface-variant">{dictionary.animals.history.health.replace("{type}", dictionary.animals.values[type as keyof typeof dictionary.animals.values] ?? type).replace("{title}", title)}</p>;
  return null;
}
