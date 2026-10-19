export type ReaderShareLinks = {
  systemUrl: string;
  whatsappUrl: string;
  whatsappWebUrl: string;
  facebookUrl: string;
  xUrl: string;
  telegramUrl: string;
};

export function buildReaderShareLinks(label: string, shareUrl: string) {
  const message = shareUrl ? `${label}\n${shareUrl}` : label;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(label || '');
  const encodedMessage = encodeURIComponent(message);
  const xUrl = shareUrl
    ? `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    : `https://twitter.com/intent/tweet?text=${encodedText}`;
  const telegramUrl = shareUrl
    ? `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
    : `https://t.me/share/url?text=${encodedText}`;

  const links: ReaderShareLinks = {
    systemUrl: shareUrl
      ? `https://www.addtoany.com/share#url=${encodedUrl}&title=${encodedText}`
      : `https://www.addtoany.com/share#title=${encodedText}`,
    whatsappUrl: `whatsapp://send?text=${encodedMessage}`,
    whatsappWebUrl: `https://wa.me/?text=${encodedMessage}`,
    facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    xUrl,
    telegramUrl,
  };

  return { message, links };
}
