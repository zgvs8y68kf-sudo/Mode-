"use client";

import { useRef } from "react";

/**
 * Deux façons d'ajouter une photo :
 *  - camera()  : ouvre directement l'appareil photo (attribut `capture`)
 *  - gallery() : ouvre la galerie / les fichiers (sans `capture`, sinon mobile force la caméra)
 * Rendre `inputs` quelque part dans le composant.
 */
export function usePhotoPicker(
  onFiles: (files: File[]) => void,
  { multiple = false, capture = "environment" }: { multiple?: boolean; capture?: "environment" | "user" } = {},
) {
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) onFiles(files);
  };
  const inputs = (
    <>
      <input ref={cam} type="file" accept="image/*" capture={capture} multiple={multiple} hidden onChange={handle} data-picker="camera" />
      <input ref={gal} type="file" accept="image/*" multiple={multiple} hidden onChange={handle} data-picker="gallery" />
    </>
  );
  return { camera: () => cam.current?.click(), gallery: () => gal.current?.click(), inputs };
}
