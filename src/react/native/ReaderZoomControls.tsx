import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { styles } from './styles';

type Props = {
  inDisabled: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  outDisabled: boolean;
};

export function ReaderZoomControls({ inDisabled, onZoomIn, onZoomOut, outDisabled }: Props) {
  return (
    <>
      <Pressable
        onPress={onZoomOut}
        disabled={outDisabled}
        style={[styles.overlayControlButton, outDisabled ? styles.overlayButtonDisabled : null]}
        accessibilityRole="button"
        accessibilityLabel="Zoom out"
      >
        <Ionicons name="remove-outline" size={20} color={outDisabled ? '#d4d4d8' : '#fff'} />
      </Pressable>
      <Pressable
        onPress={onZoomIn}
        disabled={inDisabled}
        style={[styles.overlayControlButton, inDisabled ? styles.overlayButtonDisabled : null]}
        accessibilityRole="button"
        accessibilityLabel="Zoom in"
      >
        <Ionicons name="add-outline" size={20} color={inDisabled ? '#d4d4d8' : '#fff'} />
      </Pressable>
    </>
  );
}
