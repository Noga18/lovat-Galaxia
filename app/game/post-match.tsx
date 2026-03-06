import { Alert, Image, StyleSheet, View } from "react-native";
import { NavBar } from "../../lib/components/NavBar";
import { Stack, router, useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../lib/components/Button";
import LabelSmall from "../../lib/components/text/LabelSmall";
import { Picker, PickerOption } from "../../lib/components/Picker";
import { useReportStateStore } from "../../lib/collection/reportStateStore";
import { driverAbilityDescriptions } from "../../lib/collection/DriverAbility";
import { robotRoleDescriptions } from "../../lib/collection/RobotRole";
import {
  FieldTraversal,
  fieldTraversalDescriptions,
} from "../../lib/collection/FieldTraversal";
import { accuracyDescriptions } from "../../lib/collection/Accuracy";
import { autoClimbDescriptions } from "../../lib/collection/AutoClimb";
import {
  IntakeType,
  intakeTypeDescriptions,
} from "../../lib/collection/IntakeType";
import { feederTypeDescriptions } from "../../lib/collection/FeederType";
import { Beached, beachedDescriptions } from "../../lib/collection/Beached";
import { defenseEffectivenessDescriptions } from "../../lib/collection/DefenseEffectiveness";
import { scoresWhileMovingDescriptions } from "../../lib/collection/ScoresWhileMoving";
import { speedDescriptions } from "../../lib/collection/Speed";
import { intakeSpeedDescriptions } from "../../lib/collection/IntakeSpeed";
import { MatchEventPosition } from "../../lib/collection/MatchEventPosition";
import {
  EndgameClimb,
  endgameClimbDescriptions,
} from "../../lib/collection/EndgameClimb";
import TextField from "../../lib/components/TextField";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { CommonActions } from "@react-navigation/native";
import BodyMedium from "../../lib/components/text/BodyMedium";
import { useTrainingModeStore } from "../../lib/storage/userStores";
import React from "react";
import { Checkbox } from "../../lib/components/Checkbox";
import { RobotRole } from "../../lib/collection/RobotRole";
import { MatchEventType } from "../../lib/collection/MatchEventType";
import { MatchEvent } from "../../lib/collection/MatchEvent";
import { AutoPathPoint } from "../../lib/collection/ReportState";
import { AllianceColor } from "../../lib/models/AllianceColor";
import Svg, { Line, Circle } from "react-native-svg";

export default function PostMatch() {
  const reportState = useReportStateStore();
  const trainingModeEnabled = useTrainingModeStore((state) => state.value);

  const navigation = useNavigation();

  if (!reportState) {
    navigation.dispatch(
      CommonActions.reset({
        routes: [{ key: "index", name: "index" }],
      }),
    );
    return null;
  }

  const shouldShowDefenseEffectiveness =
    reportState.robotRole.includes(RobotRole.Defending) ||
    reportState.hasEventOfType(
      MatchEventType.StartDefending,
      MatchEventType.StartCamping,
    );

  const hasEndgameClimbEvent = reportState.hasEndgameClimbEvent();

  const endgameClimbIsMismatched =
    hasEndgameClimbEvent &&
    reportState.climbResult === EndgameClimb.NotAttempted;

  const hasOutpostIntakeEvent = reportState.hasOutpostIntakeEvent();
  const autoTraversalTypes = reportState.getAutoTraversalTypes();

  return (
    <>
      <Stack.Screen
        options={{
          orientation: "portrait_up",
          animationDuration: 0,
          animationTypeForReplace: "push",
          animation: "flip",
        }}
      />
      <NavBar title="Post match" />
      <KeyboardAwareScrollView
        style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 26, gap: 28 }}
        contentContainerStyle={{
          flexDirection: "row",
          justifyContent: "center",
        }}
        bottomOffset={48}
        keyboardDismissMode="interactive"
        disableScrollOnKeyboardHide={true}
      >
        <SafeAreaView
          edges={["bottom", "left", "right"]}
          style={{ flex: 1, gap: 14, paddingBottom: 200, maxWidth: 550 }}
        >
          <AutoSummary
            autoPath={reportState.autoPath}
            events={reportState.events}
            startTimestamp={reportState.startTimestamp}
            allianceColor={reportState.meta?.allianceColor}
          />

          <PostMatchSelector
            title="Robot roles"
            items={robotRoleDescriptions.map((roleDescription) => ({
              label: roleDescription.localizedDescription,
              description: roleDescription.localizedLongDescription,
              value: roleDescription.role,
            }))}
            selected={reportState.robotRole}
            onChange={reportState.setRobotRole}
            multiSelect
          />
          {reportState.robotRole.includes(RobotRole.Feeding) && (
            <PostMatchSelector
              title="Feeder Type"
              items={feederTypeDescriptions.map((desc) => ({
                label: desc.localizedDescription,
                description: desc.localizedLongDescription,
                value: desc.feederType,
              }))}
              selected={reportState.feederType}
              onChange={reportState.setFeederType}
              multiSelect
            />
          )}
          <PostMatchSelector
            title="Defense Effectiveness"
            items={defenseEffectivenessDescriptions.map((desc) => ({
              label: desc.localizedDescription,
              description: desc.localizedLongDescription,
              value: desc.effectiveness,
            }))}
            selected={reportState.defenseEffectiveness}
            onChange={reportState.setDefenseEffectiveness}
          />
          <PostMatchSelector
            title="Shooting Speed"
            items={speedDescriptions.map((desc) => ({
              label: desc.localizedDescription,
              description: desc.localizedLongDescription,
              value: desc.speed,
            }))}
            selected={reportState.speed}
            onChange={reportState.setSpeed}
          />
          <PostMatchSelector<string, FieldTraversal>
            title="Field Traversal"
            items={fieldTraversalDescriptions
              .filter(
                (desc) =>
                  desc.traversal === FieldTraversal.Trench ||
                  desc.traversal === FieldTraversal.Bump,
              )
              .map((desc) => ({
                label: desc.localizedDescription,
                description: desc.localizedLongDescription,
                value:
                  desc.traversal === FieldTraversal.Trench ? "trench" : "bump",
                disabled:
                  (desc.traversal === FieldTraversal.Trench &&
                    autoTraversalTypes.trench) ||
                  (desc.traversal === FieldTraversal.Bump &&
                    autoTraversalTypes.bump),
              }))}
            selected={
              reportState.fieldTraversal === FieldTraversal.Both
                ? ["trench", "bump"]
                : reportState.fieldTraversal === FieldTraversal.Trench
                  ? ["trench"]
                  : reportState.fieldTraversal === FieldTraversal.Bump
                    ? ["bump"]
                    : []
            }
            onChange={reportState.setFieldTraversal}
            multiSelect
            mapSelection={(selected) => {
              const hasTrench = selected.includes("trench");
              const hasBump = selected.includes("bump");
              if (hasTrench && hasBump) return FieldTraversal.Both;
              if (hasTrench) return FieldTraversal.Trench;
              if (hasBump) return FieldTraversal.Bump;
              return FieldTraversal.None;
            }}
          />
          <PostMatchSelector
            title="Auto Climb"
            items={autoClimbDescriptions.map((desc) => ({
              label: desc.localizedDescription,
              description: desc.localizedLongDescription,
              value: desc.climb,
            }))}
            selected={reportState.autoClimb}
            onChange={reportState.setAutoClimb}
          />
          {hasEndgameClimbEvent && (
            <PostMatchSelector
              title="Endgame Climb"
              items={endgameClimbDescriptions
                .filter((desc) => desc.climb !== EndgameClimb.NotAttempted)
                .map((desc) => ({
                  label: desc.localizedDescription,
                  description: desc.localizedLongDescription,
                  value: desc.climb,
                }))}
              selected={reportState.climbResult}
              onChange={reportState.setClimbResult}
            />
          )}

          <PostMatchSelector<string, Beached>
            title="Beached"
            items={beachedDescriptions
              .filter(
                (desc) =>
                  desc.beached === Beached.OnFuel ||
                  desc.beached === Beached.OnBump,
              )
              .map((desc) => ({
                label: desc.localizedDescription,
                description: desc.localizedLongDescription,
                value: desc.beached === Beached.OnFuel ? "fuel" : "bump",
              }))}
            selected={
              reportState.beached === Beached.Both
                ? ["fuel", "bump"]
                : reportState.beached === Beached.OnFuel
                  ? ["fuel"]
                  : reportState.beached === Beached.OnBump
                    ? ["bump"]
                    : []
            }
            onChange={reportState.setBeached}
            multiSelect
            mapSelection={(selected) => {
              const hasFuel = selected.includes("fuel");
              const hasBump = selected.includes("bump");
              if (hasFuel && hasBump) return Beached.Both;
              if (hasFuel) return Beached.OnFuel;
              if (hasBump) return Beached.OnBump;
              return Beached.Neither;
            }}
          />
          <PostMatchSelector
            title="Scores While Moving"
            items={scoresWhileMovingDescriptions.map((desc) => ({
              label: desc.localizedDescription,
              description: desc.localizedLongDescription,
              value: desc.scoresWhileMoving,
            }))}
            selected={reportState.scoresWhileMoving}
            onChange={reportState.setScoresWhileMoving}
          />
          <ShootingPositionsDisplay events={reportState.events} />
          <PostMatchSelector
            title="Intake Speed"
            items={intakeSpeedDescriptions.map((desc) => ({
              label: desc.localizedDescription,
              description: desc.localizedLongDescription,
              value: desc.intakeSpeed,
            }))}
            selected={reportState.intakeSpeed}
            onChange={reportState.setIntakeSpeed}
          />

          <View style={{ marginVertical: 18 }}>
            <Checkbox
              label="Robot broke"
              checked={reportState.robotBrokeDescription != null}
              onChange={(checked) => {
                reportState.setRobotBrokeDescription(checked ? "" : null);
              }}
            />
            {reportState.robotBrokeDescription != null && (
              <View style={{ gap: 7, marginTop: 7 }}>
                <TextField
                  value={reportState.robotBrokeDescription}
                  onChangeText={reportState.setRobotBrokeDescription}
                  multiline={true}
                  returnKeyType="done"
                  placeholder="How did it break?"
                />
              </View>
            )}
          </View>

          <View style={{ gap: 7, marginBottom: 18 }}>
            <LabelSmall>Notes</LabelSmall>
            <TextField
              value={reportState!.notes}
              onChangeText={reportState.setNotes}
              multiline={true}
              returnKeyType="done"
            />
            <View
              style={{
                marginTop: -2,
              }}
            >
              <BodyMedium>
                Keep it helpful. Notes can be viewed by anyone.
              </BodyMedium>
            </View>
          </View>
          <View style={{ gap: 10 }}>
            <Button
              disabled={
                trainingModeEnabled ||
                endgameClimbIsMismatched
              }
              variant="primary"
              onPress={() => {
                router.replace("/game/submit");
              }}
            >
              Submit
            </Button>
            <Button
              variant="secondary"
              onPress={() => {
                Alert.alert(
                  "Discard match?",
                  "You will lose all of the data that you recorded.",
                  [
                    {
                      text: "Cancel",
                    },
                    {
                      text: "Discard",
                      style: "destructive",
                      onPress: () => {
                        reportState.reset();
                        navigation.dispatch(
                          CommonActions.reset({
                            routes: [{ key: "index", name: "index" }],
                          }),
                        );
                      },
                    },
                  ],
                );
              }}
            >
              Discard match
            </Button>

            {trainingModeEnabled && (
              <BodyMedium>
                Disable training mode in settings to submit data.
              </BodyMedium>
            )}
          </View>
        </SafeAreaView>
      </KeyboardAwareScrollView>
    </>
  );
}

