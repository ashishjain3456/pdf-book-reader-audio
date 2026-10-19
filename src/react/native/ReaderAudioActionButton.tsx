import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { styles } from './styles';

type Props = {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

export function ReaderAudioActionButton({
  accessibilityLabel,
  disabled = false,
  icon,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.overlayAudioButton,
        styles.overlayAudioPlayButton,
        disabled ? styles.overlayButtonDisabled : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={20} color="#fff" />
    </Pressable>
  );
}
