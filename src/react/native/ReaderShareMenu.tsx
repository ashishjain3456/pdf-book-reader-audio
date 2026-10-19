import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { styles } from './styles';
import type { ReaderShareLinks } from './readerShareLinks';
import type { ReaderTheme } from './types';

type Props = {
  shareUrl: string;
  links: ReaderShareLinks;
  theme: Required<ReaderTheme>;
  onShareSystem: () => void;
  onShareWhatsApp: () => void;
  onOpenUrl: (target: string) => void;
};

export function ReaderShareMenu({
  shareUrl,
  links,
  theme,
  onShareSystem,
  onShareWhatsApp,
  onOpenUrl,
}: Props) {
  return (
    <View
      style={[
        styles.shareOverlayCard,
        {
          borderColor: theme.border,
          backgroundColor: theme.surface,
          shadowColor: theme.shadow,
        },
      ]}
    >
      <View style={styles.shareOverlayRow}>
        <Pressable
          accessibilityLabel="Share"
          style={[
            styles.shareIconButton,
            { borderColor: theme.border, backgroundColor: theme.buttonSurface },
          ]}
          onPress={onShareSystem}
        >
          <Ionicons name="arrow-redo-outline" size={18} color={theme.text} />
        </Pressable>
        <Pressable
          accessibilityLabel="Share on WhatsApp"
          style={[
            styles.shareIconButton,
            { borderColor: theme.border, backgroundColor: theme.buttonSurface },
          ]}
          onPress={onShareWhatsApp}
        >
          <FontAwesome6 name="whatsapp" size={18} color="#16a34a" />
        </Pressable>
        <Pressable
          accessibilityLabel="Share on Facebook"
          style={[
            styles.shareIconButton,
            { borderColor: theme.border, backgroundColor: theme.buttonSurface },
          ]}
          disabled={!shareUrl}
          onPress={() => onOpenUrl(links.facebookUrl)}
        >
          <FontAwesome6 name="facebook-f" size={18} color={!shareUrl ? '#a1a1aa' : '#2563eb'} />
        </Pressable>
        <Pressable
          accessibilityLabel="Share on X"
          style={[
            styles.shareIconButton,
            { borderColor: theme.border, backgroundColor: theme.buttonSurface },
          ]}
          onPress={() => onOpenUrl(links.xUrl)}
        >
          <FontAwesome6 name="x-twitter" size={18} color={theme.text} />
        </Pressable>
        <Pressable
          accessibilityLabel="Share on Telegram"
          style={[
            styles.shareIconButton,
            { borderColor: theme.border, backgroundColor: theme.buttonSurface },
          ]}
          onPress={() => onOpenUrl(links.telegramUrl)}
        >
          <FontAwesome6 name="telegram" size={18} color="#0284c7" />
        </Pressable>
      </View>
    </View>
  );
}
