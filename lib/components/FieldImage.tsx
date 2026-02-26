import React from "react";
import { Image, View, StyleSheet } from "react-native";
import { AllianceColor } from "../models/AllianceColor";
import { useReportStateStore } from "../collection/reportStateStore";

export const fieldWidth = 1964;
export const fieldHeight = 978;

const fieldNormal = require("../../assets/field-2026.png");
const fieldRotated = require("../../assets/field-2026-rotated.png");

export const FieldImage = () => {
  const allianceColor = useReportStateStore(
    (state) => state.meta?.allianceColor,
  );

  const imageSource = allianceColor === AllianceColor.Blue ? fieldRotated : fieldNormal;

  return (
    <View style={styles.container}>
      <Image
        source={imageSource}
        style={styles.image}
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
