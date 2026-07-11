"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimalImage, ConfirmationDialog, EmptyPanel, ErrorPanel, LoadingPanel, Notice } from "@/components/animals/animal-ui";
import { maxAnimalPhotos, primaryPhoto, validatePhoto } from "@/lib/animal-utils";
import { ApiError, apiClient } from "@/lib/api-client";
import type { Dictionary } from "@/lib/i18n";
import type { Animal, AnimalPhoto } from "@/types/animal";

export function AnimalPhotoGallery({
  animal,
  token,
  dictionary: rootDictionary,
  onAuthError,
}: {
  animal: Animal;
  token: string;
  dictionary: Dictionary;
  onAuthError: (error: unknown) => boolean;
}) {
  const [photos, setPhotos] = useState<AnimalPhoto[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const dictionary: GalleryDictionary = {
    ...rootDictionary.animals.photos,
    retry: rootDictionary.common.retry,
    cancel: rootDictionary.animals.form.cancel,
    animalValues: rootDictionary.animals.values,
  };

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      setPhotos(await apiClient.listAnimalPhotos(token, animal.id));
      setState("ready");
    } catch (loadError) {
      if (onAuthError(loadError)) return;
      setError(loadError instanceof ApiError ? loadError.detail : dictionary.uploadError);
      setState("error");
    }
  }, [animal.id, dictionary.uploadError, onAuthError, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (state === "loading") return <LoadingPanel label={dictionary.loading} />;
  if (state === "error") return <ErrorPanel title={dictionary.title} message={error} retry={load} retryLabel={dictionary.retry} />;
  return <PhotoManager animal={animal} token={token} photos={photos} setPhotos={setPhotos} onReload={load} onAuthError={onAuthError} dictionary={dictionary} />;
}

type GalleryDictionary = Dictionary["animals"]["photos"] & { retry: string; cancel: string; animalValues: Dictionary["animals"]["values"] };

