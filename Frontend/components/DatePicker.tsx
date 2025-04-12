"use client";

import type React from "react";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label = "Date",
  placeholder = "Select date",
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const currentDate = value || new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  );

  const formatDate = (date: Date | null): string => {
    if (!date) return placeholder;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to midnight for clean comparison

    if (newDate < today) {
      // You can show an alert or toast here if you want
      Alert.alert("Invalid Date", "You cannot select a past date.");
      return;
    }

    onChange(newDate);
    setShowPicker(false);
  };

  const openPicker = () => {
    const baseDate = value || new Date();
    setSelectedYear(baseDate.getFullYear());
    setSelectedMonth(baseDate.getMonth());
    setSelectedDay(baseDate.getDate());
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      {/* {label && <Text style={styles.label}>{label}</Text>} */}

      <TouchableOpacity style={styles.dateButton} onPress={openPicker}>
        <Feather
          name="calendar"
          size={18}
          color="#4CAF50"
          style={styles.icon}
        />
        <Text style={[styles.dateText, { color: value ? "#000" : "#999" }]}>
          {formatDate(value)}
        </Text>
      </TouchableOpacity>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.pickerButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Select Date</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={[styles.pickerButton, { color: "#4CAF50" }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateSelectors}>
              {/* Month Selector */}
              <View style={styles.selectorContainer}>
                <Text style={styles.selectorLabel}>Month</Text>
                <View style={styles.selector}>
                  <ScrollView>
                    {months.map((month, index) => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.selectorItem,
                          selectedMonth === index && {
                            backgroundColor: "#4CAF5020",
                          },
                        ]}
                        onPress={() => {
                          setSelectedMonth(index);
                          const daysInNewMonth = getDaysInMonth(
                            selectedYear,
                            index
                          );
                          if (selectedDay > daysInNewMonth) {
                            setSelectedDay(daysInNewMonth);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.selectorItemText,
                            selectedMonth === index && {
                              color: "#4CAF50",
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Day Selector */}
              <View style={styles.selectorContainer}>
                <Text style={styles.selectorLabel}>Day</Text>
                <View style={styles.selector}>
                  <ScrollView>
                    {days.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.selectorItem,
                          selectedDay === day && {
                            backgroundColor: "#4CAF5020",
                          },
                        ]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text
                          style={[
                            styles.selectorItemText,
                            selectedDay === day && {
                              color: "#4CAF50",
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Year Selector */}
              <View style={styles.selectorContainer}>
                <Text style={styles.selectorLabel}>Year</Text>
                <View style={styles.selector}>
                  <ScrollView>
                    {years.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.selectorItem,
                          selectedYear === year && {
                            backgroundColor: "#4CAF5020",
                          },
                        ]}
                        onPress={() => {
                          setSelectedYear(year);
                          const daysInNewMonth = getDaysInMonth(
                            year,
                            selectedMonth
                          );
                          if (selectedDay > daysInNewMonth) {
                            setSelectedDay(daysInNewMonth);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.selectorItemText,
                            selectedYear === year && {
                              color: "#4CAF50",
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            <Text style={styles.selectedDate}>
              {`${months[selectedMonth]} ${selectedDay}, ${selectedYear}`}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#555",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  icon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#fff",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  pickerButton: {
    fontSize: 16,
    padding: 8,
    color: "#999",
  },
  dateSelectors: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  selectorContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  selectorLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
    color: "#666",
  },
  selector: {
    height: 150,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  selectorItem: {
    padding: 12,
    alignItems: "center",
  },
  selectorItemText: {
    fontSize: 16,
    color: "#333",
  },
  selectedDate: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
    color: "#333",
  },
});
