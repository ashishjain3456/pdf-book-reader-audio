import { Pressable, Text } from 'react-native';
import { styles } from './styles';

type Props = { direction: 'next' | 'previous'; enabled: boolean; onPress: () => void };

export function ReaderPageNavigationButton({ direction, enabled, onPress }: Props) {
  const label = direction === 'previous' ? 'Previous' : 'Next';
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      style={[styles.overlayControlButton, !enabled ? styles.overlayButtonDisabled : null]}
      accessibilityRole="button"
      accessibilityLabel={`${label} page`}
    >
      <Text style={styles.overlayButtonText}>{direction === 'previous' ? 'Prev' : 'Next'}</Text>
    </Pressable>
  );
}
