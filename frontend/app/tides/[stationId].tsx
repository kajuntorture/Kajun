import React, { useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { LineChart } from "react-native-gifted-charts";
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

  const chartData = useMemo(() => {
    if (!data?.predictions?.length) return [] as { value: number; label: string }[];
    return data.predictions.map((p) => {
      const d = new Date(p.time);
      const label = `${d.getUTCHours().toString().padStart(2, "0")}:${d
        .getUTCMinutes()
        .toString()
        .padStart(2, "0")}`;
      return { value: p.height_ft, label };
    });
  }, [data]);

  const maxY = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.max(...chartData.map((p) => p.value));
  }, [chartData]);

  const minY = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.min(...chartData.map((p) => p.value));
  }, [chartData]);

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
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.subHeading}>Date: {data.date}</Text>

            {chartData.length > 0 ? (
              <View style={styles.chartBox}>
                <Text style={styles.chartTitle}>Height (ft) vs Time (UTC)</Text>
                <LineChart
                  data={chartData}
                  thickness={2}
                  color="#22d3ee"
                  areaChart
                  startFillColor="rgba(34,211,238,0.35)"
                  endFillColor="rgba(15,23,42,0.1)"
                  startOpacity={0.8}
                  endOpacity={0.1}
                  hideDataPoints
                  yAxisColor="transparent"
                  xAxisColor="#111827"
                  xAxisLabelTextStyle={styles.axisLabel}
                  yAxisTextStyle={styles.axisLabel}
                  yAxisOffset={Math.floor(minY) - 1}
                  maxValue={Math.ceil(maxY) + 1}
                  noOfSections={4}
                  backgroundColor="transparent"
                />
              </View>
            ) : (
              <Text style={styles.infoText}>No predictions for this day.</Text>
            )}

            {/* Raw table for precise times */}
            {data.predictions.length > 0 && (
              <View style={styles.table}>
                {data.predictions.map((p) => (
                  <View key={p.time + p.height_ft} style={styles.row}>
                    <Text style={styles.cellTime}>
                      {new Date(p.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    <Text style={styles.cellHeight}>{p.height_ft.toFixed(2)} ft</Text>
                    <Text style={styles.cellType}>{p.type === "H" ? "High" : p.type === "L" ? "Low" : ""}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
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
  chartBox: {
    backgroundColor: "#020617",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  chartTitle: {
    color: "#e5e7eb",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  axisLabel: {
    color: "#9ca3af",
    fontSize: 10,
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
