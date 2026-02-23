import { useReportStateStore } from "../../reportStateStore";
import { TouchableOpacity, View, Text, Modal, StyleSheet } from "react-native";
import { MatchEventPosition } from "../../MatchEventPosition";
import { MatchEventType } from "../../MatchEventType";
import { FieldElement } from "../FieldElement";
import React, { useState } from "react";
import { figmaDimensionsToFieldInsets } from "../../util";
import * as Haptics from "expo-haptics";
import { colors } from "../../../colors";

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
  const [activePosition, setActivePosition] = useState<MatchEventPosition | null>(null);
  const [count, setCount] = useState(0);

  const handlePositionPress = (position: MatchEventPosition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActivePosition(position);
    setCount(0);
  };

  const handleIncrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCount((prev) => prev + 1);
  };

  const handleDecrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCount((prev) => Math.max(0, prev - 1));
  };

  const handleConfirm = () => {
    if (activePosition !== null && count > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      reportState.addEvent({
        type: MatchEventType.StartScoring,
        position: activePosition,
      });
      reportState.addEvent({
        type: MatchEventType.StopScoring,
        position: activePosition,
        quantity: count,
      });
    }
    setActivePosition(null);
    setCount(0);
  };

  const handleCancel = () => {
    setActivePosition(null);
    setCount(0);
  };

  return (
    <>
      {shootingPositions.map(({ position, edgeInsets }) => (
        <FieldElement key={position} edgeInsets={edgeInsets}>
          <TouchableOpacity
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: activePosition === position ? "#3EE679" : "#e0e0e0",
              opacity: activePosition === position ? 0.8 : 0.3,
              borderRadius: 7,
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.6}
            onPress={() => handlePositionPress(position)}
          />
        </FieldElement>
      ))}

      <Modal
        visible={activePosition !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.title}>Fuel Scored</Text>

            <View style={styles.counterRow}>
              <TouchableOpacity
                style={[styles.counterButton, count === 0 && styles.counterButtonDisabled]}
                onPress={handleDecrement}
                disabled={count === 0}
              >
                <Text style={styles.counterButtonText}>−</Text>
              </TouchableOpacity>

              <Text style={styles.countText}>{count}</Text>

              <TouchableOpacity
                style={styles.counterButton}
                onPress={handleIncrement}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, count === 0 && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={count === 0}
            >
              <Text style={styles.confirmButtonText}>
                {count === 0 ? "Cancel" : `Confirm (${count})`}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.background.default,
    borderRadius: 16,
    padding: 24,
    width: 260,
    alignItems: "center",
    gap: 20,
  },
  title: {
    color: colors.onBackground.default,
    fontFamily: "Heebo_500Medium",
    fontSize: 18,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  counterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondaryContainer.default,
    alignItems: "center",
    justifyContent: "center",
  },
  counterButtonDisabled: {
    opacity: 0.3,
  },
  counterButtonText: {
    color: colors.onBackground.default,
    fontSize: 28,
    fontWeight: "600",
  },
  countText: {
    color: colors.onBackground.default,
    fontFamily: "Heebo_500Medium",
    fontSize: 48,
    minWidth: 60,
    textAlign: "center",
  },
  confirmButton: {
    backgroundColor: "#3EE679",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray.default,
  },
  confirmButtonText: {
    color: "#1f1f1f",
    fontFamily: "Heebo_500Medium",
    fontSize: 16,
    fontWeight: "600",
  },
});
