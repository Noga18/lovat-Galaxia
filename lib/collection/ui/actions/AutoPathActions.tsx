import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  GestureResponderEvent,
} from "react-native";
import { useReportStateStore } from "../../reportStateStore";
import { MatchEventType } from "../../MatchEventType";
import { MatchEventPosition } from "../../MatchEventPosition";
import * as Haptics from "expo-haptics";
import Svg, { Line, Circle } from "react-native-svg";

// Figma field is 677x337
// Starting position box centers:
//   Front col (x=65, w=55 → cx=92.5): rows at y=15,120,225 with h=90 → cy=60,165,270
//   Back col  (x=140,w=55 → cx=167.5): same row centers
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

const SIDEBAR_WIDTH = 90;

type PathPoint = {
  x: number;
  y: number;
  actionColor?: string;
};

type ActionButton = {
  label: string;
  type: MatchEventType;
  position: MatchEventPosition;
  color: string;
  isMoving?: boolean;
};

const ACTION_BUTTONS: ActionButton[] = [
  { label: "Climb",        type: MatchEventType.Climb,        position: MatchEventPosition.None,        color: "#FFD700" },
  { label: "Intake",       type: MatchEventType.Intake,       position: MatchEventPosition.None,        color: "#1E90FF" },
  { label: "Shoot",        type: MatchEventType.StartScoring, position: MatchEventPosition.None,        color: "#3EE679" },
  { label: "Shoot Moving", type: MatchEventType.StartScoring, position: MatchEventPosition.NeutralZone, color: "#9370DB", isMoving: true },
];

export const AutoPathActions = () => {
  const reportState = useReportStateStore();
  const [path, setPath] = useState<PathPoint[]>([]);
  const [fieldSize, setFieldSize] = useState({ width: 0, height: 0 });
  const initializedRef = useRef(false);

  // onLayout on the field area View — gives us stable, correct dimensions
  const onFieldAreaLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width === 0 || height === 0) return;

    setFieldSize({ width, height });

    // Place start position dot once we know the container dimensions
    if (!initializedRef.current && reportState.startPosition !== undefined) {
      const figma = START_FIGMA[reportState.startPosition];
      if (figma) {
        initializedRef.current = true;
        // Map figma coords to actual pixel coords in the field area
        const px = (figma.x / FIGMA_W) * width;
        const py = (figma.y / FIGMA_H) * height;
        setPath([{ x: px, y: py }]);
      }
    }
  };

  const handleFieldPress = (e: GestureResponderEvent) => {
    // locationX/locationY are relative to the TouchableOpacity that received the event
    const { locationX, locationY } = e.nativeEvent;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPath((prev) => [...prev, { x: locationX, y: locationY }]);
    reportState.addEvent({ type: MatchEventType.Cross, position: MatchEventPosition.None });
  };

  const handleAction = (action: ActionButton) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // For non-moving actions: color the last path point
    if (!action.isMoving) {
      setPath((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          actionColor: action.color,
        };
        return updated;
      });
    }

    reportState.addEvent({ type: action.type, position: action.position });
  };

  return (
    <View style={styles.container}>
      {/* ── Field area (left) ───────────────────────────────── */}
      <View style={styles.fieldArea} onLayout={onFieldAreaLayout}>
        {/* SVG path overlay — wrapped in a non-interactive View so it never eats touches */}
        {fieldSize.width > 0 && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width={fieldSize.width} height={fieldSize.height}>
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

        {/* Transparent touch-capture layer — on top of SVG so touches always reach it */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleFieldPress}
        />
      </View>

      {/* ── Action buttons sidebar (right) ──────────────────── */}
      <View style={styles.sidebar}>
        {ACTION_BUTTONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[styles.actionButton, { backgroundColor: action.color }]}
            onPress={() => handleAction(action)}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  fieldArea: {
    flex: 1,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingRight: 4,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
    elevation: 4,
  },
  buttonText: {
    color: "#1a1a1a",
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
});