// Base props shared by all variants
type BaseProps<T> = {
  title: string;
  items: PickerOption<T>[];
};

// Single-select: multiSelect is false or undefined
type SingleSelectProps<T> = BaseProps<T> & {
  selected: T;
  onChange: (value: T) => void;
  multiSelect?: false;
  mapSelection?: undefined;
};

// True multi-select: multiSelect is true, no mapSelection
type TrueMultiSelectProps<T> = BaseProps<T> & {
  selected: T[];
  onChange: (value: T[]) => void;
  multiSelect: true;
  mapSelection?: undefined;
};

// Pseudo multi-select: multiSelect is true with mapSelection
type MappedMultiSelectProps<TItem, TOutput> = BaseProps<TItem> & {
  selected: TItem[];
  onChange: (value: TOutput) => void;
  multiSelect: true;
  mapSelection: (selected: TItem[]) => TOutput;
};

// Overloaded function signatures for proper type inference
function PostMatchSelector<T>(props: SingleSelectProps<T>): React.ReactElement;
function PostMatchSelector<T>(
  props: TrueMultiSelectProps<T>,
): React.ReactElement;
function PostMatchSelector<TItem, TOutput>(
  props: MappedMultiSelectProps<TItem, TOutput>,
): React.ReactElement;
function PostMatchSelector<TItem, TOutput = TItem>(
  props:
    | SingleSelectProps<TItem>
    | TrueMultiSelectProps<TItem>
    | MappedMultiSelectProps<TItem, TOutput>,
) {
  const { title, items, multiSelect, selected } = props;

  const handleChange = (value: TItem) => {
    if (!multiSelect) {
      // Single select
      (props as SingleSelectProps<TItem>).onChange(value);
    } else {
      // Multi-select
      const selectedArray = selected as TItem[];
      let newSelected: TItem[];
      if (selectedArray.includes(value)) {
        newSelected = selectedArray.filter((v) => v !== value);
      } else {
        newSelected = [...selectedArray, value];
      }

      if ("mapSelection" in props && props.mapSelection) {
        // Pseudo multi-select: map to enum value
        (props as MappedMultiSelectProps<TItem, TOutput>).onChange(
          props.mapSelection(newSelected),
        );
      } else {
        // True multi-select: pass array
        (props as TrueMultiSelectProps<TItem>).onChange(newSelected);
      }
    }
  };

  return (
    <View style={{ gap: 7 }}>
      <LabelSmall>{title}</LabelSmall>
      <Picker
        style="inset-picker"
        options={items}
        selected={selected}
        onChange={handleChange}
        multiSelect={multiSelect}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto Summary: field image with path + event list
// ─────────────────────────────────────────────────────────────────────────────

const fieldNormal = require("../../assets/field-2026.png");
const fieldRotated = require("../../assets/field-2026-rotated.png");

// Field display: fixed 16:8 (2:1) aspect ratio, full width
const AUTO_EVENT_LABELS: Partial<Record<MatchEventType, string>> = {
  [MatchEventType.Intake]: "Intake",
  [MatchEventType.StartScoring]: "Shot start",
  [MatchEventType.StopScoring]: "Shot end",
  [MatchEventType.Climb]: "Climb",
  [MatchEventType.Cross]: "Waypoint",
};

type AutoSummaryProps = {
  autoPath: AutoPathPoint[];
  events: MatchEvent[];
  startTimestamp?: Date;
  allianceColor?: AllianceColor;
};

const AutoSummary = ({ autoPath, events, startTimestamp, allianceColor }: AutoSummaryProps) => {
  const imageSource = allianceColor === AllianceColor.Blue ? fieldRotated : fieldNormal;
  const startMs = startTimestamp?.getTime() ?? 0;

  // Auto ends at 23 seconds; filter only auto-phase events
  const autoEndMs = startMs + 20_000;
  const autoEvents = events.filter(
    (e) =>
      e.timestamp <= autoEndMs &&
      e.type !== MatchEventType.Cross, // Cross events shown as path dots, not in list
  );

  // Build a readable event list
  type EventRow = { label: string; timeS: number; detail?: string; color: string };
  const rows: EventRow[] = autoEvents.map((e) => {
    const timeS = startMs > 0 ? (e.timestamp - startMs) / 1000 : 0;
    let detail: string | undefined;
    let color = "#aaa";

    if (e.type === MatchEventType.Intake) color = "#1E90FF";
    if (e.type === MatchEventType.StartScoring) color = "#3EE679";
    if (e.type === MatchEventType.StopScoring) {
      color = "#3EE679";
      if (e.quantity !== undefined) {
        // quantity stored in tenths of a second
        detail = `${(e.quantity / 10).toFixed(1)}s`;
      }
    }
    if (e.type === MatchEventType.Climb) color = "#FFD700";

    return {
      label: AUTO_EVENT_LABELS[e.type] ?? "Event",
      timeS,
      detail,
      color,
    };
  });

  if (autoPath.length === 0 && rows.length === 0) return null;

  return (
    <View style={autoSummaryStyles.container}>
      <LabelSmall>Auto Path</LabelSmall>

      {/* Field image with path overlay */}
      {autoPath.length > 0 && (
        <View style={autoSummaryStyles.fieldWrapper}>
          <Image
            source={imageSource}
            style={autoSummaryStyles.fieldImage}
            resizeMode="stretch"
          />
          {/* SVG path overlay using ratios */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height="100%">
              {autoPath.map((point, i) => {
                // SVG uses percentages via strings; compute inline style below
                const x = `${(point.xRatio * 100).toFixed(2)}%`;
                const y = `${(point.yRatio * 100).toFixed(2)}%`;
                const prev = autoPath[i - 1];
                const x1 = prev ? `${(prev.xRatio * 100).toFixed(2)}%` : x;
                const y1 = prev ? `${(prev.yRatio * 100).toFixed(2)}%` : y;
                return (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <Line
                        x1={x1}
                        y1={y1}
                        x2={x}
                        y2={y}
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    )}
                    <Circle
                      cx={x}
                      cy={y}
                      r={point.actionColor ? 8 : 4}
                      fill={point.actionColor ?? "white"}
                      stroke="rgba(0,0,0,0.6)"
                      strokeWidth={1}
                    />
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        </View>
      )}

      {/* Event list */}
      {rows.length > 0 && (
        <View style={autoSummaryStyles.eventList}>
          {rows.map((row, i) => (
            <View key={i} style={autoSummaryStyles.eventRow}>
              <View style={[autoSummaryStyles.eventDot, { backgroundColor: row.color }]} />
              <BodyMedium style={{ flex: 1 }}>{row.label}</BodyMedium>
              {row.detail && (
                <BodyMedium style={{ color: "#aaa", marginRight: 8 }}>{row.detail}</BodyMedium>
              )}
              <BodyMedium style={{ color: "#888", minWidth: 44, textAlign: "right" }}>
                {row.timeS.toFixed(1)}s
              </BodyMedium>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const autoSummaryStyles = StyleSheet.create({
  container: {
    gap: 8,
  },
  fieldWrapper: {
    width: "100%",
    aspectRatio: 1964 / 978,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  fieldImage: {
    width: "100%",
    height: "100%",
  },
  eventList: {
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    paddingVertical: 4,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

// ─────────────────────────────────────────────────────────────────────────────

const shootingPositionNames: Record<number, string> = {
  [MatchEventPosition.LeftTrench]: "Left Front",
  [MatchEventPosition.Hub]: "Center Front",
  [MatchEventPosition.RightTrench]: "Right Front",
  [MatchEventPosition.LeftBump]: "Left Back",
  [MatchEventPosition.CenterBack]: "Center Back",
  [MatchEventPosition.RightBump]: "Right Back",
};

const shootingPositionOrder = [
  MatchEventPosition.LeftTrench,
  MatchEventPosition.Hub,
  MatchEventPosition.RightTrench,
  MatchEventPosition.LeftBump,
  MatchEventPosition.CenterBack,
  MatchEventPosition.RightBump,
];

const ShootingPositionsDisplay = ({ events }: { events: MatchEvent[] }) => {
  const usedPositions = new Set(
    events
      .filter((e) => e.type === MatchEventType.StartScoring)
      .map((e) => e.position)
  );

  return (
    <View style={{ gap: 7 }}>
      <LabelSmall>Shooting Positions</LabelSmall>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {shootingPositionOrder.map((pos) => {
          const active = usedPositions.has(pos);
          return (
            <View
              key={pos}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor: active ? "#3EE679" : "#2a2a2a",
                opacity: active ? 1 : 0.5,
              }}
            >
              <BodyMedium color={active ? "#1f1f1f" : "#aaa"}>
                {shootingPositionNames[pos]}
              </BodyMedium>
            </View>
          );
        })}
      </View>
    </View>
  );
};
