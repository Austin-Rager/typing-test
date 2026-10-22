import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { useTheme, type Theme } from "@/hooks/useTheme";
import { withAlpha } from "@/theme/colors";

type Props = {
  data: number[]; // WPM values, oldest to newest
  height?: number;
  compact?: boolean; // hides gridlines and labels, for small inline charts
  highlightLast?: boolean; // makes the newest point stand out
};

const LABEL_GUTTER = 32; // room on the left for the WPM labels
const LABEL_HEIGHT = 14;
const PAD = 6; // keeps dots and the stroke from being clipped at the edges
const GRID_FRACTIONS = [1, 0.5, 0]; // top, middle, bottom

export function WpmLineChart({
  data,
  height = 160,
  compact = false,
  highlightLast = false,
}: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { colors } = theme;
  const [width, setWidth] = useState(0);

  if (data.length < 2) {
    return (
      <Text style={styles.caption}>Finish 2 tests to see your trend</Text>
    );
  }

  const best = Math.max(...data);
  const latest = data[data.length - 1];
  // Headroom above the best point; 1 avoids dividing by 0 if every WPM is 0.
  const yMax = Math.max(best * 1.15, 1);

  const left = compact ? PAD : LABEL_GUTTER;
  const top = compact ? PAD : LABEL_HEIGHT / 2 + PAD;
  const bottom = compact ? height - PAD : height - LABEL_HEIGHT / 2 - PAD;
  const plotWidth = Math.max(width - left - PAD, 0);

  const toX = (i: number) => left + (i / (data.length - 1)) * plotWidth;
  const toY = (wpm: number) => bottom - (wpm / yMax) * (bottom - top);

  const points = data.map((wpm, i) => ({ x: toX(i), y: toY(wpm) }));
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L${toX(data.length - 1)},${bottom} L${left},${bottom} Z`;

  return (
    <View
      style={{ height }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`WPM trend, ${data.length} tests, latest ${latest}, best ${best}`}
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          {!compact &&
            GRID_FRACTIONS.map((f) => {
              const y = toY(yMax * f);
              return (
                <Line
                  key={f}
                  x1={left}
                  x2={width - PAD}
                  y1={y}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={1}
                />
              );
            })}
          <Path d={areaPath} fill={withAlpha(colors.accent, 0.15)} />
          <Path
            d={linePath}
            fill="none"
            stroke={colors.accent}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((p, i) => {
            const isHighlighted = highlightLast && i === points.length - 1;
            return (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isHighlighted ? 5 : 3}
                fill={colors.accent}
                stroke={isHighlighted ? colors.surface : undefined}
                strokeWidth={isHighlighted ? 2 : 0}
              />
            );
          })}
        </Svg>
      )}

      {/* Plain Text over the SVG so the labels use the loaded mono font. */}
      {!compact &&
        width > 0 &&
        GRID_FRACTIONS.map((f) => (
          <Text
            key={f}
            style={[styles.label, { top: toY(yMax * f) - LABEL_HEIGHT / 2 }]}
            maxFontSizeMultiplier={1}
          >
            {Math.round(yMax * f)}
          </Text>
        ))}
    </View>
  );
}

function makeStyles({ colors, fonts, textStyles }: Theme) {
  return StyleSheet.create({
    caption: { ...textStyles.caption, color: colors.muted },
    label: {
      position: "absolute",
      left: 0,
      width: LABEL_GUTTER - 6,
      textAlign: "right",
      fontFamily: fonts.mono,
      fontSize: 11,
      lineHeight: LABEL_HEIGHT,
      color: colors.muted,
    },
  });
}
