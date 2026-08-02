import * as react_jsx_runtime from 'react/jsx-runtime';

interface PdfDocumentViewerProps {
    url: string;
    title?: string;
    filename?: string;
    downloadUrl?: string;
    loadingLabel?: string;
}
declare function PdfDocumentViewer({ url, title, filename, downloadUrl, loadingLabel, }: PdfDocumentViewerProps): react_jsx_runtime.JSX.Element;

export { PdfDocumentViewer, type PdfDocumentViewerProps };
