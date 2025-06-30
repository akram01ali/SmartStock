import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Reset error message
    setErrorMessage(null);
    setIsLoading(true);

    // Email validation
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For demo purposes - show success message
      Alert.alert("Success", "Login successful!", [
        {
          text: "OK",
          onPress: () => {
            // Here you would typically navigate to your home screen
            console.log("Navigate to home screen");
          },
        },
      ]);

      // Log the login attempt (replace with your actual login logic)
      console.log("Login attempt:", {
        email: email,
        rememberMe: rememberMe,
      });
    } catch (error) {
      setErrorMessage("Unable to login. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    // Handle sign up navigation
    Alert.alert("Sign Up", "Navigate to sign up screen");
    console.log("Navigate to sign up screen");
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.content}>
          {/* Replace with your own logo image */}
          <Image source={require("../../assets/iacs.png")} />

          <Text style={styles.title}>Welcome to IACS</Text>
          <Text style={styles.subtitle}>Please sign in to continue</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="voornaam.achternaam"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMessage) setErrorMessage(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          {errorMessage && (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          )}

          <TouchableOpacity
            style={styles.rememberContainer}
            onPress={() => setRememberMe(!rememberMe)}
            disabled={isLoading}
          >
            <View
              style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
            >
              {rememberMe && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.signUpContainer}>
        <Text style={styles.signUpText}>Don't have an account? </Text>
        <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
          <Text style={styles.signUpLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.loginButtonText}>
          {isLoading ? "Logging in..." : "Log in"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    padding: 30,
    paddingBottom: 50,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlaceholder: {
    width: 250,
    height: 120,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  logoText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 55,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  errorMessage: {
    color: "red",
    width: "100%",
    marginBottom: 10,
    fontSize: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#666",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  rememberText: {
    fontSize: 14,
    color: "#666",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  signUpText: {
    fontSize: 14,
    color: "#666",
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  loginButton: {
    backgroundColor: "#000",
    height: 55,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 30,
    marginBottom: 30,
  },
  loginButtonDisabled: {
    backgroundColor: "#666",
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
