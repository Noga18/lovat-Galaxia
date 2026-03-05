import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import { useReportStateStore } from "../../reportStateStore";
import { MatchEventType } from "../../MatchEventType";
import { MatchEventPosition } from "../../MatchEventPosition";
import * as Haptics from "expo-haptics";
import { colors } from "../../../colors";
import Svg, { Line, Circle } from "react-native-svg";

const ACTION_BUTTONS = [
  { label: "Climb", type: MatchEventType.Climb, color: "#FFD700" },
  { label: "Intake", type: MatchEventType.Intake, color: "#1E90FF" },
  { label: "Shoot", type: MatchEventType.StartScoring, color: "#3EE679" },
  { label: "Shoot Moving", type: MatchEventType.StartScoring, isMoving: true, color: "#9370DB" },
];

export const AutoPathActions = () => {
  const reportState = useReportStateStore();
  const [path, setPath] = useState<{ x: number, y: number, event?: MatchEventType, color?: string }[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const hasInitializedRef = useRef(false);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0 && !hasInitializedRef.current) {
      if (reportState.startPosition !== undefined) {
        let xPercent = 65;
        let yPercent = 120;
        
        const pos = reportState.startPosition;
        if (pos === MatchEventPosition.LeftTrench) { xPercent = 65; yPercent = 15 + 45; }
        else if (pos === MatchEventPosition.Hub) { xPercent = 65; yPercent = 120 + 45; }
        else if (pos === MatchEventPosition.RightTrench) { xPercent = 65; yPercent = 225 + 45; }
        else if (pos === MatchEventPosition.LeftBump) { xPercent = 140; yPercent = 15 + 45; }
        else if (pos === MatchEventPosition.CenterBack) { xPercent = 140; yPercent = 120 + 45; }
        else if (pos === MatchEventPosition.RightBump) { xPercent = 140; yPercent = 225 + 45; }

        const x = (xPercent / 677) * containerSize.width;
        const y = (yPercent / 337) * containerSize.height;

        setPath([{ x, y }]);
        hasInitializedRef.current = true;
      }
    }
  }, [containerSize, reportState.startPosition]);

  const handleFieldPress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const newPoint = { x: locationX, y: locationY };
    setPath(prev => [...prev, newPoint]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    reportState.addEvent({
      type: MatchEventType.Cross,
      position: MatchEventPosition.None,
    });
  };

  const handleAction = (action: typeof ACTION_BUTTONS[0]) => {
    if (path.length === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const lastPoint = path[path.length - 1];
    
    if (!action.isMoving) {
      const newPath = [...path];
      newPath[newPath.length - 1] = { ...lastPoint, event: action.type, color: action.color };
      setPath(newPath);
    }

    reportState.addEvent({
      type: action.type,
      position: action.isMoving ? MatchEventPosition.NeutralZone : MatchEventPosition.None,
    });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" onLayout={onLayout}>
      {containerSize.width > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            onPress={handleFieldPress}
            activeOpacity={1}
          >
            <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
              {path.map((point, i) => (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <Line
                      x1={path[i-1].x}
                      y1={path[i-1].y}
                      x2={point.x}
                      y2={point.y}
                      stroke="white"
                      strokeWidth="2"
                    />
                  )}
                  <Circle
                    cx={point.x}
                    cy={point.y}
                    r={point.event ? 8 : 4}
                    fill={point.color || "white"}
                  />
                </React.Fragment>
              ))}
            </Svg>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonContainer}>
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
  buttonContainer: {
    position: "absolute",
    right: 10,
    top: "10%",
    gap: 10,
  },
  actionButton: {
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  buttonText: {
    color: "#1f1f1f",
    fontWeight: "bold",
    fontSize: 12,
  },
});
