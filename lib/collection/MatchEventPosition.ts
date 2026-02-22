export enum MatchEventPosition {
  LeftTrench,
  LeftBump,
  Hub,
  RightTrench,
  RightBump,
  NeutralZone,
  Depot,
  Outpost,
  None,
  CenterBack,
}

export const startingPositions = {
  LeftTrench: MatchEventPosition.LeftTrench,
  LeftBump: MatchEventPosition.LeftBump,
  Hub: MatchEventPosition.Hub,
  RightBump: MatchEventPosition.RightBump,
  RightTrench: MatchEventPosition.RightTrench,
  CenterBack: MatchEventPosition.CenterBack,
} as const satisfies Record<string, MatchEventPosition>;
