export enum IntakeSpeed {
  Slow,
  Medium,
  Fast,
}

export type IntakeSpeedDescription = {
  intakeSpeed: IntakeSpeed;
  localizedDescription: string;
  localizedLongDescription: string;
  num: number;
};

export const intakeSpeedDescriptions = [
  {
    intakeSpeed: IntakeSpeed.Slow,
    localizedDescription: "1 - Slow",
    localizedLongDescription:
      "The robot picks up fuel slowly.",
    num: 1,
  },
  {
    intakeSpeed: IntakeSpeed.Medium,
    localizedDescription: "2 - Medium",
    localizedLongDescription:
      "The robot picks up fuel at an average pace.",
    num: 2,
  },
  {
    intakeSpeed: IntakeSpeed.Fast,
    localizedDescription: "3 - Fast",
    localizedLongDescription:
      "The robot picks up fuel quickly.",
    num: 3,
  },
] as const satisfies IntakeSpeedDescription[];
