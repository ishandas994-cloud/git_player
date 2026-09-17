import * as normalize from "./normalize.js";
import { CategoryScores } from "./categories.js";

export interface AttributeMix {
  Activity?: number;
  Projects?: number;
  OpenSource?: number;
  Popularity?: number;
  Consistency?: number;
  Technical?: number;
}

export const pacMix: AttributeMix = { Activity: 0.70, Consistency: 0.20, Projects: 0.10 };
export const shoMix: AttributeMix = { Projects: 0.65, Activity: 0.20, Popularity: 0.15 };
export const pasMix: AttributeMix = { OpenSource: 0.85, Popularity: 0.15 };
export const driMix: AttributeMix = { Technical: 0.80, Projects: 0.20 };
export const defMix: AttributeMix = { Projects: 0.45, Consistency: 0.35, OpenSource: 0.20 };
export const phyMix: AttributeMix = { Consistency: 0.70, Activity: 0.30 };

export interface CategoryWeights {
  Activity: number;
  Projects: number;
  OpenSource: number;
  Popularity: number;
  Consistency: number;
  Technical: number;
}

export const DefaultWeights: CategoryWeights = {
  Activity: 0.25,
  Projects: 0.20,
  OpenSource: 0.15,
  Popularity: 0.15,
  Consistency: 0.15,
  Technical: 0.10,
};