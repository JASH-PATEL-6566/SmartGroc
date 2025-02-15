import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import React from "react";
import Feather from "@expo/vector-icons/Feather";

type PasswordInputProps = {
  showPassword: boolean;
  password: string;
  setPassword: (password: string) => void;
  setShowPassword: (showPassword: boolean) => void;
};

const PasswordInput = (props: PasswordInputProps) => {
  return (
    <>
      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.inputPassword}
          autoCapitalize="none"
          placeholderTextColor="gray"
          placeholder={props.showPassword ? "password" : "••••••••"}
          secureTextEntry={!props.showPassword}
          value={props.password}
          onChangeText={props.setPassword}
        />
        <TouchableOpacity
          onPress={() => props.setShowPassword(!props.showPassword)}
          style={styles.iconContainer}
        >
          <Feather
            name={props.showPassword ? "eye" : "eye-off"}
            size={20}
            color="#555"
          />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dcdcdc",
    marginTop: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
  },
  inputPassword: {
    flex: 1,
    padding: 15,
  },
  iconContainer: {
    padding: 10,
  },
});

export default PasswordInput;
