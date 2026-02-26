import React from "react";
import { Image, View, StyleSheet } from "react-native";

export const fieldWidth = 1964;
export const fieldHeight = 978;

export const FieldImage = () => {
  return (
    <View
      style={[
        styles.container,
        {
          transform: [{ rotate: "180deg" }],
        },
      ]}
    >
      <Image
        source={require("../../assets/field-2026.png")}
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
