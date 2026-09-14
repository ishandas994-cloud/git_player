import * as normalize from "./normalize";

interface AttributeMix {
  Activity?: number;
  Projects?: number;
  OpenSource?: number;
  Popularity?: number;
  Consistency?: number;
  Technical?: number;
}

export interface Attributes {
  pac: number; // Development Speed
  sho: number; // Project Execution
  pas: number; // Collaboration
  dri: number; // Technical Versatility
  def: number; // Code Discipline
  phy: number; // Developer Consistency
}

function applyMix(c: { Activity: number; Projects: number; OpenSource: number; Popularity: number; Consistency: number; Technical: number }, mix: AttributeMix): number {
  const val =
    c.Activity * (mix.Activity || 0) +
    c.Projects * (mix.Projects || 0) +
    c.OpenSource * (mix.OpenSource || 0) +
    c.Popularity * (mix.Popularity || 0) +
    c.Consistency * (mix.Consistency || 0) +
    c.Technical * (mix.Technical || 0);
  return Math.floor(normalize.clamp(val, 0, 100) + 0.5);
}

export function computeAttributes(c: { Activity: number; Projects: number; OpenSource: number; Popularity: number; Consistency: number; Technical: number }): Attributes {
  return {
    pac: applyMix(c, { Activity: 0.70, Consistency: 0.20, Projects: 0.10 }),
    sho: applyMix(c, { Projects: 0.65, Activity: 0.20, Popularity: 0.15 }),
    pas: applyMix(c, { OpenSource: 0.85, Popularity: 0.15 }),
    dri: applyMix(c, { Technical: 0.80, Projects: 0.20 }),
    def: applyMix(c, { Projects: 0.45, Consistency: 0.35, OpenSource: 0.20 }),
    phy: applyMix(c, { Consistency: 0.70, Activity: 0.30 }),
  };
}