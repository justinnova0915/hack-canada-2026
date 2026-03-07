import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// @ts-ignore: Metro resolves .native or .web automatically at runtime
import MapComponent from '../../components/MapComponent';

export default function MapScreen() {
  const transactions: any[] = [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>GEOSPATIAL</Text>
        <Text style={styles.heroTitle}>SpendMap</Text>
      </View>

      <View style={styles.mapFrame}>
        <MapComponent transactions={transactions} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  header: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 20,
    backgroundColor: '#0d1117',
    zIndex: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#e8a44a',
    opacity: 0.8,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#f0ece3',
    lineHeight: 40,
  },
  mapFrame: {
    flex: 1,
  },
});