import { Pressable, Text, View } from 'react-native';
import { ReaderModal } from './ReaderModal';
import { styles } from './styles';
import type { ReaderDialogRequest, ReaderTheme } from './types';

type Props = {
  dialog: ReaderDialogRequest | null;
  onClose: () => void;
  theme: Required<ReaderTheme>;
};

export function ReaderDialogModal({ dialog, onClose, theme }: Props) {
  return (
    <ReaderModal variant="dialog" visible={Boolean(dialog)} onRequestClose={onClose}>
      <View style={styles.readerDialogBackdrop}>
        <View
          accessibilityViewIsModal
          testID="reader-dialog"
          style={[
            styles.readerDialogCard,
            {
              borderColor: theme.border,
              backgroundColor: theme.surface,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <Text style={[styles.readerDialogTitle, { color: theme.accentRed }]}>
            {dialog?.title}
          </Text>
          {dialog?.message ? (
            <Text style={[styles.readerDialogMessage, { color: theme.text }]}>
              {dialog.message}
            </Text>
          ) : null}
          <View style={styles.readerDialogActions}>
            {dialog?.buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  accessibilityRole="button"
                  onPress={() => {
                    onClose();
                    button.onPress?.();
                  }}
                  style={[
                    styles.readerDialogButton,
                    {
                      borderColor: theme.accent,
                      backgroundColor: isCancel ? theme.page : theme.accentRed,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.readerDialogButtonText,
                      { color: isCancel ? theme.accentRed : '#fff' },
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </ReaderModal>
  );
}
