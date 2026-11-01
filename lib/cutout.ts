"use client";

/**
 * Détoure un vêtement à partir du polygone renvoyé par l'IA ([y, x] en 0–1000) :
 * pièce seule, recadrée, sur fond blanc (JPEG léger, se fond dans les planches de tenues).
 */
export async function makeCutout(photo: string, outline: number[][], size = 600): Promise<string | undefined> {
  const pts = outline.filter((p) => Array.isArray(p) && p.length === 2);
  if (pts.length < 6) return undefined;
  const img = new Image();
  img.src = photo;
  await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const xy = pts.map(([y, x]) => [(x / 1000) * W, (y / 1000) * H]);
  const xs = xy.map((p) => p[0]), ys = xy.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const bw = maxX - minX, bh = maxY - minY;
  if (bw < W * 0.08 || bh < H * 0.08) return undefined; // contour incohérent

  const pad = 0.08;
  const side = Math.max(bw, bh) * (1 + pad * 2);
  const scale = size / side;
  const ox = (size - bw * scale) / 2 - minX * scale;
  const oy = (size - bh * scale) / 2 - minY * scale;

  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, size, size);
  g.save();
  g.beginPath();
  xy.forEach(([x, y], i) => (i ? g.lineTo(x * scale + ox, y * scale + oy) : g.moveTo(x * scale + ox, y * scale + oy)));
  g.closePath();
  g.clip();
  g.drawImage(img, ox, oy, W * scale, H * scale);
  g.restore();
  return c.toDataURL("image/jpeg", 0.85);
}

/** Recompresse une image (data URL ou URL) en JPEG carré fond blanc. */
export async function toWhiteJpeg(src: string, size = 600): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, size, size);
  const s = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  g.drawImage(img, (size - img.naturalWidth * s) / 2, (size - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
  return c.toDataURL("image/jpeg", 0.85);
}
