import React, { useEffect, useRef, useState } from "react";
import { useReportStateStore } from "../reportStateStore";
import { router } from "expo-router";
import { ShootingPositionActions } from "./actions/ShootingPositionActions";
import { GameViewTemplate } from "./GameViewTemplate";
import { GamePhase } from "../ReportState";
import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import { colors } from "../../colors";
import { IconButton } from "../../components/IconButton";
import {
  AutoFeedAction,
  ScoreFuelInHubAction,
  TeleopFeedAction,
} from "./actions/FuelActions";
import {
  DepotIntakeAction,
  NeutralZoneAutoIntakeAction,
} from "./actions/AutoIntakeActions";
import TraversalActions from "./actions/TraversalActions";
import { ClimbAction } from "./actions/ClimbAction";
import { AutoDisruptAction } from "./actions/AutoDisruptAction";
import { OutpostAction } from "./actions/OutpostAction";
import { MatchEventType } from "../MatchEventType";
import { FieldTraversal } from "../FieldTraversal";
import { IntakeType } from "../IntakeType";
import { PreMatchActions } from "./actions/PreMatchActions";

import { AutoPathActions } from "./actions/AutoPathActions";

export function Game() {
  const reportState = useReportStateStore();

  const timeoutsRef = useRef<{
    teleop?: NodeJS.Timeout;
    endgame?: NodeJS.Timeout;
  }>({});

  const setPhase = reportState.setGamePhase;

  useEffect(() => {
    if (!reportState.meta) {
      router.replace("/home");
    }
  }, [reportState]);

  useEffect(() => {
    if (
      reportState?.gamePhase === GamePhase.Auto &&
      reportState.startTimestamp &&
      !timeoutsRef.current.teleop &&
      !timeoutsRef.current.endgame
    ) {
      timeoutsRef.current.teleop = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPhase(GamePhase.Teleop);
      }, 20 * 1000);

      timeoutsRef.current.endgame = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPhase(GamePhase.Endgame);
      }, 133 * 1000); // 150s match total - 17s buffer
    }
  }, [reportState?.gamePhase, reportState?.startTimestamp]);

  const clearTimeouts = () => {
    if (timeoutsRef.current.teleop) {
      clearTimeout(timeoutsRef.current.teleop);
      timeoutsRef.current.teleop = undefined;
    }
    if (timeoutsRef.current.endgame) {
      clearTimeout(timeoutsRef.current.endgame);
      timeoutsRef.current.endgame = undefined;
    }
  };

  const onEnd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearTimeouts();

    // Auto-set traversal type based on auto events
    const autoTraversalTypes = reportState.getAutoTraversalTypes();

    if (autoTraversalTypes.trench || autoTraversalTypes.bump) {
      let newSelection = reportState.fieldTraversal;

      if (autoTraversalTypes.trench && autoTraversalTypes.bump) {
        newSelection = FieldTraversal.Both;
      } else if (autoTraversalTypes.trench) {
        newSelection = FieldTraversal.Trench;
      } else if (autoTraversalTypes.bump) {
        newSelection = FieldTraversal.Bump;
      }

      if (newSelection !== reportState.fieldTraversal) {
        reportState.setFieldTraversal(newSelection);
      }
    }

    // Set default intake type values
    if (reportState.hasOutpostIntakeEvent()) {
      if (reportState.intakeType === IntakeType.Ground) {
        reportState.setIntakeType(IntakeType.Both);
      } else if (reportState.intakeType === IntakeType.Neither) {
        reportState.setIntakeType(IntakeType.Outpost);
      }
    }

    router.replace("/game/post-match");
  };
  const onRestart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Restart match?",
      "You will lose all of the data you recorded.",
      [
        { text: "Cancel" },
        {
          text: "Restart",
          style: "destructive",
          onPress: () => {
            clearTimeouts();
            reportState.restartMatch();
          },
        },
      ],
    );
  };

  type GameState = {
    gamePhaseMessage: string;
    field: React.ReactNode;
    topLeftReplacement?: React.ReactNode;
    startEnabled?: boolean;
  };

  const gameStates = {
    preMatch: {
      gamePhaseMessage: "Pre-Match",
      startEnabled: true,
      field: (
        <>
          <PreMatchActions/>
        </>
      ),
    },
    autoAllianceZone: {
      gamePhaseMessage: "Auto",
      field: (
        <>
          <AutoPathActions />
        </>
      ),
    },
    autoNeutralZone: {
      gamePhaseMessage: "Auto",
      field: (
        <>
          <AutoPathActions />
        </>
      ),
    },
    teleop: {
      gamePhaseMessage: "Teleop",
      field: (
        <>
          <ShootingPositionActions />
          <OutpostAction setOverlay={(value) => setOverlay(value)} />
          <TeleopFeedAction />
        </>
      ),
    },
    endgame: {
      gamePhaseMessage: "Teleop",
      field: (
        <>
          <ShootingPositionActions />
          <OutpostAction setOverlay={(value) => setOverlay(value)} />
          <TeleopFeedAction />
          <ClimbAction phase={GamePhase.Endgame} />
        </>
      ),
    },

    unknown: {
      gamePhaseMessage: "Problem finding phase",
      field: <></>,
    },

    testing: {
      gamePhaseMessage: "Testing",
      topLeftReplacement: (
        <IconButton
          icon="arrow_back_ios"
          color={colors.onBackground.default}
          onPress={() => {
            reportState.reset();
            router.push("../home");
          }}
          label=""
        />
      ),
      field: (
        <>
        </>
      ),
    },
  } as const satisfies Record<string, GameState>;

  const gameState: GameState = (() => {
    if (!reportState.startTimestamp) {
      return gameStates.preMatch;
    } else if (reportState.gamePhase === GamePhase.Auto) {
      if (
        reportState.events.filter(
          (event) => event.type === MatchEventType.Cross,
        ).length %
          2 ==
        0
      ) {
        return gameStates.autoAllianceZone;
      } else {
        return gameStates.autoNeutralZone;
      }
    } else if (reportState.gamePhase === GamePhase.Teleop) {
      return gameStates.teleop;
    } else if (reportState.gamePhase === GamePhase.Endgame) {
      return gameStates.endgame;
    }
    return gameStates.unknown;
  })();

  const [overlay, setOverlay] = useState(false);
  return (
    <GameViewTemplate
      {...{
        overlay: overlay,
        setOverlay: (value) => setOverlay(value),
        onEnd: onEnd,
        onRestart: onRestart,
        ...gameState,
      }}
    />
  );
}
