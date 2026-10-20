export type PdfViewport = {
  width: number;
  height: number;
};

export type PdfPageProxy = {
  getViewport: (args: { scale: number }) => PdfViewport;
  render: (args: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }) => {
    promise: Promise<void>;
  };
};

export type PdfDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
  destroy?: () => Promise<void>;
};

export type PdfLoadingTask = {
  promise: Promise<PdfDocumentProxy>;
  destroy?: () => Promise<void>;
};

export type PdfJsApi = {
  version: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (
    src:
      | string
      | {
          url: string;
          disableAutoFetch?: boolean;
          disableRange?: boolean;
          disableStream?: boolean;
        },
  ) => PdfLoadingTask;
};

export type RenderedPage = {
  pageNumber: number;
  dataUrl: string;
};

export interface PdfDocumentViewerProps {
  url: string;
  title?: string;
  filename?: string;
  downloadUrl?: string;
  loadingLabel?: string;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  fullScreenLabel?: string;
}
