export function clamp(v: number, min: number, max: number): number {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

export function logScale(raw: number, saturationPoint: number): number {
  if (raw <= 0) return 0;
  if (saturationPoint <= 1) {
    saturationPoint = 2;
  }
  const score = (Math.log1p(raw) / Math.log1p(saturationPoint)) * 100;
  return clamp(score, 0, 100);
}

export function linearScale(raw: number, max: number): number {
  if (max <= 0) return 0;
  return clamp((raw / max) * 100, 0, 100);
}

export function ratioScale(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return clamp((numerator / denominator) * 100, 0, 100);
}

export function average(...scores: number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

export function weightedAverage(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length === 0) return 0;
  let sum = 0;
  let wsum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] * weights[i];
    wsum += weights[i];
  }
  if (wsum === 0) return 0;
  return sum / wsum;
}

export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

export function remapToRange(v: number, min: number, max: number): number {
  return clamp(Math.round(v * (max - min) / 100 + min), min, max);
}