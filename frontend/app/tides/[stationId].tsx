import React, { useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Svg, { Polyline, Line as SvgLine, Text as SvgText } from "react-native-svg";
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
  const { width } = useWindowDimensions();

  const { data, isLoading, isError } = useQuery<TidePredictionResponse, Error>({
    queryKey: ["tidePredictions", stationId],
    enabled: !!stationId,
    queryFn: async () => {
      const res = await api.get(`/api/tides/stations/${stationId}/predictions`);
      return res.data;
    },
  });

  const chartInfo = useMemo(() => {
    if (!data?.predictions?.length) {
      return {
        pointsString: "",
        labels: [] as { x: number; text: string }[],
        minY: 0,
        maxY: 0,
      };
    }

    const sorted = [...data.predictions].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    const values = sorted.map((p) => p.height_ft);
    const minY = Math.min(...values);
    const maxY = Math.max(...values);
    const padding = 0.5;
    const yMin = minY - padding;
    const yMax = maxY + padding;

    const chartWidth = Math.min(width - 48, 360);
    const chartHeight = 160;
    const leftPad = 8;
    const topPad = 8;

    const n = sorted.length;
    const pointsString = sorted
      .map((p, idx) => {
        const t = idx / Math.max(1, n - 1);
        const x = leftPad + t * (chartWidth - leftPad * 2);
        const yNorm = (p.height_ft - yMin) / Math.max(1e-3, yMax - yMin);
        const y = topPad + (1 - yNorm) * (chartHeight - topPad * 2);
        return `${x},${y}`;
      })
      .join(" ");

    const labels: { x: number; text: string }[] = [];
    sorted.forEach((p, idx) => {
      // Only label a few points (e.g., every other)
      if (idx % 2 !== 0) return;
      const t = idx / Math.max(1, n - 1);
      const x = leftPad + t * (chartWidth - leftPad * 2);
      const d = new Date(p.time);
      const text = `${d.getUTCHours().toString().padStart(2, "0")}:${d
        .getUTCMinutes()
        .toString()
        .padStart(2, "0")}`;
      labels.push({ x, text });
    });

    return { pointsString, labels, minY: yMin, maxY: yMax, chartWidth, chartHeight };
  }, [data, width]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>TIDE DETAIL</Text>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color="#ff6b1a" />
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

            {data.predictions.length > 0 ? (
              <View style={styles.chartWrapper}>
                <Text style={styles.chartTitle}>Height (ft) vs Time (UTC)</Text>
                <Svg
                  width={chartInfo.chartWidth}
                  height={chartInfo.chartHeight}
                  style={{ alignSelf: "center" }}
                >
                  {/* Grid lines */}
                  <SvgLine
                    x1={0}
                    y1={chartInfo.chartHeight / 2}
                    x2={chartInfo.chartWidth}
                    y2={chartInfo.chartHeight / 2}
                    stroke="#1f2933"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  {/* Tide line */}
                  {chartInfo.pointsString.length > 0 && (
                    <Polyline
                      points={chartInfo.pointsString}
                      fill="none"
                      stroke="#ff6b1a"
                      strokeWidth={2}
                    />
                  )}
                  {/* X-axis labels */}
                  {chartInfo.labels.map((l) => (
                    <SvgText
                      key={l.x + l.text}
                      x={l.x}
                      y={chartInfo.chartHeight - 4}
                      fill="#8a9077"
                      fontSize={10}
                      textAnchor="middle"
                    >
                      {l.text}
                    </SvgText>
                  ))}
                </Svg>
                <Text style={styles.axisNote}>
                  Approximate curve; see table below for exact high/low tide times.
                </Text>
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
    backgroundColor: "#2d3a1f",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heading: {
    color: "#ff6b1a",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  subHeading: {
    color: "#ff8c42",
    fontSize: 14,
    marginBottom: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    color: "#8a9077",
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    color: "#fecaca",
    fontSize: 14,
    textAlign: "center",
  },
  chartWrapper: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#2d3a1f",
    borderWidth: 1,
    borderColor: "#111827",
    marginBottom: 16,
  },
  chartTitle: {
    color: "#ff8c42",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  axisNote: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 4,
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
    color: "#ff8c42",
  },
  cellHeight: {
    flex: 1,
    color: "#ff8c42",
    textAlign: "center",
  },
  cellType: {
    flex: 1,
    color: "#8a9077",
    textAlign: "right",
  },
});
