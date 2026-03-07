import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

export default function StatsScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const chartSize = Math.min(screenWidth * 0.55, 220);

  const macros = {
    protein: 80,
    carbs: 210,
    fat: 65,
  };

  const total = macros.protein + macros.carbs + macros.fat;

  const data = [
    {
      name: 'Protein',
      grams: macros.protein,
      color: '#e8a44a',
      legendFontColor: '#f0ece3',
      legendFontSize: 12,
    },
    {
      name: 'Carbs',
      grams: macros.carbs,
      color: '#c9663c',
      legendFontColor: '#f0ece3',
      legendFontSize: 12,
    },
    {
      name: 'Fat',
      grams: macros.fat,
      color: '#7a4e2d',
      legendFontColor: '#f0ece3',
      legendFontSize: 12,
    },
  ];

  return (
    <View style={styles.container}>

      <Text style={styles.sectionLabel}>TODAY&apos;S MACROS</Text>

      <View style={styles.chartBox}>
        {/* Donut Chart */}
        <PieChart
          data={data}
          width={chartSize}
          height={chartSize}
          chartConfig={{
            color: (opacity = 1) => `rgba(240, 236, 227, ${opacity})`,
            backgroundColor: 'transparent',
            backgroundGradientFrom: '#0d1117',
            backgroundGradientTo: '#0d1117',
          }}
          accessor="grams"
          backgroundColor="transparent"
          paddingLeft="0"
          hasLegend={false}
          absolute
        />

        {/* Center label */}
        <View style={styles.centerLabel}>
          <Text style={styles.centerTotal}>{total}g</Text>
          <Text style={styles.centerSub}>total</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {data.map((item) => (
          <View key={item.name} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendName}>{item.name}</Text>
            <Text style={styles.legendValue}>{item.grams}g</Text>
            <Text style={styles.legendPct}>
              {Math.round((item.grams / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
    padding: 24,
    paddingTop: 64,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#e8a44a',
    opacity: 0.8,
    marginBottom: 20,
  },
  chartBox: {
    width: '55%',
    minWidth: 180,
    maxWidth: 220,
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerTotal: {
    color: '#f0ece3',
    fontSize: 22,
    fontWeight: '900',
  },
  centerSub: {
    color: 'rgba(240,236,227,0.5)',
    fontSize: 11,
  },
  legend: {
    marginTop: 24,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    color: '#f0ece3',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  legendValue: {
    color: 'rgba(240,236,227,0.6)',
    fontSize: 13,
    marginRight: 8,
  },
  legendPct: {
    color: '#e8a44a',
    fontSize: 13,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
});
