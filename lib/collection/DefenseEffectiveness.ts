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
    localizedDescription: "Crossed to Other Side",
    localizedLongDescription:
      "The robot only crossed to the other side of the field.",
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
