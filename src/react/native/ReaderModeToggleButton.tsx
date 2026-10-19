import { Pressable, Text } from 'react-native';
import { styles } from './styles';
import type { ReaderTheme } from './types';

type Props = {
  accessibilityLabel: string;
  icon: string;
  onPress: () => void;
  selected: boolean;
  theme: Required<ReaderTheme>;
};

export function ReaderModeToggleButton({
  accessibilityLabel,
  icon,
  onPress,
  selected,
  theme,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.modeButton,
        {
          borderColor: selected ? theme.accent : theme.border,
          backgroundColor: selected ? theme.accentSurface : theme.buttonSurface,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
    >
      <Text style={[styles.modeIcon, { color: selected ? theme.accent : theme.mutedText }]}>
        {icon}
      </Text>
    </Pressable>
  );
}
