import { Text, View } from 'react-native';
import { styles } from './styles';

export function ReaderPageBadge({ text }: { text: string }) {
  return (
    <View style={styles.overlayPageBadge}>
      <Text style={styles.overlayPageText}>{text}</Text>
    </View>
  );
}
