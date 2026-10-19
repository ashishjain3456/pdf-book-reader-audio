import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ReaderModeToggleButton } from './ReaderModeToggleButton';
import { styles } from './styles';
import type { ReaderTheme, ReaderViewMode } from './types';

type Props = {
  showHeader: boolean;
  fullScreen: boolean;
  showShareOverlay: boolean;
  onCloseShareOverlay: () => void;
  onToggleShareOverlay: () => void;
  onSwitchReaderMode: (mode: ReaderViewMode) => void;
  showOverlay: () => void;
  viewMode: ReaderViewMode;
  theme: Required<ReaderTheme>;
  hasCustomActions: boolean;
  customActions: ReactNode;
  shareMenu: ReactNode;
};

export function ReaderHeaderControls({
  showHeader,
  fullScreen,
  showShareOverlay,
  onCloseShareOverlay,
  onToggleShareOverlay,
  onSwitchReaderMode,
  showOverlay,
  viewMode,
  theme,
  hasCustomActions,
  customActions,
  shareMenu,
}: Props) {
  return (
    <>
      {showShareOverlay ? (
        <Pressable
          style={styles.shareBackdrop}
          onPress={onCloseShareOverlay}
          accessibilityLabel="Close share options"
        />
      ) : null}
      {showHeader ? (
        <View style={[styles.header, fullScreen ? styles.headerFullScreen : null]}>
          <View style={styles.headerActions}>
            {hasCustomActions ? (
              customActions
            ) : (
              <>
                <ReaderModeToggleButton
                  accessibilityLabel="Complete PDF mode"
                  icon="📄"
                  selected={viewMode === 'continuous'}
                  theme={theme}
                  onPress={() => onSwitchReaderMode('continuous')}
                />
                <ReaderModeToggleButton
                  accessibilityLabel="Paginated book mode"
                  icon="📖"
                  selected={viewMode === 'book'}
                  theme={theme}
                  onPress={() => onSwitchReaderMode('book')}
                />
                <Pressable
                  onPress={() => {
                    onToggleShareOverlay();
                    showOverlay();
                  }}
                  style={[
                    styles.modeButton,
                    {
                      borderColor: showShareOverlay ? theme.accent : theme.border,
                      backgroundColor: showShareOverlay
                        ? theme.accentSurface
                        : theme.buttonSurface,
                    },
                  ]}
                  accessibilityLabel="Share"
                >
                  <Ionicons
                    name="share-social-outline"
                    size={15}
                    color={showShareOverlay ? theme.accent : theme.mutedText}
                  />
                </Pressable>
              </>
            )}
          </View>
          {showShareOverlay ? shareMenu : null}
        </View>
      ) : null}
    </>
  );
}
