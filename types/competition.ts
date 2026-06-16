export interface BracketConfig {
  bracketSize: number; // 2, 4, 8, 16, 32, 64
  thirdPlace: boolean;
  bestOf: number; // usually 1
}

export interface GroupStageConfig {
  numGroups: number;
  teamsPerGroup: number;
  advanceCount: number;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  bracketSize?: number; // bracket after group stage
}

export interface TimeTrialConfig {
  scoreUnit: string; // "waktu" | "nilai"
  sortOrder: "ASC" | "DESC"; // ASC (fastest/lowest) or DESC (highest)
  bestOf: number;
}

export type CompetitionConfig = BracketConfig | GroupStageConfig | TimeTrialConfig;

// Use this helper to safely parse competition config
export function parseCompetitionConfig<T extends CompetitionConfig>(configString: string | null): Partial<T> {
  if (!configString) return {};
  try {
    return JSON.parse(configString) as Partial<T>;
  } catch (error) {
    console.error("Failed to parse competition config", error);
    return {};
  }
}
