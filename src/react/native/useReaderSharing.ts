import { useCallback, useMemo } from 'react';
import * as ExpoLinking from 'expo-linking';
import { buildReaderShareLinks } from './readerShareLinks';
import type { ReaderDialogRequest } from './types';

type Options = {
  label: string;
  readerDialogOkLabel: string;
  setReaderDialog: (dialog: ReaderDialogRequest | null) => void;
  setShowShareOverlay: (show: boolean) => void;
  shareUrl: string;
};

export function useReaderSharing({
  label,
  readerDialogOkLabel,
  setReaderDialog,
  setShowShareOverlay,
  shareUrl,
}: Options) {
  const shareLinks = useMemo(() => buildReaderShareLinks(label, shareUrl).links, [label, shareUrl]);

  const openShareUrl = useCallback(
    async (target: string) => {
      try {
        await ExpoLinking.openURL(target);
        setShowShareOverlay(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to open share link';
        setReaderDialog({
          title: 'Error',
          message,
          buttons: [{ text: readerDialogOkLabel }],
        });
      }
    },
    [readerDialogOkLabel, setReaderDialog, setShowShareOverlay]
  );

  const openWhatsAppShare = useCallback(async () => {
    try {
      await ExpoLinking.openURL(shareLinks.whatsappUrl);
      setShowShareOverlay(false);
    } catch {
      void openShareUrl(shareLinks.whatsappWebUrl);
    }
  }, [openShareUrl, setShowShareOverlay, shareLinks.whatsappUrl, shareLinks.whatsappWebUrl]);

  const openSystemShare = useCallback(
    async () => void openShareUrl(shareLinks.systemUrl),
    [openShareUrl, shareLinks.systemUrl]
  );

  return { shareLinks, openShareUrl, openWhatsAppShare, openSystemShare };
}
