import type { BottomTabBarProps } from "expo-router/js-tabs";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useHaptics } from "@/hooks/useHaptics";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { MIN_TOUCH } from "@/theme/tokens";

const ICONS: Record<string, SymbolViewProps["name"]> = {
  index: { ios: "keyboard", android: "keyboard" },
  history: { ios: "chart.line.uptrend.xyaxis", android: "show_chart" },
  texts: { ios: "doc.text", android: "article" },
  settings: { ios: "gearshape", android: "settings" },
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const selected = state.index === index;
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const color = selected ? theme.colors.accent : theme.colors.muted;

        // Same event flow as the default tab bar, so screens can still listen for tabPress.
        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!selected && !event.defaultPrevented) {
            haptics.selection();
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: "tabLongPress", target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            accessibilityRole="tab"
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            accessibilityState={{ selected }}
          >
            <SymbolView
              name={ICONS[route.name] ?? { ios: "circle", android: "circle" }}
              size={24}
              tintColor={color}
              weight={selected ? "semibold" : "regular"}
            />
            <Text
              style={[styles.label, selected && styles.labelSelected, { color }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles({ colors, fonts, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    bar: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
    },
    tab: {
      flex: 1,
      minHeight: MIN_TOUCH,
      minWidth: MIN_TOUCH,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
    },
    pressed: { opacity: 0.6 },
    label: { ...textStyles.caption, fontSize: 11, lineHeight: 14 },
    labelSelected: { fontFamily: fonts.uiBold },
  });
}
