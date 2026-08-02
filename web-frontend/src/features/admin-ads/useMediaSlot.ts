"use client";

/**
 * One reusable "pick a file, preview it, optionally remove it" slot — used
 * for all four media kinds the campaign wizard can carry (banner image,
 * banner video, poster, advertiser logo). Replaces four hand-copied
 * base64/FileReader triples (`bannerBase64`+`bannerPreview`+`handleBanner`,
 * `posterBase64`+`posterPreview`+`handlePoster`, etc.) that used to live
 * directly in useCampaignWizard.ts.
 *
 * Two things changed from the old per-field code, both deliberate:
 *
 * 1. Preview is `URL.createObjectURL(file)`, never `FileReader.readAsDataURL`.
 *    `handleVideoFile` already worked this way; every slot does now. This is
 *    what lets the wizard stop sending base64 in the JSON payload at all —
 *    the raw `File` this hook holds onto is what gets attached to the
 *    multipart request (see `src/services/ad.ts`'s `AdMediaFiles`), and the
 *    object URL is purely a local `<img>`/`<video>` preview, revoked on
 *    replace/unmount so it doesn't leak.
 * 2. `remove()` distinguishes "never had anything" from "had saved remote
 *    media and the admin explicitly cleared it" via `cleared` — the wizard's
 *    payload builder uses that flag to send an explicit `null` for the
 *    corresponding URL field, instead of silently omitting it (which is why
 *    "Remove" on a saved campaign's banner used to no-op on save).
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type MediaSlotOptions = {
  /** Existing remote URL (edit mode) — the preview until replaced or removed. */
  initialUrl?: string | null;
  /** Client-side size cap in bytes, checked before a pick is accepted. */
  maxBytes?: number;
  onError?: (message: string) => void;
};

export type MediaSlot = {
  file: File | null;
  /** Object URL for a fresh pick, the existing remote URL, or null. */
  preview: string | null;
  /** True once the admin has explicitly removed previously-saved remote media. */
  cleared: boolean;
  hasMedia: boolean;
  pick: (file: File) => void;
  remove: () => void;
};

export function useMediaSlot({ initialUrl, maxBytes, onError }: MediaSlotOptions): MediaSlot {
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  // initialUrl only matters at mount (the wizard remounts fresh per open —
  // see CampaignDrawer's session key), so a ref is enough; no need to react
  // to a changing prop mid-session.
  const remoteUrlRef = useRef(initialUrl ?? null);

  const objectUrlRef = useRef<string | null>(null);
  objectUrlRef.current = objectUrl;
  // Revoke whatever object URL is live when the component unmounts, even if
  // it was created several picks ago — capturing via ref (not `objectUrl`
  // itself) avoids a stale closure in the cleanup.
  useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }, []);

  const pick = useCallback((next: File) => {
    if (maxBytes && next.size > maxBytes) {
      onError?.(`File is too large — max ${Math.round(maxBytes / (1024 * 1024))}MB.`);
      return;
    }
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
    setFile(next);
    setCleared(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxBytes]);

  const remove = useCallback(() => {
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFile(null);
    if (remoteUrlRef.current) setCleared(true);
  }, []);

  const preview = objectUrl ?? (cleared ? null : remoteUrlRef.current);

  return { file, preview, cleared, hasMedia: !!preview, pick, remove };
}
