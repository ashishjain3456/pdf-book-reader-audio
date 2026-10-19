export const DEFAULT_PDFJS_VERSION = '4.10.38';
export const DEFAULT_PDFJS_SCRIPT_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${DEFAULT_PDFJS_VERSION}/pdf.min.mjs`;
export const DEFAULT_PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${DEFAULT_PDFJS_VERSION}/pdf.worker.min.mjs`;

export function resolvePdfJsSources(scriptUrl, workerUrl) {
  if (Boolean(scriptUrl) !== Boolean(workerUrl)) {
    throw new Error('Configure both pdfJsScriptUrl and pdfJsWorkerUrl together.');
  }
  return {
    scriptUrl: scriptUrl || DEFAULT_PDFJS_SCRIPT_URL,
    workerUrl: workerUrl || DEFAULT_PDFJS_WORKER_URL,
  };
}
