export const DEFAULT_PDFJS_VERSION: string;
export const DEFAULT_PDFJS_SCRIPT_URL: string;
export const DEFAULT_PDFJS_WORKER_URL: string;

export function resolvePdfJsSources(
  scriptUrl?: string,
  workerUrl?: string,
): { scriptUrl: string; workerUrl: string };
