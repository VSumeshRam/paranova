export const BKT_PARAMS = {
  P_L0: 0.10, // Initial prior mastery probability
  P_T: 0.15,  // Transition probability from unlearned to learned state
  P_G: 0.20,  // Guess probability - correct response despite not knowing
  P_S: 0.05,  // Slip probability - incorrect response despite knowing
  MASTERY_THRESHOLD: 0.85, // Threshold to consider a node mastered
};

/**
 * Calculates the updated mastery probability given an observation.
 * @param p_L_t_minus_1 The probability of learning at step t-1 (prior mastery)
 * @param observation 1 for correct, 0 for incorrect
 * @returns The updated probability of learning at step t+1
 */
export function calculateBKT(p_L_t_minus_1: number, observation: 0 | 1): number {
  const { P_T, P_G, P_S } = BKT_PARAMS;

  // 1. Prior Probability of Correct Response:
  // P(C_t) = P(L_{t-1}) * (1 - P(S)) + (1 - P(L_{t-1})) * P(G)
  const p_C_t = p_L_t_minus_1 * (1 - P_S) + (1 - p_L_t_minus_1) * P_G;

  // 2. Posterior Update:
  let p_L_t_given_Obs: number;
  if (observation === 1) {
    // P(L_t | Obs = 1) = (P(L_{t-1}) * (1 - P(S))) / P(C_t)
    p_L_t_given_Obs = (p_L_t_minus_1 * (1 - P_S)) / p_C_t;
  } else {
    // P(L_t | Obs = 0) = (P(L_{t-1}) * P(S)) / (1 - P(C_t))
    p_L_t_given_Obs = (p_L_t_minus_1 * P_S) / (1 - p_C_t);
  }

  // 3. Forward State Transition for Step t+1:
  // P(L_{t+1}) = P(L_t | Obs) + (1 - P(L_t | Obs)) * P(T)
  const p_L_t_plus_1 = p_L_t_given_Obs + (1 - p_L_t_given_Obs) * P_T;

  return p_L_t_plus_1;
}

/**
 * Calculates Cognitive Friction Score (CFS)
 * @param TTFA Time-to-First-Action in milliseconds
 * @param HP Hesitation Pauses
 * @param AF Answer Flips
 * @returns CFS normalized between 0.0 and 1.0
 */
export function calculateCFS(TTFA: number, HP: number, AF: number): number {
  const cfs = (TTFA / 60000) * 0.4 + (HP / 5) * 0.35 + (AF / 4) * 0.25;
  return Math.min(1.0, cfs);
}

/**
 * Checks if the Cognitive Overload Preemption should be triggered
 */
export function isCognitiveOverload(cfs: number, ttfa: number): boolean {
  return cfs >= 0.65 || ttfa >= 25000;
}
