import { useCallback, useRef } from "react";
import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

type StaticServer = {
  start: () => Promise<string>;
  stop?: (() => Promise<unknown>) | (() => void);
};

type StaticServerConstructor = new (options: {
  fileDir: string;
  hostname?: string;
  nonLocal?: boolean;
  port?: number;
  stopInBackground?: boolean;
}) => StaticServer;

type Options = {
  downloadName: string;
  downloadUrl: string;
  effectivePdfUrl?: string;
  enableLocalFallback: boolean;
  onError?: (error: { message: string; code?: string }) => void;
  setLoadingError: (message: string | null) => void;
  setLoadingPdf: (loading: boolean) => void;
  setLocalPdfUrl: (url: string | null) => void;
  setTriedLocalFileFallback: (tried: boolean) => void;
  setViewerReloadKey: (update: (key: number) => number) => void;
  triedLocalFileFallback: boolean;
};

export function useLocalPdfFallback({
  downloadName,
  downloadUrl,
  effectivePdfUrl,
  enableLocalFallback,
  onError,
  setLoadingError,
  setLoadingPdf,
  setLocalPdfUrl,
  setTriedLocalFileFallback,
  setViewerReloadKey,
  triedLocalFileFallback,
}: Options) {
  const staticServerRef = useRef<StaticServer | null>(null);

  const stopStaticServer = useCallback(async () => {
    const server = staticServerRef.current;
    if (!server || typeof server.stop !== "function") {
      staticServerRef.current = null;
      return;
    }
    try {
      await server.stop();
    } catch {
      // Ignore server shutdown errors; the reader can still retry the source URL.
    } finally {
      staticServerRef.current = null;
    }
  }, []);

  const reloadSource = useCallback(() => {
    setLocalPdfUrl(downloadUrl);
    setViewerReloadKey((key) => key + 1);
    setLoadingPdf(true);
    setLoadingError(null);
  }, [downloadUrl, setLoadingError, setLoadingPdf, setLocalPdfUrl, setViewerReloadKey]);

  const handlePdfLoadError = useCallback(
    (message: string, errorCode: string) => {
      const isLocalPdfSource =
        effectivePdfUrl?.startsWith("file://") === true ||
        /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\//i.test(
          effectivePdfUrl || "",
        );
      const shouldFallback =
        enableLocalFallback &&
        (errorCode === "fetch-failed" || isLocalPdfSource) &&
        !triedLocalFileFallback;

      if (shouldFallback) {
        setTriedLocalFileFallback(true);
        setLoadingPdf(true);
        setLoadingError(null);

        void (async () => {
          const cachedLocalFileUri = effectivePdfUrl?.startsWith("file://")
            ? effectivePdfUrl
            : null;
          try {
            const cachedLocalFile = cachedLocalFileUri
              ? new File(cachedLocalFileUri)
              : null;
            const downloaded = cachedLocalFile
              ? cachedLocalFile
              : await File.downloadFileAsync(
                  downloadUrl,
                  new File(Paths.cache, downloadName),
                  { idempotent: true },
                );

            if (!downloaded.uri || !downloaded.exists) {
              if (cachedLocalFile) {
                console.warn(
                  "[PdfDocumentViewer] Cached PDF disappeared before it could be served; retrying the source URL.",
                  { uri: downloaded.uri, exists: downloaded.exists },
                );
                reloadSource();
                return;
              }
              setLoadingError(
                `Downloaded fallback file does not exist at: ${downloaded.uri}`,
              );
              setLoadingPdf(false);
              return;
            }

            if (Platform.OS === "android" || Platform.OS === "ios") {
              await stopStaticServer();
              const filePath = downloaded.uri.replace("file://", "");
              const dirPath = filePath.substring(0, filePath.lastIndexOf("/"));
              const fileBase = filePath.substring(filePath.lastIndexOf("/") + 1);
              let ServerClass: StaticServerConstructor | null = null;
              try {
                const module = await import(
                  "@dr.pogodin/react-native-static-server"
                );
                ServerClass = module?.default || null;
              } catch {
                ServerClass = null;
              }

              if (!ServerClass) {
                if (cachedLocalFile) {
                  console.warn(
                    "[PdfDocumentViewer] Native static server is unavailable; reopening the source PDF URL.",
                  );
                  reloadSource();
                } else {
                  setLoadingError(
                    "In-app local PDF fallback is unavailable in this build. Please try again later.",
                  );
                  setLoadingPdf(false);
                }
                return;
              }

              const server = new ServerClass({
                fileDir: dirPath,
                hostname: "127.0.0.1",
                nonLocal: false,
                port: 0,
              });
              const serverUrl = await server.start();
              if (!serverUrl) {
                setLocalPdfUrl(
                  cachedLocalFile ? downloadUrl : downloaded.uri,
                );
              } else {
                staticServerRef.current = server;
                setLocalPdfUrl(
                  `${serverUrl}/${encodeURIComponent(fileBase)}`,
                );
              }
            } else if (cachedLocalFile) {
              setLocalPdfUrl(downloadUrl);
            } else {
              setLocalPdfUrl(downloaded.uri);
            }
            setViewerReloadKey((key) => key + 1);
          } catch (error) {
            if (cachedLocalFileUri) {
              reloadSource();
              return;
            }
            const fallbackMessage =
              error instanceof Error
                ? error.message
                : "Unable to load this PDF in-app.";
            setLoadingError(`Fallback error: ${fallbackMessage}`);
            setLoadingPdf(false);
          }
        })();
        return;
      }

      setLoadingError(
        errorCode === "fetch-failed"
          ? `Unable to load this PDF in-app. Tried: ${effectivePdfUrl}`
          : message,
      );
      onError?.({ message, code: errorCode || undefined });
      setLoadingPdf(false);
    },
    [
      downloadName,
      downloadUrl,
      effectivePdfUrl,
      enableLocalFallback,
      onError,
      reloadSource,
      setLoadingError,
      setLoadingPdf,
      setLocalPdfUrl,
      setTriedLocalFileFallback,
      setViewerReloadKey,
      stopStaticServer,
      triedLocalFileFallback,
    ],
  );

  return { handlePdfLoadError, stopStaticServer };
}
