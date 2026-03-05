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
// Starting position centers (center of each box):
//   Front row (x=65, w=55 → cx=92.5): y=15 h=90 → cy=60 | y=120 h=90 → cy=165 | y=225 h=90 → cy=270
//   Back row  (x=140, w=55 → cx=167.5): same y values
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

const BUTTON_PANEL_WIDTH = 90;

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

  // Called when the field touch area (left portion) gets its layout
  const onFieldLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width === 0 || height === 0) return;
    setFieldSize({ width, height });

    // Initialize with starting position dot
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

  const handleFieldPress = (e: GestureResponderEvent) => {
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
        updated[updated.length - 1] = { ...updated[updated.length - 1], actionColor: action.color };
        return updated;
      });
    }

    reportState.addEvent({ type: action.type, position: action.position });
  };

  return (
    // Row layout: field touch area (flex: 1) + button sidebar (fixed width)
    <View style={styles.container}>
      {/* Left: field touch area */}
      <TouchableOpacity
        style={styles.fieldArea}
        activeOpacity={1}
        onPress={handleFieldPress}
        onLayout={onFieldLayout}
      >
        {fieldSize.width > 0 && (
          <Svg
            width={fieldSize.width}
            height={fieldSize.height}
            style={StyleSheet.absoluteFill}
          >
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
        )}
      </TouchableOpacity>

      {/* Right: action buttons sidebar */}
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
    width: BUTTON_PANEL_WIDTH,
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
