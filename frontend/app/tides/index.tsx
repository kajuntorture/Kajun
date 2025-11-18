import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import api from "../../src/api/client";

interface TideStation {
  id: string;
  name: string;
  state?: string;
}

export default function TidesScreen() {
  const [search, setSearch] = useState("san francisco");
  const [submittedSearch, setSubmittedSearch] = useState("san francisco");
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery<TideStation[], Error>({
    queryKey: ["tideStations", submittedSearch],
    queryFn: async () => {
      const res = await api.get("/api/tides/stations", {
        params: { search: submittedSearch, state: "CA" },
      });
      return res.data as TideStation[];
    },
  });

  const stations: TideStation[] = data ?? [];

  const handleSearch = () => {
    setSubmittedSearch(search.trim());
    refetch();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>TIDES</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Search station (e.g. San Francisco)"
            placeholderTextColor="#6b7280"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color="#ff6b1a" />
            <Text style={styles.infoText}>Loading stations…</Text>
          </View>
        )}

        {isError && !isLoading && (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load tide stations. Pull to retry.</Text>
          </View>
        )}

        {!isLoading && !isError && (
          <FlashList
            data={stations}
            keyExtractor={(item) => item.id}
            estimatedItemSize={56}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.stationRow}
                onPress={() => router.push(`/tides/${item.id}`)}
              >
                <View>
                  <Text style={styles.stationName}>{item.name}</Text>
                  <Text style={styles.stationSub}>{item.state ?? "US"}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
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
  searchRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#2d3a1f",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#ff8c42",
    marginRight: 8,
  },
  searchButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#ff6b1a",
  },
  searchButtonText: {
    color: "#2d3a1f",
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    color: "#8a9077",
    marginTop: 8,
  },
  errorText: {
    color: "#fecaca",
    textAlign: "center",
  },
  listContent: {
    paddingVertical: 8,
  },
  stationRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#111827",
  },
  stationName: {
    color: "#ff8c42",
    fontSize: 16,
    fontWeight: "500",
  },
  stationSub: {
    color: "#8a9077",
    fontSize: 12,
    marginTop: 2,
  },
});
