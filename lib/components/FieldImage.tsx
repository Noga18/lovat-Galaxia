import React from "react";
import { Image, View, StyleSheet } from "react-native";
import { AllianceColor } from "../models/AllianceColor";
import {
  FieldOrientation,
  useFieldOrientationStore,
} from "../storage/userStores";
import { useReportStateStore } from "../collection/reportStateStore";

export const fieldWidth = 1964;
export const fieldHeight = 978;

export const FieldImage = () => {
  const fieldOrientation = useFieldOrientationStore((state) => state.value);
  const allianceColor = useReportStateStore(
    (state) => state.meta?.allianceColor,
  );

  const shouldRotate =
    (fieldOrientation === FieldOrientation.Auspicious &&
      allianceColor === AllianceColor.Blue) ||
    (fieldOrientation === FieldOrientation.Sinister &&
      allianceColor === AllianceColor.Red);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/field-2026.png")}
        style={[
          styles.image,
          shouldRotate && { transform: [{ rotate: "180deg" }] },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
