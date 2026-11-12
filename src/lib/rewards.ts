const key = (profileId: string, slug: string) => `ms:rewards:${profileId}:${slug}`;

export interface Rewards {
  /** Sticker keys (`page:index`) the reader has touched. */
  found: string[];
  /** Page numbers whose question was answered correctly. */
  answered: number[];
}

export const noRewards: Rewards = { found: [], answered: [] };

/** Defensive parse: anything unexpected becomes "no rewards yet". */
export function parseRewards(raw: string | null): Rewards {
  if (!raw) return noRewards;
  try {
    const data = JSON.parse(raw) as Partial<Rewards>;
    return {
      found: Array.isArray(data.found) ? data.found.filter((v): v is string => typeof v === 'string') : [],
      answered: Array.isArray(data.answered) ? data.answered.filter((v): v is number => Number.isInteger(v)) : [],
    };
  } catch {
    return noRewards;
  }
}

export function loadRewards(profileId: string, slug: string): Rewards {
  try {
    return parseRewards(localStorage.getItem(key(profileId, slug)));
  } catch {
    return noRewards;
  }
}

export function saveRewards(profileId: string, slug: string, rewards: Rewards): void {
  try {
    if (rewards.found.length === 0 && rewards.answered.length === 0) localStorage.removeItem(key(profileId, slug));
    else localStorage.setItem(key(profileId, slug), JSON.stringify(rewards));
  } catch {
    /* storage unavailable: stars last for this visit only */
  }
}
