import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReaderTheme } from "./types";
import { styles } from "./styles";

type Props = {
  playing: boolean;
  completed: boolean;
  onPress: () => void;
  theme: Required<ReaderTheme>;
};

export function ReaderAutoReadButton({
  playing,
  completed,
  onPress,
  theme,
}: Props) {
  return (
    <View style={{ alignItems: "center", flexDirection: "row", gap: 7 }}>
      <Pressable
        onPress={onPress}
        style={[
          styles.overlayControlButton,
          { backgroundColor: theme.autoReadAccent },
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          completed
            ? "Replay auto-read"
            : playing
              ? "Pause auto-read"
              : "Play auto-read"
        }
        accessibilityHint="Auto-read advances the selected verse text by estimated reading time"
        testID="reader-auto-read-toggle"
      >
        <Ionicons
          name={
            completed
              ? "refresh-outline"
              : playing
                ? "pause-outline"
                : "play-outline"
          }
          size={20}
          color="#fff"
        />
      </Pressable>
      {completed ? (
        <Text
          style={{ color: theme.overlayText, fontSize: 12, fontWeight: "700" }}
        >
          Reading complete
        </Text>
      ) : null}
    </View>
  );
}
