import { viewHeight, viewWidth } from "./constants.js";

export interface Transformation {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  sw: number;
  sh: number;
  rot: number;
}

export function transformAttr(transform: Transformation): string {
  const { x1, x2, y1, y2, sw, sh, rot } = transform;
  return `translate(${(x1 + x2) / 2 - viewWidth / 2} ${
    (y1 + y2) / 2 - viewHeight / 2
  }) scale(${sw} ${sh}) rotate(${rot})`;
}

export function tweenTransform(
  a: Transformation,
  b: Transformation,
  p: number
): Transformation {
  p = Math.min(1, Math.max(0, p));
  return {
    x1: (1 - p) * a.x1 + p * b.x1,
    y1: (1 - p) * a.y1 + p * b.y1,
    x2: (1 - p) * a.x2 + p * b.x2,
    y2: (1 - p) * a.y2 + p * b.y2,
    sw: (1 - p) * a.sw + p * b.sw,
    sh: (1 - p) * a.sh + p * b.sh,
    rot: (1 - p) * a.rot + p * b.rot,
  };
}
