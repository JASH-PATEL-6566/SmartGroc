import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { TouchableOpacity } from "react-native";

type ButtonProps = {
  onPress: () => void;
  loading?: boolean;
  color: string;
  textColor: string;
  loadingText?: string;
  text: string;
  marginTop?: number;
  marginBottom?: number;
};

const Button = ({
  onPress,
  loading = false,
  color,
  textColor,
  loadingText,
  text,
  marginTop = 0,
  marginBottom = 0,
}: ButtonProps) => {
  return (
    <>
      <TouchableOpacity
        style={{
          ...styles.button,
          backgroundColor: color,
          marginTop: marginTop,
          marginBottom: marginBottom,
        }}
        onPress={onPress}
        disabled={loading}
      >
        <Text style={{ ...styles.text, color: textColor }}>
          {loading ? loadingText : text}
        </Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    // backgroundColor: "#28a745",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    // marginTop: 20,
  },
  text: {
    // color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Button;
