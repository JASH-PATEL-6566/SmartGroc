import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { loginWithEmailPassword } from "../../utils/auth";
import Icon from "react-native-vector-icons/Feather";
import Input from "@/components/Input";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    await loginWithEmailPassword(email, password);
    setLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <ImageBackground
            source={require("../../assets/images/login/login_bg.png")}
            style={styles.background}
          >
            <View style={styles.overlay}>
              <View style={styles.formContainer}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>

                <Input
                  lable="Email"
                  value={email}
                  setValue={setEmail}
                  placeholder="abc@abc.com"
                  keyboardType="email-address"
                />

                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.inputPassword}
                    autoCapitalize="none"
                    placeholderTextColor="gray"
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.iconContainer}
                  >
                    <Icon
                      name={showPassword ? "eye" : "eye-off"}
                      size={20}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <Text style={styles.loginText}>
                    {loading ? "Logging in..." : "Sign In"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>
                    Don't have an account?
                    <Text
                      style={styles.switchLink}
                      onPress={() => router.push("/(auth)/signup")}
                    >
                      {" "}
                      Sign Up
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  background: {
    width,
    height,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  overlay: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "gray",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
  },
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
  inputPassword: {
    flex: 1,
    padding: 15,
  },
  iconContainer: {
    padding: 10,
  },
  loginButton: {
    backgroundColor: "#28a745",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  switchContainer: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  switchText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  switchLink: {
    color: "#007bff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
