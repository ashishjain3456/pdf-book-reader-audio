import * as react from 'react';

interface PdfDocumentViewerProps {
    url: string;
    title?: string;
    filename?: string;
    downloadUrl?: string;
    loadingLabel?: string;
    zoomInLabel?: string;
    zoomOutLabel?: string;
    fullScreenLabel?: string;
}
declare function PdfDocumentViewer({ url, title, filename, downloadUrl, loadingLabel, zoomInLabel, zoomOutLabel, fullScreenLabel, }: PdfDocumentViewerProps): react.JSX.Element;

export { PdfDocumentViewer, type PdfDocumentViewerProps };