function PhotoManager({
  animal,
  token,
  photos,
  setPhotos,
  onReload,
  onAuthError,
  dictionary,
}: {
  animal: Animal;
  token: string;
  photos: AnimalPhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<AnimalPhoto[]>>;
  onReload: () => Promise<void>;
  onAuthError: (error: unknown) => boolean;
  dictionary: GalleryDictionary;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [validation, setValidation] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [settingPrimary, setSettingPrimary] = useState("");
  const [deletePhoto, setDeletePhoto] = useState<AnimalPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lightbox, setLightbox] = useState<AnimalPhoto | null>(null);
  const main = primaryPhoto(photos);

  useEffect(() => {
    if (!file) {
      const timer = window.setTimeout(() => setPreview(""), 0);
      return () => window.clearTimeout(timer);
    }
    const url = URL.createObjectURL(file);
    const timer = window.setTimeout(() => setPreview(url), 0);
    return () => {
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    if (!lightbox) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [lightbox]);

  const selectFile = (selected?: File) => {
    setNotice("");
    setActionError("");
    setValidation("");
    if (!selected) {
      setFile(null);
      return;
    }
    const issue = validatePhoto(selected, photos.length);
    if (issue) {
      setFile(null);
      setValidation(dictionary[issue]);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setFile(selected);
  };

  const upload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setActionError("");
    try {
      await apiClient.uploadAnimalPhoto(token, animal.id, file);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setNotice(dictionary.uploadSuccess);
      await onReload();
    } catch (uploadError) {
      if (!onAuthError(uploadError)) setActionError(uploadError instanceof ApiError ? uploadError.detail : dictionary.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const makePrimary = async (photo: AnimalPhoto) => {
    if (settingPrimary) return;
    setSettingPrimary(photo.id);
    setActionError("");
    try {
      await apiClient.setPrimaryAnimalPhoto(token, animal.id, photo.id);
      setPhotos((current) => current.map((item) => ({ ...item, is_primary: item.id === photo.id })));
      setNotice(dictionary.primarySuccess);
    } catch (primaryError) {
      if (!onAuthError(primaryError)) setActionError(primaryError instanceof ApiError ? primaryError.detail : dictionary.primaryError);
    } finally {
      setSettingPrimary("");
    }
  };

  const confirmDelete = async () => {
    if (!deletePhoto || deleting) return;
    setDeleting(true);
    setActionError("");
    try {
      await apiClient.deleteAnimalPhoto(token, animal.id, deletePhoto.id);
      setDeletePhoto(null);
      setNotice(dictionary.deleteSuccess);
      await onReload();
    } catch (deleteError) {
      if (!onAuthError(deleteError)) setActionError(deleteError instanceof ApiError ? deleteError.detail : dictionary.deleteError);
    } finally {
      setDeleting(false);
    }
  };

  const animalName = animal.breed ? `${dictionary.animalValues[animal.species]} ${animal.breed}` : dictionary.animalValues[animal.species];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-primary">{dictionary.title}</h2>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">{dictionary.count.replace("{count}", String(photos.length))}</p>
        </div>
      </div>
      <Notice message={notice} />
      <Notice message={actionError || validation} error />

      {photos.length === 0 ? <EmptyPanel title={dictionary.emptyTitle} description={dictionary.emptyDescription} /> : (
        <>
          <button type="button" onClick={() => main && setLightbox(main)} className="block w-full overflow-hidden rounded-2xl border border-secondary-container bg-surface-container-high text-start">
            <AnimalImage photo={main} alt={animalName} className="h-64 w-full sm:h-80" />
          </button>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {photos.map((photo) => (
              <article key={photo.id} className="overflow-hidden rounded-xl border border-secondary-container bg-white">
                <button type="button" onClick={() => setLightbox(photo)} aria-label={dictionary.open} className="block w-full">
                  <AnimalImage photo={photo} alt={animalName} lazy className="h-28 w-full" />
                </button>
                <div className="space-y-2 p-2">
                  {photo.is_primary ? <span className="block text-center text-[10px] font-black uppercase text-success">{dictionary.primary}</span> : (
                    <button type="button" disabled={Boolean(settingPrimary)} onClick={() => void makePrimary(photo)} className="min-h-9 w-full rounded-lg bg-surface-container px-2 text-[11px] font-bold text-primary disabled:opacity-60">
                      {settingPrimary === photo.id ? dictionary.settingPrimary : dictionary.setPrimary}
                    </button>
                  )}
                  <button type="button" onClick={() => setDeletePhoto(photo)} className="min-h-9 w-full rounded-lg px-2 text-[11px] font-bold text-error hover:bg-error-container/40">{dictionary.delete}</button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <div className="rounded-2xl border border-secondary-container bg-surface-container-low p-4 sm:p-5">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectFile(event.target.files?.[0])} disabled={photos.length >= maxAnimalPhotos || uploading} className="sr-only" id="animal-photo-file" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {preview ? (
            // Local object URLs are safe for a temporary preview.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={dictionary.preview} className="h-28 w-full rounded-xl object-cover sm:w-36" />
          ) : null}
          <div className="flex-1">
            <p className="text-xs text-on-surface-variant">{photos.length >= maxAnimalPhotos ? dictionary.maximum : dictionary.supported}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label htmlFor="animal-photo-file" aria-disabled={photos.length >= maxAnimalPhotos || uploading} className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-primary px-4 py-2.5 text-sm font-bold text-primary aria-disabled:pointer-events-none aria-disabled:opacity-50">
                {file ? dictionary.replace : dictionary.select}
              </label>
              {file ? <button type="button" disabled={uploading} onClick={() => void upload()} className="min-h-11 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary disabled:cursor-wait disabled:opacity-60">{uploading ? dictionary.uploading : dictionary.upload}</button> : null}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationDialog open={Boolean(deletePhoto)} title={dictionary.deleteTitle} description={dictionary.deleteDescription} cancelLabel={dictionary.cancel} confirmLabel={dictionary.deleteConfirm} pendingLabel={dictionary.deleting} pending={deleting} error={actionError} onCancel={() => setDeletePhoto(null)} onConfirm={() => void confirmDelete()} />

      {lightbox ? (
        <div role="dialog" aria-modal="true" aria-label={dictionary.open} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4">
          <button autoFocus type="button" onClick={() => setLightbox(null)} className="absolute end-4 top-4 min-h-11 rounded-full bg-white px-4 text-sm font-bold text-primary">{dictionary.close}</button>
          <AnimalImage photo={lightbox} alt={animalName} className="max-h-[85vh] max-w-full rounded-xl object-contain" />
        </div>
      ) : null}
    </section>
  );
}
