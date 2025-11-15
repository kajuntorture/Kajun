import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/api/client";

interface TideStation {
  id: string;
  name: string;
  state?: string;
}

export default function TidesScreen() {
  const [search, setSearch] = useState("san francisco");
  const [submittedSearch, setSubmittedSearch] = useState("san francisco");

  const { data, isLoading, isError, refetch } = useQuery<{ data: TideStation[] } | TideStation[], Error>(
    ["tideStations", submittedSearch],
    async () => {
      const res = await api.get("/api/tides/stations", {
        params: { search: submittedSearch, state: "CA" },
      });
      return res.data;
    }
  );

  const stations: TideStation[] = Array.isArray(data) ? data : data?.data ?? [];

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
            <ActivityIndicator color="#22d3ee" />
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
              <View style={styles.stationRow}>
                <View>
                  <Text style={styles.stationName}>{item.name}</Text>
                  <Text style={styles.stationSub}>{item.state ?? "US"}</Text>
                </View>
              </View>
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
  searchRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#e5e7eb",
    marginRight: 8,
  },
  searchButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#22d3ee",
  },
  searchButtonText: {
    color: "#020617",
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    color: "#9ca3af",
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
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "500",
  },
  stationSub: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
});
