import { Text, StyleSheet, TextInput, KeyboardTypeOptions } from "react-native";
import React from "react";

const Input = (prop: {
  lable: string;
  value: string;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  setValue: (value: string) => void;
}) => {
  return (
    <>
      <Text style={styles.label}>{prop.lable}</Text>
      <TextInput
        style={styles.input}
        placeholder={prop.placeholder}
        keyboardType={prop.keyboardType}
        autoCapitalize="none"
        placeholderTextColor="gray"
        value={prop.value}
        onChangeText={prop.setValue}
      />
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#dcdcdc",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginTop: 5,
    backgroundColor: "#f9f9f9",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
  },
});

export default Input;
