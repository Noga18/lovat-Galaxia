import { useReportStateStore } from "../../reportStateStore";
import { TouchableOpacity } from "react-native";
import { MatchEventPosition } from "../../MatchEventPosition";
import { FieldElement } from "../FieldElement";
import { StartingPosition } from "../../ReportState";
import React from "react";
import { figmaDimensionsToFieldInsets } from "../../util";

export const PreMatchActions = () => {
  const reportState = useReportStateStore();

  // 6 starting positions arranged in a 3x2 rectangle:
  // Front row (closer to alliance wall) and back row (further from wall)
  const buttonPositions: Array<{
    position: StartingPosition;
    edgeInsets: [number, number, number, number];
  }> = [
    // Front row (3 positions)
    {
      position: MatchEventPosition.LeftTrench,
      edgeInsets: figmaDimensionsToFieldInsets({
        x: 65,
        y: 15,
        width: 55,
        height: 90,
      }),
    },
    {
      position: MatchEventPosition.Hub,
      edgeInsets: figmaDimensionsToFieldInsets({
        x: 65,
        y: 120,
        width: 55,
        height: 90,
      }),
    },
    {
      position: MatchEventPosition.RightTrench,
      edgeInsets: figmaDimensionsToFieldInsets({
        x: 65,
        y: 225,
        width: 55,
        height: 90,
      }),
    },
    // Back row (3 positions)
    {
      position: MatchEventPosition.LeftBump,
      edgeInsets: figmaDimensionsToFieldInsets({
        x: 140,
        y: 15,
        width: 55,
        height: 90,
      }),
    },
    {
      position: MatchEventPosition.CenterBack,
      edgeInsets: figmaDimensionsToFieldInsets({
        x: 140,
        y: 120,
        width: 55,
        height: 90,
      }),
    },
    {
      position: MatchEventPosition.RightBump,
      edgeInsets: figmaDimensionsToFieldInsets({
        x: 140,
        y: 225,
        width: 55,
        height: 90,
      }),
    },
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
              opacity: reportState.startPosition === position ? 0.8 : 0.3,
              borderRadius: 7,
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
