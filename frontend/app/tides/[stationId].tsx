import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/api/client";

interface TidePredictionPoint {
  time: string;
  height_ft: number;
  type?: string | null;
}

interface TidePredictionResponse {
  station_id: string;
  date: string;
  predictions: TidePredictionPoint[];
}

export default function TideDetailScreen() {
  const { stationId } = useLocalSearchParams<{ stationId: string }>();

  const { data, isLoading, isError } = useQuery<TidePredictionResponse, Error>({
    queryKey: ["tidePredictions", stationId],
    enabled: !!stationId,
    queryFn: async () => {
      const res = await api.get(`/api/tides/stations/${stationId}/predictions`);
      return res.data;
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>TIDE DETAIL</Text>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color="#22d3ee" />
            <Text style={styles.infoText}>Loading predictions…</Text>
          </View>
        )}

        {isError && !isLoading && (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load tide predictions.</Text>
          </View>
        )}

        {!isLoading && !isError && data && (
          <View style={{ flex: 1 }}>
            <Text style={styles.subHeading}>Date: {data.date}</Text>
            {data.predictions.length === 0 ? (
              <Text style={styles.infoText}>No predictions for this day.</Text>
            ) : (
              <View style={styles.table}>
                {data.predictions.map((p) => (
                  <View key={p.time + p.height_ft} style={styles.row}>
                    <Text style={styles.cellTime}>{new Date(p.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                    <Text style={styles.cellHeight}>{p.height_ft.toFixed(2)} ft</Text>
                    <Text style={styles.cellType}>{p.type === "H" ? "High" : p.type === "L" ? "Low" : ""}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heading: {
    color: "#22d3ee",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  subHeading: {
    color: "#e5e7eb",
    fontSize: 14,
    marginBottom: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    color: "#fecaca",
    fontSize: 14,
    textAlign: "center",
  },
  table: {
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#111827",
  },
  cellTime: {
    flex: 1,
    color: "#e5e7eb",
  },
  cellHeight: {
    flex: 1,
    color: "#e5e7eb",
    textAlign: "center",
  },
  cellType: {
    flex: 1,
    color: "#9ca3af",
    textAlign: "right",
  },
});
