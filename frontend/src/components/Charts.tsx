import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import type { MaterialDistributionItem, VolumeItem } from '../data/dashboard';
import { Card, colors } from './ui';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

export function VolumeChart({ volumeData }: { volumeData: VolumeItem[] }) {
  const max = 1800;
  const width = 620;
  const height = 230;
  const series = [
    { key: 'plastico', label: 'Plástico', color: colors.primary },
    { key: 'papel', label: 'Papel', color: colors.accent },
    { key: 'vidro', label: 'Vidro', color: colors.success },
    { key: 'metal', label: 'Metal', color: colors.warning },
  ] as const;
  const seriesCount = series.length;
  const plotLeft = 46;
  const plotRight = 580;
  const barWidth = 12;
  const barGap = 6;
  const groupWidth = seriesCount * barWidth + (seriesCount - 1) * barGap;
  const baseY = 182;
  const firstGroupCenter = plotLeft + groupWidth / 2;
  const lastGroupCenter = plotRight - groupWidth / 2;
  const groupStep = volumeData.length > 1 ? (lastGroupCenter - firstGroupCenter) / (volumeData.length - 1) : 0;

  return (
    <Card style={styles.chartCard}>
      <Text style={styles.cardTitle}>Volume Mensal por Material</Text>
      <Text style={styles.cardSubtitle}>Quantidade de materiais processados nos últimos 5 meses (kg)</Text>
      <Svg viewBox={`0 0 ${width} ${height}`} style={styles.svg}>
        {[0, 1, 2, 3].map((line) => (
          <Path key={line} d={`M${plotLeft} ${35 + line * 45} H${plotRight}`} stroke={colors.border} strokeWidth={1} opacity={0.8} />
        ))}
        {volumeData.map((item, index) => {
          const groupCenter = firstGroupCenter + index * groupStep;
          const x = groupCenter - groupWidth / 2;
          return (
            <G key={item.mes}>
              {series.map((serie, serieIndex) => {
                const value = item[serie.key];
                const barHeight = (value / max) * 150;
                return (
                  <Rect
                    key={serie.key}
                    x={x + serieIndex * (barWidth + barGap)}
                    y={baseY - barHeight}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                    fill={serie.color}
                    opacity={0.82}
                  />
                );
              })}
              <SvgText
                fill={colors.muted}
                fontFamily={fontFamily}
                fontSize={12}
                fontWeight="800"
                textAnchor="middle"
                x={groupCenter}
                y={222}
              >
                {item.mes}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      <View style={styles.legend}>
        {series.map((serie) => (
          <View key={serie.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: serie.color }]} />
            <Text style={styles.legendText}>{serie.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

export function DistributionChart({ materialDistribution }: { materialDistribution: MaterialDistributionItem[] }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const segments = materialDistribution.reduce<Array<{ name: string; value: number; color: string; length: number; offset: number }>>(
    (items, item) => {
      const previousOffset = items.reduce((sum, segment) => sum + segment.length, 0);
      return [
        ...items,
        {
          ...item,
          length: (item.value / 100) * circumference,
          offset: previousOffset,
        },
      ];
    },
    [],
  );

  return (
    <Card style={styles.distributionCard}>
      <Text style={styles.cardTitle}>Distribuição por Material</Text>
      <Text style={styles.cardSubtitle}>Percentual por tipo de material</Text>
      <View style={styles.donutWrap}>
        <Svg width={190} height={190} viewBox="0 0 190 190">
          <Circle cx={95} cy={95} r={radius} stroke={colors.cardSoft} strokeWidth={24} fill="transparent" />
          {segments.map((item) => {
            return (
              <Circle
                key={item.name}
                cx={95}
                cy={95}
                r={radius}
                stroke={item.color}
                strokeWidth={24}
                strokeDasharray={`${item.length} ${circumference - item.length}`}
                strokeDashoffset={-item.offset}
                strokeLinecap="round"
                fill="transparent"
                transform="rotate(-90 95 95)"
              />
            );
          })}
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={styles.donutValue}>100%</Text>
          <Text style={styles.donutLabel}>rastreado</Text>
        </View>
      </View>
      <View style={styles.distributionLegend}>
        {materialDistribution.map((item) => (
          <View key={item.name} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>
              {item.name}: {item.value}%
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    flex: 2,
    minWidth: 320,
  },
  distributionCard: {
    flex: 1,
    minWidth: 280,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  svg: {
    height: 230,
    marginTop: 12,
    width: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  legendDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  legendText: {
    color: colors.muted,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  donutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  donutCenter: {
    alignItems: 'center',
    position: 'absolute',
  },
  donutValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  donutLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  distributionLegend: {
    gap: 8,
  },
});
