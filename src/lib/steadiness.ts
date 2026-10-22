// Gyroscope rotation rate (rad/s) at which the meter reads full.
export const MAX_MOTION = 1.5;

export type Steadiness = "Steady" | "Some movement" | "Shaky";

// Rough cutoffs: holding a phone still while typing sits well under 0.2 rad/s.
export function getSteadiness(motion: number): Steadiness {
  if (motion < 0.2) return "Steady";
  if (motion < 0.6) return "Some movement";
  return "Shaky";
}
