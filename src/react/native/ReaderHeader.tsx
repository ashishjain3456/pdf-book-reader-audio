import type { ReactNode } from 'react';
import { ReaderHeaderControls } from './ReaderHeaderControls';
import { ReaderShareMenu } from './ReaderShareMenu';
import type { ReaderShareLinks } from './readerShareLinks';
import type { ReaderActionsContext, ReaderTheme, ReaderViewMode } from './types';

type Props = {
  actions: ReaderActionsContext;
  customActions: ReactNode;
  fullScreen: boolean;
  hasCustomActions: boolean;
  links: ReaderShareLinks;
  onCloseShareOverlay: () => void;
  onOpenShareUrl: (target: string) => void;
  onShareSystem: () => void;
  onShareWhatsApp: () => void;
  onShowOverlay: () => void;
  onToggleShareOverlay: () => void;
  showHeader: boolean;
  showShareOverlay: boolean;
  shareUrl: string;
  theme: Required<ReaderTheme>;
  viewMode: ReaderViewMode;
};

export function ReaderHeader({
  actions,
  customActions,
  fullScreen,
  hasCustomActions,
  links,
  onCloseShareOverlay,
  onOpenShareUrl,
  onShareSystem,
  onShareWhatsApp,
  onShowOverlay,
  onToggleShareOverlay,
  showHeader,
  showShareOverlay,
  shareUrl,
  theme,
  viewMode,
}: Props) {
  return (
    <ReaderHeaderControls
      showHeader={showHeader}
      fullScreen={fullScreen}
      showShareOverlay={showShareOverlay}
      onCloseShareOverlay={onCloseShareOverlay}
      onToggleShareOverlay={onToggleShareOverlay}
      onSwitchReaderMode={actions.switchReaderMode}
      showOverlay={onShowOverlay}
      viewMode={viewMode}
      theme={theme}
      hasCustomActions={hasCustomActions}
      customActions={customActions}
      shareMenu={
        <ReaderShareMenu
          shareUrl={shareUrl}
          links={links}
          theme={theme}
          onShareSystem={onShareSystem}
          onShareWhatsApp={onShareWhatsApp}
          onOpenUrl={onOpenShareUrl}
        />
      }
    />
  );
}
