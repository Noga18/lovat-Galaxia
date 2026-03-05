import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  LayoutChangeEvent,
} from "react-native";
import { useReportStateStore } from "../../reportStateStore";
import { MatchEventType } from "../../MatchEventType";
import { MatchEventPosition } from "../../MatchEventPosition";
import * as Haptics from "expo-haptics";
import Svg, { Line, Circle } from "react-native-svg";

// Figma field: 677 x 337 px
// Starting position box centers:
//   Front col x=65 w=55 → cx=92.5 | Back col x=140 w=55 → cx=167.5
//   Row tops/heights: y=15 h=90 → cy=60 | y=120 h=90 → cy=165 | y=225 h=90 → cy=270
const FIGMA_W = 677;
const FIGMA_H = 337;

const START_FIGMA: Partial<Record<MatchEventPosition, { x: number; y: number }>> = {
  [MatchEventPosition.LeftTrench]:  { x: 92.5,  y: 60  },
  [MatchEventPosition.Hub]:          { x: 92.5,  y: 165 },
  [MatchEventPosition.RightTrench]: { x: 92.5,  y: 270 },
  [MatchEventPosition.LeftBump]:    { x: 167.5, y: 60  },
  [MatchEventPosition.CenterBack]:  { x: 167.5, y: 165 },
  [MatchEventPosition.RightBump]:   { x: 167.5, y: 270 },
};

type PathPoint = {
  x: number;
  y: number;
  actionColor?: string;
};

export const AutoPathActions = () => {
  const reportState = useReportStateStore();
  const [path, setPath] = useState<PathPoint[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isClimbed, setIsClimbed] = useState(false);
  const initializedRef = useRef(false);

  // Refs to track press-start time for shoot buttons (duration measurement)
  const shootPressStartRef = useRef<number | null>(null);
  const shootMovingPressStartRef = useRef<number | null>(null);

  // onLayout on the root container — gives full field dimensions
  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width === 0 || height === 0) return;

    setContainerSize({ width, height });

    if (!initializedRef.current && reportState.startPosition !== undefined) {
      const figma = START_FIGMA[reportState.startPosition];
      if (figma) {
        initializedRef.current = true;
        const px = (figma.x / FIGMA_W) * width;
        const py = (figma.y / FIGMA_H) * height;
        setPath([{ x: px, y: py }]);
      }
    }
  };

  const addPathPoint = (x: number, y: number) => {
    if (isClimbed) return; // Path drawing is locked after climb
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPath((prev) => [...prev, { x, y }]);
    // timestamp is automatically set to Date.now() inside addEvent
    reportState.addEvent({
      type: MatchEventType.Cross,
      position: MatchEventPosition.None,
    });
  };

  // ── Climb ────────────────────────────────────────────────────────────
  const handleClimb = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsClimbed(true);
    // Color last path point yellow to mark climb location
    setPath((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], actionColor: "#FFD700" };
      return updated;
    });
    reportState.addEvent({ type: MatchEventType.Climb, position: MatchEventPosition.None });
  };

  const handleCancelClimb = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsClimbed(false);
    // Remove climb color from last point
    setPath((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last.actionColor === "#FFD700") {
        updated[updated.length - 1] = { x: last.x, y: last.y };
      }
      return updated;
    });
    // Remove all Climb events from the report
    reportState.stopClimbing();
  };

  // ── Intake ───────────────────────────────────────────────────────────
  const handleIntake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPath((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], actionColor: "#1E90FF" };
      return updated;
    });
    reportState.addEvent({ type: MatchEventType.Intake, position: MatchEventPosition.None });
  };

  // ── Shoot (hold to measure duration) ────────────────────────────────
  const handleShootPressIn = () => {
    shootPressStartRef.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Record start; mark last path point green
    setPath((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], actionColor: "#3EE679" };
      return updated;
    });
    reportState.addEvent({
      type: MatchEventType.StartScoring,
      position: MatchEventPosition.None,
    });
  };

  const handleShootPressOut = () => {
    if (shootPressStartRef.current === null) return;
    const durationSec = (Date.now() - shootPressStartRef.current) / 1000;
    shootPressStartRef.current = null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // quantity stores duration in tenths of a second (e.g. 1.5s → 15)
    reportState.addEvent({
      type: MatchEventType.StopScoring,
      position: MatchEventPosition.None,
      quantity: Math.round(durationSec * 10),
    });
  };

  // ── Shoot Moving (hold to measure duration) ──────────────────────────
  const handleShootMovingPressIn = () => {
    shootMovingPressStartRef.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reportState.addEvent({
      type: MatchEventType.StartScoring,
      position: MatchEventPosition.NeutralZone,
    });
  };

  const handleShootMovingPressOut = () => {
    if (shootMovingPressStartRef.current === null) return;
    const durationSec = (Date.now() - shootMovingPressStartRef.current) / 1000;
    shootMovingPressStartRef.current = null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reportState.addEvent({
      type: MatchEventType.StopScoring,
      position: MatchEventPosition.NeutralZone,
      quantity: Math.round(durationSec * 10),
    });
  };

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onContainerLayout}>

      {/* ── 1. SVG path layer — purely visual, no touch interaction ── */}
      {containerSize.width > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={containerSize.width} height={containerSize.height}>
            {path.map((point, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <Line
                    x1={path[i - 1].x}
                    y1={path[i - 1].y}
                    x2={point.x}
                    y2={point.y}
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )}
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={point.actionColor ? 10 : 5}
                  fill={point.actionColor ?? "white"}
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={1.5}
                />
              </React.Fragment>
            ))}
          </Svg>
        </View>
      )}

      {/* ── 2. Field touch handler (locked when climbed) ── */}
      {!isClimbed && (
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            addPathPoint(e.nativeEvent.locationX, e.nativeEvent.locationY);
          }}
        />
      )}

      {/* ── 3. Action buttons sidebar ── */}
      <View style={styles.buttonPanel} pointerEvents="box-none">

        {/* Climb / Cancel Climb */}
        {!isClimbed ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#FFD700" }]}
            onPress={handleClimb}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Climb</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelClimb}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: "#fff" }]}>Cancel{"\n"}Climb</Text>
          </TouchableOpacity>
        )}

        {/* Intake */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#1E90FF" }]}
          onPress={handleIntake}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Intake</Text>
        </TouchableOpacity>

        {/* Shoot — held to measure duration */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#3EE679" }]}
          onPressIn={handleShootPressIn}
          onPressOut={handleShootPressOut}
          activeOpacity={0.6}
        >
          <Text style={styles.buttonText}>Shoot</Text>
        </TouchableOpacity>

        {/* Shoot Moving — held to measure duration */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#9370DB" }]}
          onPressIn={handleShootMovingPressIn}
          onPressOut={handleShootMovingPressOut}
          activeOpacity={0.6}
        >
          <Text style={styles.buttonText}>Shoot{"\n"}Moving</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonPanel: {
    position: "absolute",
    right: 6,
    top: 0,
    bottom: 0,
    width: 90,
    justifyContent: "center",
    gap: 8,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: "#cc2222",
    borderWidth: 2,
    borderColor: "#ff6666",
  },
  buttonText: {
    color: "#1a1a1a",
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
});
