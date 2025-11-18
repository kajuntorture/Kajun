import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/api/client";

const CAMO_DARK = "#2d3a1f";
const CAMO_BROWN = "#4a3f2e";
const ORANGE_ACCENT = "#ff6b1a";
const ORANGE_TEXT = "#ff8c42";

interface Trip {
  id: string;
  track_id: string;
  name?: string | null;
  start_time: string;
  end_time?: string | null;
  distance_nm: number;
  avg_speed_kn: number;
  max_speed_kn: number;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startIso: string, endIso?: string | null) {
  if (!endIso) return "In progress";
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!start || !end || end <= start) return "--";
  const minutes = Math.round((end - start) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

export default function TripsScreen() {
  const { data, isLoading, isError, refetch } = useQuery<Trip[], Error>({
    queryKey: ["trips"],
    queryFn: async () => {
      const res = await api.get<Trip[]>("/api/trips");
      return res.data;
    },
  });

  const trips = data ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>TRIPS</Text>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color={ORANGE_ACCENT} />
            <Text style={styles.infoText}>Loading trips…</Text>
          </View>
        )}

        {isError && !isLoading && (
          <View style={styles.center}>
            <Text style={styles.errorText}>
              Could not load trips. Check connection and try again.
            </Text>
            <Text style={[styles.infoText, { marginTop: 4 }]} onPress={() => refetch()}>
              Tap here to retry.
            </Text>
          </View>
        )}

        {!isLoading && !isError && trips.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.infoText}>No trips yet.</Text>
            <Text style={styles.infoText}>Start and stop a track from the Chart screen.</Text>
          </View>
        )}

        {!isLoading && !isError && trips.length > 0 && (
          <FlashList
            data={trips}
            keyExtractor={(item) => item.id}
            estimatedItemSize={80}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const title = item.name || "Recorded trip";
              return (
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.sub}>{formatDate(item.start_time)}</Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={styles.distance}>{item.distance_nm.toFixed(2)} nm</Text>
                    <Text style={styles.duration}>{formatDuration(item.start_time, item.end_time)}</Text>
                    <Text style={styles.speed}>{`${item.avg_speed_kn.toFixed(1)} kn avg / ${item.max_speed_kn.toFixed(1)} kn max`}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CAMO_DARK,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heading: {
    color: ORANGE_ACCENT,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
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
    color: ORANGE_TEXT,
    fontSize: 14,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CAMO_BROWN,
  },
  title: {
    color: ORANGE_TEXT,
    fontSize: 16,
    fontWeight: "500",
  },
  sub: {
    color: "#8a9077",
    fontSize: 12,
    marginTop: 2,
  },
  rightCol: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  distance: {
    color: ORANGE_TEXT,
    fontSize: 14,
    fontWeight: "600",
  },
  duration: {
    color: ORANGE_TEXT,
    fontSize: 12,
  },
  speed: {
    color: "#8a9077",
    fontSize: 11,
    marginTop: 2,
  },
});
