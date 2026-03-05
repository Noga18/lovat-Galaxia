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
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const initializedRef = useRef(false);

  // onLayout on the root absoluteFill container — gives full field dimensions
  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width === 0 || height === 0) return;

    setContainerSize({ width, height });

    if (!initializedRef.current && reportState.startPosition !== undefined) {
      const figma = START_FIGMA[reportState.startPosition];
      if (figma) {
        initializedRef.current = true;
        // Map from figma coordinate space to actual container pixels
        const px = (figma.x / FIGMA_W) * width;
        const py = (figma.y / FIGMA_H) * height;
        setPath([{ x: px, y: py }]);
      }
    }
  };

  const addPathPoint = (x: number, y: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPath((prev) => [...prev, { x, y }]);
    reportState.addEvent({ type: MatchEventType.Cross, position: MatchEventPosition.None });
  };

  const handleAction = (action: ActionButton) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Color the last path point for non-moving actions
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
    <View style={StyleSheet.absoluteFill} onLayout={onContainerLayout}>

      {/* ── 1. SVG path layer — purely visual, no touch interaction ── */}
      {containerSize.width > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg
            width={containerSize.width}
            height={containerSize.height}
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
        </View>
      )}

      {/* ── 2. Field touch handler — full area, uses gesture responders directly ── */}
      {/*    Rendered before buttons so buttons (rendered later) take priority        */}
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          addPathPoint(e.nativeEvent.locationX, e.nativeEvent.locationY);
        }}
      />

      {/* ── 3. Action buttons — rendered last = highest z-order                    ── */}
      {/*    Standard TouchableOpacity buttons intercept their own touches first     */}
      <View style={styles.buttonPanel} pointerEvents="box-none">
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
  buttonText: {
    color: "#1a1a1a",
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
});
