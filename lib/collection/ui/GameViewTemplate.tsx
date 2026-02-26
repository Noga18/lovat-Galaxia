import {
  Pressable,
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from "react-native";
import { colors } from "../../colors";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FieldImage,
  fieldHeight,
  fieldWidth,
} from "../../components/FieldImage";
import { Text } from "react-native";
import LabelSmall from "../../components/text/LabelSmall";
import {
  AllianceColor,
  getAllianceColorDescription,
} from "../../models/AllianceColor";
import { IconButton } from "../../components/IconButton";
import * as Haptics from "expo-haptics";
import { GameTimer } from "./GameTimer";
import { StatusBar } from "expo-status-bar";
import { useReportStateStore } from "../reportStateStore";
import React, { useState } from "react";
import { Icon } from "../../components/Icon";
import { MatchEventType } from "../MatchEventType";
import { MatchEventPosition } from "../MatchEventPosition";
import { GamePhase } from "../ReportState";
import {
  FieldOrientation,
  useFieldOrientationStore,
} from "../../storage/userStores";

const ACCURACY_RATINGS = [1, 2, 3, 4, 5];

export const GameViewTemplate = (props: {
  field: React.ReactNode;
  topLeftReplacement?: React.ReactNode;
  gamePhaseMessage: string;
  startEnabled?: boolean;
  overlay: boolean;
  setOverlay: (value: boolean) => void;
  onEnd: () => void;
  onRestart: () => void;
}) => {
  const reportState = useReportStateStore();
  const fieldOrientation = useFieldOrientationStore((state) => state.value);
  const { gamePhaseMessage, field, startEnabled } = props;
  const isTeleop =
    reportState.gamePhase === GamePhase.Teleop ||
    reportState.gamePhase === GamePhase.Endgame;
  const allianceColor = reportState.meta?.allianceColor;

  const shootingOnLeft = (() => {
    if (fieldOrientation === FieldOrientation.Auspicious) {
      return allianceColor !== AllianceColor.Blue;
    } else {
      return allianceColor === AllianceColor.Blue;
    }
  })();

  const [showMovingModal, setShowMovingModal] = useState(false);
  const [movingAccuracy, setMovingAccuracy] = useState(0);

  const handleShootWhileMoving = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isTeleop) {
      setShowMovingModal(true);
      setMovingAccuracy(0);
    } else {
      // In Auto: just record the event
      reportState.addEvent({
        type: MatchEventType.StartScoring,
        position: MatchEventPosition.NeutralZone,
      });
    }
  };

  const handleMovingConfirm = () => {
    if (movingAccuracy > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      reportState.addEvent({
        type: MatchEventType.StartScoring,
        position: MatchEventPosition.NeutralZone,
      });
      reportState.addEvent({
        type: MatchEventType.StopScoring,
        position: MatchEventPosition.NeutralZone,
        quantity: movingAccuracy,
      });
    }
    setShowMovingModal(false);
    setMovingAccuracy(0);
  };

  const handleMovingCancel = () => {
    setShowMovingModal(false);
    setMovingAccuracy(0);
  };

  if (!reportState.meta) return null;

  return (
    <>
      <StatusBar hidden={true} backgroundColor={colors.background.default} />
      <GameViewOverlay overlay={props.overlay} setOverlay={props.setOverlay} />
      <View
        style={{
          backgroundColor: colors.secondaryContainer.default,
          paddingVertical: 7,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <SafeAreaView
          edges={["top", "left", "right"]}
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Left as null incase something should be added here */}
          {props.topLeftReplacement ?? (
            <View
              style={{
                flex: 1,
                flexDirection: "row",
              }}
            >
              <IconButton
                icon="undo"
                label="Undo"
                color={colors.onBackground.default}
                disabled={reportState.events.length === 0}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  reportState.undoEvent();
                }}
              />
            </View>
          )}

          <View
            style={{ alignItems: "flex-end", gap: 2, flex: 1, marginRight: 13 }}
          >
            <View
              style={{
                backgroundColor: getAllianceColorDescription(
                  reportState?.meta.allianceColor ?? AllianceColor.Red,
                ).backgroundColor,
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  color: getAllianceColorDescription(
                    reportState?.meta.allianceColor ?? AllianceColor.Red,
                  ).foregroundColor,
                  fontFamily: "Heebo_500Medium",
                  fontSize: 12,
                }}
              >
                {reportState?.meta.teamNumber}
              </Text>
            </View>
            <LabelSmall color={colors.body.default}>
              {gamePhaseMessage} •{" "}
              <GameTimer startTime={reportState?.startTimestamp} />
            </LabelSmall>
          </View>

          {!reportState?.startTimestamp && (
            <IconButton
              label="Start match"
              icon="play_arrow"
              color={colors.onBackground.default}
              size={30}
              disabled={!startEnabled}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                reportState.initializeMatchTimestamp();
              }}
            />
          )}

          {reportState?.startTimestamp && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <TouchableOpacity
                onPress={props.onRestart}
                style={{
                  padding: 6,
                }}
              >
                <Icon name="refresh" color={colors.onBackground.default} size={24} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={props.onEnd}
                style={{
                  backgroundColor: colors.danger.default,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "Heebo_500Medium",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  End Match
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </View>
      <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            flexDirection: "column",
          }}
        >
          {reportState?.startTimestamp && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: shootingOnLeft ? "flex-start" : "flex-end",
                paddingHorizontal: 8,
                paddingBottom: 4,
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: colors.victoryPurple.default,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
                activeOpacity={0.7}
                onPress={handleShootWhileMoving}
              >
                <Text
                  style={{
                    color: "#1f1f1f",
                    fontFamily: "Heebo_500Medium",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Shoot Moving
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "stretch",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                position: "relative",
                aspectRatio: fieldWidth / fieldHeight,
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            >
              <FieldImage />
              {field}
            </View>
          </View>
        </View>
      </SafeAreaView>

      <Modal
        visible={showMovingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleMovingCancel}
      >
        <TouchableOpacity
          style={movingStyles.modalBackdrop}
          activeOpacity={1}
          onPress={handleMovingCancel}
        >
          <View
            style={movingStyles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={movingStyles.title}>Accuracy Rating</Text>

            <View style={movingStyles.accuracyRow}>
              {ACCURACY_RATINGS.map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    movingStyles.accuracyButton,
                    movingAccuracy === rating &&
                      movingStyles.accuracyButtonSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMovingAccuracy(rating);
                  }}
                >
                  <Text
                    style={[
                      movingStyles.accuracyButtonText,
                      movingAccuracy === rating &&
                        movingStyles.accuracyButtonTextSelected,
                    ]}
                  >
                    {rating}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                movingStyles.confirmButton,
                movingAccuracy === 0 && movingStyles.confirmButtonDisabled,
              ]}
              onPress={movingAccuracy > 0 ? handleMovingConfirm : handleMovingCancel}
            >
              <Text style={movingStyles.confirmButtonText}>
                {movingAccuracy > 0
                  ? `Confirm (${movingAccuracy}/5)`
                  : "Cancel"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const movingStyles = StyleSheet.create({
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

function GameViewOverlay({
  overlay,
  setOverlay,
}: {
  overlay: boolean;
  setOverlay: (value: boolean) => void;
}) {
  return (
    <Pressable
      pointerEvents={overlay ? "auto" : "none"}
      disabled={overlay}
      style={{
        backgroundColor: "#45454540",
        opacity: overlay ? 1 : 0,
        position: "absolute",
        zIndex: 50,
        width: "100%",
        height: "100%",
      }}
      onPress={() => {
        setOverlay(false);
      }}
    >
      <View
        style={{
          marginHorizontal: 40,
          marginVertical: 20,
          borderRadius: 14,
          padding: 10,
          backgroundColor: colors.background.default,
          flexGrow: 1,
          shadowColor: "#00000040",
          elevation: 4,
          shadowOpacity: 1,
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowRadius: 4,
          flexDirection: "row",
        }}
      >
        <TouchableOpacity
          accessibilityLabel="Close Overlay"
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 50,
            backgroundColor: colors.secondaryContainer.default,
            zIndex: 1,
          }}
          onPress={() => {
            setOverlay(false);
          }}
          activeOpacity={0.1}
        >
          <Icon name="close" color={colors.onBackground.default} size={32} />
        </TouchableOpacity>
        <OutpostOverlay setOverlay={setOverlay} />
      </View>
    </Pressable>
  );
}

function OutpostOverlay({
  setOverlay,
}: {
  setOverlay: (value: boolean) => void;
}) {
  const reportState = useReportStateStore();

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        width: "100%",
      }}
    >
      <TouchableOpacity
        style={{
          backgroundColor: "#3EE6794d",
          borderRadius: 7,
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          reportState.addEvent({
            type: MatchEventType.Outtake,
            position: MatchEventPosition.Outpost,
          });
          setOverlay(false);
        }}
      >
        <Icon name="download" size={100} color="#3EE679" />
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: "#c1c3374d",
          borderRadius: 7,
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          reportState.addEvent({
            type: MatchEventType.Intake,
            position: MatchEventPosition.Outpost,
          });
          setOverlay(false);
        }}
      >
        <Icon name="upload" size={100} color="#c1c337" />
      </TouchableOpacity>
    </View>
  );
}
