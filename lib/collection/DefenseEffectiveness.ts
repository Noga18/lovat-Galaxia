export enum DefenseEffectiveness {
  DidNotDefend,
  TriedToDefend,
  Defended,
}

export type DefenseEffectivenessDescription = {
  effectiveness: DefenseEffectiveness;
  localizedDescription: string;
  localizedLongDescription: string;
  num: number;
};

export const defenseEffectivenessDescriptions = [
  {
    effectiveness: DefenseEffectiveness.Defended,
    localizedDescription: "Defended",
    localizedLongDescription:
      "The robot successfully played defense.",
    num: 2,
  },
  {
    effectiveness: DefenseEffectiveness.TriedToDefend,
    localizedDescription: "Tried to Defend",
    localizedLongDescription:
      "The robot attempted to play defense but was not effective.",
    num: 1,
  },
  {
    effectiveness: DefenseEffectiveness.DidNotDefend,
    localizedDescription: "Did Not Defend",
    localizedLongDescription:
      "The robot did not play defense.",
    num: 0,
  },
] as const satisfies DefenseEffectivenessDescription[];
