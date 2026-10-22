import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Swipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import {
  useAnimatedReaction,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { useTheme, type Theme } from "@/hooks/useTheme";

const ACTION_WIDTH = 88; // 80 for the button plus the gap before it
// Dragging this far past the edge deletes on release, like iOS Mail.
const FULL_SWIPE_DISTANCE = 200;

type Props = {
  children: ReactNode;
  onDelete: () => void;
};

export function SwipeableRow({ children, onDelete }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const pastFullSwipe = useSharedValue(false);

  return (
    <Swipeable
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight
      // "Will open" fires on release, before the row springs back to the
      // button width, so pastFullSwipe still reflects where the finger let go.
      onSwipeableWillOpen={() => {
        // A short swipe leaves the Delete button showing; a long one deletes.
        if (pastFullSwipe.get()) onDelete();
      }}
      renderRightActions={(_progress, translation, methods) => (
        <DeleteAction
          translation={translation}
          pastFullSwipe={pastFullSwipe}
          methods={methods}
          onDelete={onDelete}
          styles={styles}
          iconColor={theme.colors.onAccent}
        />
      )}
    >
      {children}
    </Swipeable>
  );
}

type DeleteActionProps = {
  translation: SharedValue<number>;
  pastFullSwipe: SharedValue<boolean>;
  methods: SwipeableMethods;
  onDelete: () => void;
  styles: ReturnType<typeof makeStyles>;
  iconColor: string;
};

// Its own component so it can use hooks (renderRightActions is a plain callback).
function DeleteAction({
  translation,
  pastFullSwipe,
  methods,
  onDelete,
  styles,
  iconColor,
}: DeleteActionProps) {
  // Translation goes negative when swiping left to reveal the right action.
  useAnimatedReaction(
    () => -translation.value > FULL_SWIPE_DISTANCE,
    (past) => pastFullSwipe.set(past),
  );

  return (
    <View style={styles.actionContainer}>
      <Pressable
        onPress={() => {
          methods.close();
          onDelete();
        }}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        // Screen readers use the row's "Delete test" action instead.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <SymbolView
          name={{ ios: "trash", android: "delete" }}
          size={22}
          tintColor={iconColor}
        />
        <Text style={styles.actionText}>Delete</Text>
      </Pressable>
    </View>
  );
}

function makeStyles({ colors, radius, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    actionContainer: { width: ACTION_WIDTH, paddingLeft: spacing.sm },
    action: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      backgroundColor: colors.danger,
      borderRadius: radius.md,
    },
    pressed: { opacity: 0.85 },
    actionText: { ...textStyles.caption, color: colors.onAccent },
  });
}
