import type { ReaderTheme } from "../types";

export const buildVerseViewerStyles = (
  theme: Required<ReaderTheme>,
  isFullScreen: boolean,
  preserveInlineColors: boolean,
) => `
    <style>
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        background: transparent;
        color: ${theme.text};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
      }
      #app {
        height: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: ${isFullScreen ? 0 : 6}px;
        box-sizing: border-box;
      }
      #pages {
        flex: 1;
        min-height: 0;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: stretch;
      }
      .page {
        margin: 0;
        border: 0;
        border-radius: 12px;
        background: ${theme.page};
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        box-sizing: border-box;
      }
      .page.active {
        border-color: transparent;
        box-shadow: none;
      }
      .book-spread {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: stretch;
        gap: 14px;
        perspective: 1400px;
        transform-style: preserve-3d;
      }
      .book-spread.single {
        align-items: center;
      }
      .book-spread.single .page.book-sheet {
        width: 100%;
        height: 100%;
      }
      .book-spread.double .page.book-sheet {
        width: calc((100% - 14px) / 2);
        height: 100%;
      }
      .book-spread.double,
      #page-flip-book.double-spread {
        position: relative;
      }
      .book-spread.double::after,
      #page-flip-book.double-spread::after {
        content: '';
        position: absolute;
        top: 14px;
        bottom: 14px;
        left: 50%;
        width: 2px;
        transform: translateX(-1px);
        pointer-events: none;
        z-index: 20;
        background: linear-gradient(
          to bottom,
          rgba(120, 53, 15, 0),
          rgba(120, 53, 15, 0.2) 12%,
          rgba(120, 53, 15, 0.34) 50%,
          rgba(120, 53, 15, 0.2) 88%,
          rgba(120, 53, 15, 0)
        );
        box-shadow:
          -5px 0 12px rgba(120, 53, 15, 0.08),
          5px 0 12px rgba(255, 255, 255, 0.6);
      }
      #page-flip-book {
        width: 100%;
        height: 100%;
        min-height: 0;
        margin: 0 auto;
        position: relative;
        touch-action: pan-y;
      }
      #page-flip-book .stf__parent,
      #page-flip-book .stf__wrapper,
      #page-flip-book .stf__block {
        box-sizing: border-box;
      }
      #page-flip-book .stf__wrapper {
        margin: 0 auto;
      }
      .page-flip-source {
        display: none;
      }
      .page.book-sheet {
        margin: 0;
        height: 100%;
        border-radius: 6px;
        border: 1px solid rgba(120, 53, 15, 0.2);
        background: ${theme.page};
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.72),
          inset 10px 0 18px rgba(120, 53, 15, 0.045),
          inset -10px 0 18px rgba(120, 53, 15, 0.035),
          0 10px 24px rgba(68, 64, 60, 0.12);
        position: relative;
        flex-shrink: 0;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        backface-visibility: hidden;
        transform-origin: center center;
        will-change: transform, opacity;
      }
      .page-ornament {
        position: absolute;
        inset: 8px;
        pointer-events: none;
        z-index: 3;
        border-radius: 3px;
        background:
          radial-gradient(circle, #ec4899 0 2px, transparent 2.4px) top 5px left 16px / 32px 12px repeat-x,
          radial-gradient(circle, #ec4899 0 2px, transparent 2.4px) bottom 5px left 16px / 32px 12px repeat-x,
          radial-gradient(circle, #ec4899 0 2px, transparent 2.4px) left 5px top 16px / 12px 32px repeat-y,
          radial-gradient(circle, #ec4899 0 2px, transparent 2.4px) right 5px top 16px / 12px 32px repeat-y,
          repeating-linear-gradient(135deg, transparent 0 7px, #f97316 7px 10px, transparent 10px 16px) top / 100% 12px no-repeat,
          repeating-linear-gradient(45deg, transparent 0 7px, #f97316 7px 10px, transparent 10px 16px) bottom / 100% 12px no-repeat,
          repeating-linear-gradient(45deg, transparent 0 7px, #f97316 7px 10px, transparent 10px 16px) left / 12px 100% no-repeat,
          repeating-linear-gradient(135deg, transparent 0 7px, #f97316 7px 10px, transparent 10px 16px) right / 12px 100% no-repeat;
        filter: drop-shadow(0 0 0.6px rgba(194, 65, 12, 0.42));
      }
      .page-ornament::before {
        content: '';
        position: absolute;
        inset: 9px;
        border: 1px solid rgba(249, 115, 22, 0.62);
        border-radius: 2px;
      }
      .page.book-sheet.active {
        border-color: rgba(120, 53, 15, 0.24);
      }
      .page.book-sheet::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background: repeating-linear-gradient(
          to bottom,
          transparent,
          transparent 27px,
          rgba(148, 163, 184, 0.06) 28px
        );
      }
      .page.book-sheet::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        border-radius: inherit;
        background:
          linear-gradient(
            90deg,
            rgba(120, 53, 15, 0.08),
            rgba(120, 53, 15, 0) 9%,
            rgba(255, 255, 255, 0) 91%,
            rgba(120, 53, 15, 0.06)
          ),
          linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.58),
            rgba(255, 255, 255, 0) 18%,
            rgba(120, 53, 15, 0.035) 100%
          );
      }
      .book-spread.turn-next .page.book-sheet {
        animation: bookPageEnterNext 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        transform-origin: right center;
      }
      .book-spread.turn-prev .page.book-sheet {
        animation: bookPageEnterPrev 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        transform-origin: left center;
      }
      .book-spread.double.turn-next .page.book-sheet:nth-child(2) {
        animation-delay: 35ms;
      }
      .book-spread.double.turn-prev .page.book-sheet:nth-child(1) {
        animation-delay: 35ms;
      }
      @keyframes bookPageEnterNext {
        from {
          opacity: 0.78;
          transform: translateX(26px) rotateY(-8deg) scale(0.992);
        }
        to {
          opacity: 1;
          transform: translateX(0) rotateY(0deg) scale(1);
        }
      }
      @keyframes bookPageEnterPrev {
        from {
          opacity: 0.78;
          transform: translateX(-26px) rotateY(8deg) scale(0.992);
        }
        to {
          opacity: 1;
          transform: translateX(0) rotateY(0deg) scale(1);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .book-spread.turn-next .page.book-sheet,
        .book-spread.turn-prev .page.book-sheet {
          animation: none;
        }
      }
      .verse-page-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0;
        width: 100%;
        min-height: 100%;
        max-height: 100%;
        box-sizing: border-box;
        overflow-x: hidden;
        overflow-y: hidden;
        overscroll-behavior: contain;
        position: relative;
        z-index: 2;
      }
      .verse-block {
        border: 0;
        border-radius: 0;
        padding: 10px 12px;
        background: ${theme.accentSurface};
        position: relative;
        box-sizing: border-box;
        width: 100%;
        max-width: 760px;
        display: flex;
        flex-direction: column;
        align-items: center;
        max-height: 100%;
      }
      .book-spread .verse-page-content {
        width: fit-content;
        height: 100%;
        max-width: 88%;
        min-height: 0;
        padding: 34px 30px;
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
      }
      .page.book-sheet.overflowing-verse .verse-page-content {
        justify-content: flex-start;
      }
      .book-spread .verse-block {
        width: auto;
        max-width: 100%;
      }
      .book-spread .verse-content {
        width: auto;
        max-width: 100%;
      }
      .verse-block.active-verse {
        background: ${theme.accentSurface};
      }
      .verse-label {
        margin: 0 0 4px;
        font-size: var(--verse-label-font-size, 12px);
        font-weight: 800;
        color: ${theme.accent};
        text-align: center;
      }
      .verse-group {
        margin: 0 0 4px;
        font-size: var(--verse-group-font-size, 11px);
        font-weight: 800;
        color: ${theme.mutedText};
        text-transform: uppercase;
        letter-spacing: 0.03em;
        text-align: center;
      }
      .verse-content {
        margin: 0;
        font-size: var(--verse-font-size, 22px);
        line-height: var(--verse-line-height, 1.45);
        color: ${theme.text};
        font-weight: 800;
        max-width: 100%;
        width: 100%;
        max-height: 100%;
        overflow-wrap: anywhere;
        word-break: break-word;
        white-space: pre-wrap;
        text-align: center;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }
      .verse-content * {
        max-width: 100%;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      ${
        preserveInlineColors
          ? ""
          : `.verse-content *,
      .verse-label * {
        color: inherit !important;
      }`
      }
      .verse-content.style-aarti,
      .verse-label.style-aarti {
        color: ${theme.accent};
        font-weight: 800;
      }
      .verse-content.style-sutra,
      .verse-label.style-sutra {
        color: ${theme.mutedText};
        font-weight: 800;
        text-transform: uppercase;
      }
      .verse-content.style-soft,
      .verse-label.style-soft {
        color: ${theme.mutedText};
        font-style: italic;
        font-weight: 800;
      }
      .verse-content.style-shastra,
      .verse-label.style-shastra {
        color: ${theme.text};
        font-weight: 900;
      }
      .verse-content.style-midnight,
      .verse-label.style-midnight {
        color: ${theme.accentBlue};
        font-weight: 900;
      }
      .verse-content.style-maroon,
      .verse-label.style-maroon {
        color: ${theme.accentRed};
        font-weight: 900;
      }
      .verse-content.style-forest,
      .verse-label.style-forest {
        color: ${theme.accentGreen};
        font-weight: 800;
      }
      .verse-content.style-indigo,
      .verse-label.style-indigo {
        color: ${theme.accentIndigo};
        font-weight: 800;
      }
      .verse-content.style-graphite,
      .verse-label.style-graphite {
        color: ${theme.mutedText};
        font-weight: 800;
      }
    </style>
`;
