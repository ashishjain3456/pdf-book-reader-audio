import { bookStyles } from "./styles/book";
import { contentStyles } from "./styles/content";
import { controlsStyles } from "./styles/controls";
import { layoutStyles } from "./styles/layout";

/**
 * Stable style map for the native reader components.
 *
 * The feature-specific catalogs live in separate files to keep layout,
 * reading content, book presentation, and controls independently maintainable.
 */
export const styles = {
  ...layoutStyles,
  ...contentStyles,
  ...bookStyles,
  ...controlsStyles,
};
