export enum Speed {
  Slow,
  Medium,
  Fast,
}

export type SpeedDescription = {
  speed: Speed;
  localizedDescription: string;
  localizedLongDescription: string;
  num: number;
};

export const speedDescriptions = [
  {
    speed: Speed.Slow,
    localizedDescription: "1 - Slow",
    localizedLongDescription:
      "The robot shoots slowly with long pauses between shots.",
    num: 1,
  },
  {
    speed: Speed.Medium,
    localizedDescription: "2 - Medium",
    localizedLongDescription:
      "The robot shoots at an average pace.",
    num: 2,
  },
  {
    speed: Speed.Fast,
    localizedDescription: "3 - Fast",
    localizedLongDescription:
      "The robot shoots quickly with minimal pauses.",
    num: 3,
  },
] as const satisfies SpeedDescription[];
