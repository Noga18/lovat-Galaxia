import { useReportStateStore } from "../../reportStateStore";
import { TouchableOpacity } from "react-native";
import { MatchEventPosition } from "../../MatchEventPosition";
import { FieldElement } from "../FieldElement";
import { StartingPosition } from "../../ReportState";
import React from "react";
import { figmaDimensionsToFieldInsets } from "../../util";

export const PreMatchActions = () => {
  const reportState = useReportStateStore();

  // 5 starting positions in a single column, flush with the field start line.
  // Heights divide 337px into 5 equal slots: 68+68+67+67+67 = 337
  const buttonPositions: Array<{
    position: StartingPosition;
    edgeInsets: [number, number, number, number];
  }> = [
    { position: MatchEventPosition.LeftTrench,  edgeInsets: figmaDimensionsToFieldInsets({ x: 0, y: 0,   width: 75, height: 68 }) },
    { position: MatchEventPosition.LeftBump,    edgeInsets: figmaDimensionsToFieldInsets({ x: 0, y: 68,  width: 75, height: 68 }) },
    { position: MatchEventPosition.Hub,         edgeInsets: figmaDimensionsToFieldInsets({ x: 0, y: 136, width: 75, height: 67 }) },
    { position: MatchEventPosition.RightBump,   edgeInsets: figmaDimensionsToFieldInsets({ x: 0, y: 203, width: 75, height: 67 }) },
    { position: MatchEventPosition.RightTrench, edgeInsets: figmaDimensionsToFieldInsets({ x: 0, y: 270, width: 75, height: 67 }) },
  ];

  return (
    <>
      {buttonPositions.map(({ position, edgeInsets }) => (
        <FieldElement key={position} edgeInsets={edgeInsets}>
          <TouchableOpacity
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#e0e0e0",
              opacity: reportState.startPosition === position ? 0.85 : 0.3,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.45)",
            }}
            activeOpacity={0.2}
            onPress={() => {
              console.log({ position });
              reportState.setStartPosition(position);
            }}
          />
        </FieldElement>
      ))}
    </>
  );
};
