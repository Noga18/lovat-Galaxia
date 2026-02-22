import { useReportStateStore } from "../../reportStateStore";
import { TouchableOpacity } from "react-native";
import { MatchEventPosition } from "../../MatchEventPosition";
import { MatchEventType } from "../../MatchEventType";
import { FieldElement } from "../FieldElement";
import React, { useState } from "react";
import { figmaDimensionsToFieldInsets } from "../../util";
import * as Haptics from "expo-haptics";
import { Icon } from "../../../components/Icon";

const FLASH_DURATION_MS = 300;

// 6 shooting positions arranged in a 3x2 rectangle
const shootingPositions: Array<{
  position: MatchEventPosition;
  edgeInsets: [number, number, number, number];
}> = [
  // Front row (3 positions, closer to alliance wall)
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
  // Back row (3 positions, further from wall)
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

export const ShootingPositionActions = () => {
  const reportState = useReportStateStore();
  const [flashedPosition, setFlashedPosition] = useState<MatchEventPosition | null>(null);

  const handleShoot = (position: MatchEventPosition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Record a complete scoring event pair (start + stop with quantity 1)
    reportState.addEvent({
      type: MatchEventType.StartScoring,
      position: position,
    });
    reportState.addEvent({
      type: MatchEventType.StopScoring,
      position: position,
      quantity: 1,
    });

    // Brief visual feedback
    setFlashedPosition(position);
    setTimeout(() => setFlashedPosition(null), FLASH_DURATION_MS);
  };

  return (
    <>
      {shootingPositions.map(({ position, edgeInsets }) => (
        <FieldElement key={position} edgeInsets={edgeInsets}>
          <TouchableOpacity
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: flashedPosition === position ? "#3EE679" : "#e0e0e0",
              opacity: flashedPosition === position ? 0.8 : 0.3,
              borderRadius: 7,
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.6}
            onPress={() => handleShoot(position)}
          >
            {flashedPosition === position && (
              <Icon name="check" color="#ffffff" size={32} />
            )}
          </TouchableOpacity>
        </FieldElement>
      ))}
    </>
  );
};
