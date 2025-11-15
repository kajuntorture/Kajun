import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/api/client";

interface Track {
  id: string;
  name?: string | null;
  notes?: string | null;
  start_time: string;
  end_time?: string | null;
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
  const { data, isLoading, isError, refetch } = useQuery<Track[], Error>({
    queryKey: ["tracks"],
    queryFn: async () => {
      const res = await api.get<Track[]>("/api/tracks");
      return res.data;
    },
  });

  const tracks = data ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>TRACKS & TRIPS</Text>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color="#22d3ee" />
            <Text style={styles.infoText}>Loading recent tracks…</Text>
          </View>
        )}

        {isError && !isLoading && (
          <View style={styles.center}>
            <Text style={styles.errorText}>
              Could not load tracks. Check connection and try again.
            </Text>
            <Text style={[styles.infoText, { marginTop: 4 }]} onPress={() => refetch()}>
              Tap here to retry.
            </Text>
          </View>
        )}

        {!isLoading && !isError && tracks.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.infoText}>No tracks recorded yet.</Text>
            <Text style={styles.infoText}>Start a track from the Chart screen.</Text>
          </View>
        )}

        {!isLoading && !isError && tracks.length > 0 && (
          <FlashList
            data={tracks}
            keyExtractor={(item) => item.id}
            estimatedItemSize={72}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const title = item.name || "Recorded track";
              return (
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.sub}>{formatDate(item.start_time)}</Text>
                  </View>
                  <View style={styles.rightCol}>
                    <Text style={styles.duration}>{formatDuration(item.start_time, item.end_time)}</Text>
                    {item.end_time ? (
                      <Text style={styles.statusDone}>Finished</Text>
                    ) : (
                      <Text style={styles.statusLive}>Live</Text>
                    )}
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
  listContent: {
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#111827",
  },
  title: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "500",
  },
  sub: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  rightCol: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  duration: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "500",
  },
  statusDone: {
    color: "#6ee7b7",
    fontSize: 11,
    marginTop: 2,
  },
  statusLive: {
    color: "#fbbf24",
    fontSize: 11,
    marginTop: 2,
  },
});
