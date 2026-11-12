/** A grown-up check shown before any payment screen: easy for an adult, hard for a toddler to guess. */
export interface GateChallenge {
  a: number;
  b: number;
}

const digit = (rand: () => number) => 6 + Math.floor(rand() * 4); // 6..9 keeps it a real multiplication fact

export const createChallenge = (rand: () => number = Math.random): GateChallenge => ({ a: digit(rand), b: digit(rand) });

export const isCorrect = (c: GateChallenge, answer: string): boolean => answer.trim() !== '' && Number(answer) === c.a * c.b;
