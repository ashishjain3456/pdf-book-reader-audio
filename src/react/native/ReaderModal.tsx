import type { ReactNode } from 'react';
import { Modal, Platform } from 'react-native';

type Props = {
  children: ReactNode;
  onRequestClose: () => void;
  variant: 'dialog' | 'fullscreen';
  visible: boolean;
};

export function ReaderModal({ children, onRequestClose, variant, visible }: Props) {
  const isFullScreen = variant === 'fullscreen';

  return (
    <Modal
      visible={visible}
      transparent={!isFullScreen}
      animationType={isFullScreen ? (Platform.OS === 'ios' ? 'none' : 'slide') : 'fade'}
      presentationStyle={isFullScreen ? 'fullScreen' : undefined}
      statusBarTranslucent={!isFullScreen || Platform.OS === 'android'}
      onRequestClose={onRequestClose}
    >
      {children}
    </Modal>
  );
}
