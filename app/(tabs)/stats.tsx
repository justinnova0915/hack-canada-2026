import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type ExpenseData = {
  value: number;
  color: string;
  name: string;
  max: number;
};

export default function StatsScreen() {
  const expenses = {
    necessary: { current: 650, goal: 1000, color: '#e8a44a' },
    food: { current: 420, goal: 500, color: '#c9663c' },
    misc: { current: 150, goal: 200, color: '#7a4e2d' },
    recurring: { current: 300, goal: 350, color: '#9c8166' }
  };

  const totalCurrent = Object.values(expenses).reduce((acc, curr) => acc + curr.current, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>THIS MONTH&apos;S EXPENSES</Text>

      {/* Hero Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.totalValue}>${totalCurrent}</Text>
        <Text style={styles.totalSub}>Total Spent</Text>
      </View>

      {/* Expense Progress Bars */}
      <View style={styles.statsContainer}>
        {Object.entries(expenses).map(([key, data]) => {
          const percentage = Math.min((data.current / data.goal) * 100, 100);

          return (
            <View key={key} style={styles.macroRow}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroName}>{key.toUpperCase()}</Text>
                <Text style={styles.macroDetail}>
                  <Text style={styles.currentWeight}>${data.current}</Text>
                  <Text style={styles.goalWeight}> / ${data.goal}</Text>
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: data.color, width: `${percentage}%` }
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Composition Breakdown */}
      <View style={styles.breakdownBox}>
        <Text style={styles.breakdownTitle}>Spending Breakdown</Text>
        <View style={styles.compositionBar}>
          {Object.entries(expenses).map(([key, data]) => (
            <View
              key={key}
              style={{
                flex: data.current,
                backgroundColor: data.color,
                height: '100%'
              }}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  content: {
    padding: 24,
    paddingTop: 64,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#e8a44a',
    opacity: 0.8,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
  },
  totalValue: {
    color: '#f0ece3',
    fontSize: 42,
    fontWeight: '900',
  },
  totalSub: {
    color: 'rgba(240,236,227,0.5)',
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    gap: 24,
  },
  macroRow: {
    gap: 8,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  macroName: {
    color: '#f0ece3',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  macroDetail: {
    fontSize: 14,
  },
  currentWeight: {
    color: '#f0ece3',
    fontWeight: '700',
  },
  goalWeight: {
    color: 'rgba(240,236,227,0.4)',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownBox: {
    marginTop: 40,
    gap: 12,
  },
  breakdownTitle: {
    color: 'rgba(240,236,227,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  compositionBar: {
    height: 12,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  }
});