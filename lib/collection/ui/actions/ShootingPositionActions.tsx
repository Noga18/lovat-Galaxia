import { useReportStateStore } from "../../reportStateStore";
import { TouchableOpacity, View, Text, Modal, StyleSheet } from "react-native";
import { MatchEventPosition } from "../../MatchEventPosition";
import { MatchEventType } from "../../MatchEventType";
import { FieldElement } from "../FieldElement";
import { GamePhase } from "../../ReportState";
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

const ACCURACY_RATINGS = [1, 2, 3, 4, 5];
const FLASH_DURATION_MS = 300;

export const ShootingPositionActions = () => {
  const reportState = useReportStateStore();
  const gamePhase = reportState.gamePhase;
  const isTeleop = gamePhase === GamePhase.Teleop || gamePhase === GamePhase.Endgame;

  // Teleop: modal with accuracy rating
  const [activePosition, setActivePosition] = useState<MatchEventPosition | null>(null);
  const [accuracy, setAccuracy] = useState(0);

  // Teleop: last selected position stays highlighted
  const [selectedTeleopPosition, setSelectedTeleopPosition] = useState<MatchEventPosition | null>(null);

  // Auto: brief flash to indicate position was marked
  const [flashedPosition, setFlashedPosition] = useState<MatchEventPosition | null>(null);

  const handlePositionPress = (position: MatchEventPosition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isTeleop) {
      setSelectedTeleopPosition(position);
      setActivePosition(position);
      setAccuracy(0);
    } else {
      reportState.addEvent({
        type: MatchEventType.StartScoring,
        position: position,
      });
      setFlashedPosition(position);
      setTimeout(() => setFlashedPosition(null), FLASH_DURATION_MS);
    }
  };

  const handleAccuracySelect = (rating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAccuracy(rating);
  };

  const handleConfirm = () => {
    if (activePosition !== null && accuracy > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      reportState.addEvent({
        type: MatchEventType.StartScoring,
        position: activePosition,
      });
      reportState.addEvent({
        type: MatchEventType.StopScoring,
        position: activePosition,
        quantity: accuracy,
      });
    }
    setActivePosition(null);
    setAccuracy(0);
  };

  const handleCancel = () => {
    setActivePosition(null);
    setAccuracy(0);
  };

  const isHighlighted = (position: MatchEventPosition) => {
    if (activePosition === position) return true;
    if (flashedPosition === position) return true;
    if (isTeleop && selectedTeleopPosition === position && activePosition === null) return true;
    return false;
  };

  return (
    <>
      {shootingPositions.map(({ position, edgeInsets }) => (
        <FieldElement key={position} edgeInsets={edgeInsets}>
          <TouchableOpacity
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: isHighlighted(position)
                ? "#3EE679"
                : "#e0e0e0",
              opacity: isHighlighted(position)
                ? 0.8
                : 0.3,
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
            <Text style={styles.title}>Accuracy Rating</Text>

            <View style={styles.accuracyRow}>
              {ACCURACY_RATINGS.map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.accuracyButton,
                    accuracy === rating && styles.accuracyButtonSelected,
                  ]}
                  onPress={() => handleAccuracySelect(rating)}
                >
                  <Text
                    style={[
                      styles.accuracyButtonText,
                      accuracy === rating && styles.accuracyButtonTextSelected,
                    ]}
                  >
                    {rating}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, accuracy === 0 && styles.confirmButtonDisabled]}
              onPress={accuracy > 0 ? handleConfirm : handleCancel}
            >
              <Text style={styles.confirmButtonText}>
                {accuracy > 0 ? `Confirm (${accuracy}/5)` : "Cancel"}
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
    width: 280,
    alignItems: "center",
    gap: 20,
  },
  title: {
    color: colors.onBackground.default,
    fontFamily: "Heebo_500Medium",
    fontSize: 18,
  },
  accuracyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accuracyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondaryContainer.default,
    alignItems: "center",
    justifyContent: "center",
  },
  accuracyButtonSelected: {
    backgroundColor: "#3EE679",
  },
  accuracyButtonText: {
    color: colors.onBackground.default,
    fontSize: 20,
    fontWeight: "600",
  },
  accuracyButtonTextSelected: {
    color: "#1f1f1f",
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
