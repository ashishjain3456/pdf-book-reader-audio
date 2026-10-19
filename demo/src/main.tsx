import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { PdfDocumentViewer } from "react-audio-book-reader/react/web";
import "./style.css";

type TextBlock = {
  id: number;
  text: string;
  startMs: string;
  endMs: string;
};

const samplePdfUrl = `${import.meta.env.BASE_URL}sample.pdf`;
const initialBlocks: TextBlock[] = [
  { id: 1, text: "A quiet page can hold a thousand journeys.", startMs: "", endMs: "" },
  { id: 2, text: "Turn one thought into a path of light.", startMs: "", endMs: "" },
  { id: 3, text: "Read a line, hear its rhythm, keep your place.", startMs: "", endMs: "" },
  {
    id: 4,
    text: "Words and sound move together, one moment at a time.",
    startMs: "",
    endMs: "",
  },
];

function formatTime(ms: number) {
  const safeMs = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(safeMs / 60_000);
  const seconds = Math.floor((safeMs % 60_000) / 1000);
  const millis = safeMs % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(millis).padStart(3, "0")}`;
}

function parseTime(value: string) {
  const match = value.trim().match(/^(\d{1,3}):(\d{2}):(\d{1,3})$/);
  if (!match) return null;
  const [, minutesText, secondsText, millisText] = match;
  const minutes = Number(minutesText);
  const seconds = Number(secondsText);
  const millis = Number(millisText);
  if (seconds > 59 || millis > 999) return null;
  return minutes * 60_000 + seconds * 1000 + millis;
}

function App() {
  const [pdfUrl, setPdfUrl] = useState(samplePdfUrl);
  const [pdfUrlInput, setPdfUrlInput] = useState(samplePdfUrl);
  const [pdfSourceLabel, setPdfSourceLabel] = useState("Bundled sample PDF");
  const [pdfSourceType, setPdfSourceType] = useState<"url" | "file">("url");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioUrlInput, setAudioUrlInput] = useState("");
  const [blocks, setBlocks] = useState(initialBlocks);
  const [tempo, setTempo] = useState(1);
  const [accent, setAccent] = useState("#f2a65a");
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [highlightActiveText, setHighlightActiveText] = useState(true);
  const [previewMode, setPreviewMode] = useState<"pdf" | "text">("pdf");
  const [readerViewMode, setReaderViewMode] = useState<"book" | "continuous">("book");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [textPageIndex, setTextPageIndex] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");
  const [audioError, setAudioError] = useState("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const localPdfObjectUrl = useRef<string | null>(null);
  const textBlockRefs = useRef<Record<number, HTMLElement | null>>({});
  const nextId = useRef(5);

  const updateBlock = (id: number, updates: Partial<TextBlock>) => {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, ...updates } : block)),
    );
  };

  const applyAudioUrl = () => {
    setAudioError("");
    setActiveLine(null);
    setIsAudioPlaying(false);
    setAudioUrl(audioUrlInput.trim());
  };

  const applyPdfUrl = () => {
    if (localPdfObjectUrl.current) {
      URL.revokeObjectURL(localPdfObjectUrl.current);
      localPdfObjectUrl.current = null;
    }
    setPdfUrl(pdfUrlInput.trim());
    setPdfSourceLabel(pdfUrlInput.trim() || "No PDF selected");
    setPdfSourceType("url");
  };

  const loadLocalPdf = (file: File | undefined) => {
    if (!file) return;
    if (localPdfObjectUrl.current) URL.revokeObjectURL(localPdfObjectUrl.current);
    const objectUrl = URL.createObjectURL(file);
    localPdfObjectUrl.current = objectUrl;
    setPdfUrl(objectUrl);
    setPdfSourceLabel(file.name);
    setPdfSourceType("file");
  };

  const setPlaybackTempo = (value: number) => {
    setTempo(value);
    if (audioRef.current) audioRef.current.playbackRate = value;
  };

  const onAudioTimeUpdate = () => {
    const player = audioRef.current;
    if (!player) return;
    const currentMs = player.currentTime * 1000;
    const mappedIndex = blocks.findIndex((block) => {
      const start = parseTime(block.startMs);
      const end = parseTime(block.endMs);
      return start !== null && end !== null && end > start && currentMs >= start && currentMs < end;
    });
    setActiveLine(mappedIndex >= 0 ? mappedIndex : null);
    if (mappedIndex >= 0 && readerViewMode === "book") setTextPageIndex(mappedIndex);

    if (player.dataset.segmentEnd) {
      const endMs = Number(player.dataset.segmentEnd);
      if (currentMs >= endMs) {
        player.pause();
        player.currentTime = endMs / 1000;
        delete player.dataset.segmentEnd;
      }
    }
  };

  useEffect(() => {
    setTextPageIndex((current) => Math.min(current, Math.max(0, blocks.length - 1)));
  }, [blocks.length]);

  const setTimeFromPlayer = (id: number, field: "startMs" | "endMs") => {
    const player = audioRef.current;
    if (!player) return;
    updateBlock(id, { [field]: formatTime(player.currentTime * 1000) });
  };

  const toggleAudioPlayback = async () => {
    const player = audioRef.current;
    if (!player) return;
    if (player.paused) {
      delete player.dataset.segmentEnd;
      try {
        await player.play();
      } catch {
        setAudioError("The browser could not play this audio URL. Check that it points to an audio file.");
      }
    } else {
      player.pause();
      delete player.dataset.segmentEnd;
    }
  };

  const playBlock = async (block: TextBlock) => {
    const player = audioRef.current;
    const start = parseTime(block.startMs);
    const end = parseTime(block.endMs);
    if (!player || start === null || end === null || end <= start) return;
    player.dataset.segmentEnd = String(end);
    player.currentTime = start / 1000;
    try {
      await player.play();
    } catch {
      setAudioError("The browser could not play this audio URL. Check that it points to an audio file.");
    }
  };

  const addBlock = () => {
    const id = nextId.current++;
    setBlocks((current) => [...current, { id, text: "", startMs: "", endMs: "" }]);
  };

  const navigateTextBlock = (offset: number) => {
    const target = Math.min(blocks.length - 1, Math.max(0, textPageIndex + offset));
    setTextPageIndex(target);
    if (readerViewMode === "continuous") {
      textBlockRefs.current[blocks[target]?.id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const outputJson = JSON.stringify(
    {
      pdfUrl: pdfSourceType === "url" ? pdfUrl || null : null,
      pdfFileName: pdfSourceType === "file" ? pdfSourceLabel : null,
      audioUrl: audioUrl || null,
      readerOptions: { viewMode: readerViewMode, zoomLevel },
      verses: blocks
        .filter((block) => block.text.trim())
        .map((block, index) => ({
          id: block.id,
          label: `Block ${index + 1}`,
          content: block.text.trim(),
        })),
      verseAudioMappings: blocks.flatMap((block, index) => {
        const segmentStartMs = parseTime(block.startMs);
        const segmentEndMs = parseTime(block.endMs);
        if (
          !block.text.trim() ||
          !audioUrl ||
          segmentStartMs === null ||
          segmentEndMs === null ||
          segmentEndMs <= segmentStartMs
        ) {
          return [];
        }
        return [
          {
            id: `mapping-${block.id}`,
            verseId: block.id,
            audioAssetUrl: audioUrl,
            segmentStartMs,
            segmentEndMs,
            sortOrder: index,
          },
        ];
      }),
    },
    null,
    2,
  );
  const activeMappedBlock = activeLine === null ? null : blocks[activeLine] || null;

  const copyOutputJson = async () => {
    try {
      await navigator.clipboard.writeText(outputJson);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("Select and copy the JSON below");
    }
  };

  useEffect(
    () => () => {
      if (localPdfObjectUrl.current) URL.revokeObjectURL(localPdfObjectUrl.current);
    },
    [],
  );

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark">R</span> Reader Studio
        </a>
        <span className="status"><i /> Interactive demo</span>
      </header>

      <section className="intro" id="top">
        <p className="eyebrow">REACT AUDIO BOOK READER</p>
        <h1>Read the page.<br /><em>Hear the story.</em></h1>
        <p className="lead">
          Load a PDF and audio URL, edit text blocks, and map each block to a timed audio segment.
        </p>
      </section>

      <section className="source-panel" aria-label="Media sources">
        <div className="panel-heading">
          <div><span className="eyebrow">YOUR SOURCES</span><h2>Load media by URL</h2></div>
        </div>
        <div className="source-grid">
          <form className="source-field" onSubmit={(event) => { event.preventDefault(); applyPdfUrl(); }}>
            <label htmlFor="pdf-url">PDF URL</label>
            <div className="url-row">
              <input id="pdf-url" type="url" value={pdfUrlInput} onChange={(event) => setPdfUrlInput(event.target.value)} placeholder="https://example.com/book.pdf" />
              <button className="secondary-button" type="submit">Load PDF</button>
            </div>
            <label className="file-picker">
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => {
                  loadLocalPdf(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <span>Choose local PDF</span>
              <small>Use this when the URL host blocks browser access.</small>
            </label>
          </form>
          <form className="source-field" onSubmit={(event) => { event.preventDefault(); applyAudioUrl(); }}>
            <label htmlFor="audio-url">Audio URL</label>
            <div className="url-row">
              <input id="audio-url" type="url" value={audioUrlInput} onChange={(event) => setAudioUrlInput(event.target.value)} placeholder="https://example.com/reading.mp3" />
              <button className="secondary-button" type="submit">Load audio</button>
            </div>
            <small>Use a direct URL to an audio file, such as MP3, M4A, or OGG.</small>
          </form>
        </div>
      </section>

      <section className="workspace" aria-label="Reader demonstration">
        <div className="reader-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">LIVE PREVIEW</span>
              <h2>{previewMode === "pdf" ? "PDF reader" : "Mapped text"}</h2>
            </div>
            <span className="pill">{previewMode === "pdf" ? "PDF · WEB" : "TEXT · AUDIO"}</span>
          </div>
          <div className="preview-switch" role="group" aria-label="Choose preview">
            <button
              type="button"
              className={previewMode === "pdf" ? "selected" : ""}
              aria-pressed={previewMode === "pdf"}
              onClick={() => setPreviewMode("pdf")}
            >
              PDF preview
            </button>
            <button
              type="button"
              className={previewMode === "text" ? "selected" : ""}
              aria-pressed={previewMode === "text"}
              onClick={() => setPreviewMode("text")}
            >
              Text preview
            </button>
          </div>
          <div className="reader-toolbar">
            {previewMode === "text" ? (
              <div className="view-mode-switch" role="group" aria-label="Reader view mode">
                <span>View</span>
                <button
                  type="button"
                  className={readerViewMode === "book" ? "selected" : ""}
                  aria-pressed={readerViewMode === "book"}
                  onClick={() => setReaderViewMode("book")}
                >
                  Book
                </button>
                <button
                  type="button"
                  className={readerViewMode === "continuous" ? "selected" : ""}
                  aria-pressed={readerViewMode === "continuous"}
                  onClick={() => setReaderViewMode("continuous")}
                >
                  Continuous
                </button>
              </div>
            ) : null}
            <div className="zoom-controls" aria-label="Zoom controls">
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => setZoomLevel((current) => Math.max(0.7, Number((current - 0.1).toFixed(1))))}
                disabled={zoomLevel <= 0.7}
              >
                −
              </button>
              <output>{Math.round(zoomLevel * 100)}%</output>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => setZoomLevel((current) => Math.min(1.5, Number((current + 0.1).toFixed(1))))}
                disabled={zoomLevel >= 1.5}
              >
                +
              </button>
            </div>
            {previewMode === "text" ? (
              <div className="page-controls" aria-label="Text page navigation">
                <button
                  type="button"
                  onClick={() => navigateTextBlock(-1)}
                  disabled={textPageIndex <= 0}
                >
                  Previous
                </button>
                <span>{textPageIndex + 1} / {blocks.length}</span>
                <button
                  type="button"
                  onClick={() => navigateTextBlock(1)}
                  disabled={textPageIndex >= blocks.length - 1}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
          {previewMode === "pdf" ? (
            pdfUrl ? (
              <div className="pdf-frame" style={{ zoom: zoomLevel } as React.CSSProperties}>
                <PdfDocumentViewer
                  url={pdfUrl}
                  title="Reader sample"
                  filename="reader.pdf"
                  loadingLabel="PDF"
                />
              </div>
            ) : (
              <p className="empty-state">Enter a PDF URL to preview the document.</p>
            )
          ) : (
            <div
              className={`text-preview ${readerViewMode === "continuous" ? "continuous" : "book"}`}
              style={{ "--accent": accent, zoom: zoomLevel } as React.CSSProperties}
            >
              {(readerViewMode === "book" ? [blocks[textPageIndex]].filter(Boolean) : blocks).map((block) => {
                const index = blocks.findIndex((item) => item.id === block.id);
                return (
                <article
                  key={block.id}
                  ref={(element) => { textBlockRefs.current[block.id] = element; }}
                  className={highlightActiveText && activeLine === index ? "active" : ""}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{block.text || "Your mapped text will appear here."}</p>
                </article>
                );
              })}
            </div>
          )}
          <p className="caption">
            {previewMode === "pdf"
              ? `Loaded: ${pdfSourceLabel}. Remote PDFs must permit cross-origin requests for PDF.js to load them.`
              : readerViewMode === "book"
                ? "Book view shows one mapped block at a time; previous and next move between blocks."
                : "Continuous view shows all mapped blocks as a scrollable reading flow."}
          </p>
        </div>

        <aside className="control-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">TEXT AND AUDIO MAPPING</span><h2>Edit text blocks</h2></div>
          </div>
          <div className="control-group">
            <label htmlFor="accent">Highlight color <output>{accent}</output></label>
            <input id="accent" type="color" value={accent} onChange={(event) => setAccent(event.target.value)} />
          </div>
          <div className="control-group">
            <label htmlFor="tempo">Audio pace <output>{tempo.toFixed(1)}×</output></label>
            <input id="tempo" type="range" min="0.7" max="1.5" step="0.1" value={tempo} onChange={(event) => setPlaybackTempo(Number(event.target.value))} />
          </div>
          <label className="toggle-row">
            <span>Highlight active text block</span>
            <input
              type="checkbox"
              checked={highlightActiveText}
              onChange={(event) => setHighlightActiveText(event.target.checked)}
            />
          </label>

          {audioUrl ? (
            <div className="audio-player-wrap">
              <audio
                key={audioUrl}
                ref={audioRef}
                src={audioUrl}
                controls
                preload="metadata"
                onLoadedMetadata={() => { setAudioError(""); if (audioRef.current) audioRef.current.playbackRate = tempo; }}
                onTimeUpdate={onAudioTimeUpdate}
                onPlay={() => setIsAudioPlaying(true)}
                onPause={() => setIsAudioPlaying(false)}
                onEnded={() => setIsAudioPlaying(false)}
                onRateChange={() => { if (audioRef.current) setTempo(audioRef.current.playbackRate); }}
                onError={() => setAudioError("Could not load this audio URL. Check the link and that the host allows media playback.")}
                className="audio-player"
              />
              {audioError ? <p className="error-text" role="alert">{audioError}</p> : null}
            </div>
          ) : (
            <p className="empty-state">Load an audio URL to set timing and preview mapped segments.</p>
          )}

          <section className="now-reading" aria-live="polite" aria-atomic="true">
            <div className="now-reading-heading">
              <span className={activeMappedBlock ? "sync-indicator playing" : "sync-indicator"} />
              <span>TEXT AT PLAYHEAD</span>
              <button
                type="button"
                className="primary-button"
                onClick={() => void toggleAudioPlayback()}
                disabled={!audioUrl}
              >
                {isAudioPlaying ? "Pause audio" : "Play audio"}
              </button>
              {activeMappedBlock ? (
                <span className="now-reading-index">BLOCK {(activeLine ?? 0) + 1}</span>
              ) : null}
            </div>
            {activeMappedBlock ? (
              <>
                <p>{activeMappedBlock.text || "This mapped block has no text yet."}</p>
                <div className="now-reading-footer">
                  <span>
                    {activeMappedBlock.startMs} – {activeMappedBlock.endMs}
                  </span>
                  {previewMode === "pdf" ? (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => {
                        setTextPageIndex(activeLine ?? 0);
                        setPreviewMode("text");
                      }}
                    >
                      Open text preview
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="now-reading-placeholder">
                Play or seek to a mapped time range to see its text here.
              </p>
            )}
          </section>

          <div className="block-list" style={{ "--accent": accent } as React.CSSProperties}>
            {blocks.map((block, index) => {
              const start = parseTime(block.startMs);
              const end = parseTime(block.endMs);
              const canPlay = Boolean(audioUrl && start !== null && end !== null && end > start);
              return (
                <article
                  key={block.id}
                  className={`text-block ${highlightActiveText && activeLine === index ? "active" : ""}`}
                >
                  <div className="block-heading">
                    <span>TEXT BLOCK {index + 1}</span>
                    <button
                      type="button"
                      className="text-button danger"
                      onClick={() =>
                        setBlocks((current) => current.filter((item) => item.id !== block.id))
                      }
                      disabled={blocks.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    aria-label={`Text block ${index + 1}`}
                    value={block.text}
                    onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                    rows={2}
                    placeholder="Type or paste text for this audio segment"
                  />
                  <div className="time-grid">
                    <label>
                      Start time
                      <input
                        value={block.startMs}
                        onChange={(event) => updateBlock(block.id, { startMs: event.target.value })}
                        placeholder="00:00:000"
                        aria-label={`Block ${index + 1} start time`}
                      />
                    </label>
                    <label>
                      End time
                      <input
                        value={block.endMs}
                        onChange={(event) => updateBlock(block.id, { endMs: event.target.value })}
                        placeholder="00:01:200"
                        aria-label={`Block ${index + 1} end time`}
                      />
                    </label>
                  </div>
                  <div className="block-actions">
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setTimeFromPlayer(block.id, "startMs")}
                      disabled={!audioUrl}
                    >
                      Set start from player
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setTimeFromPlayer(block.id, "endMs")}
                      disabled={!audioUrl}
                    >
                      Set end from player
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => void playBlock(block)}
                      disabled={!canPlay}
                    >
                      Play segment
                    </button>
                  </div>
                  {(block.startMs && start === null) ||
                  (block.endMs && end === null) ||
                  (start !== null && end !== null && end <= start) ? (
                    <p className="error-text">
                      Enter valid MM:SS:MS times and make end later than start.
                    </p>
                  ) : null}
                </article>
              );
            })}
            <button type="button" className="secondary-button add-block" onClick={addBlock}>
              Add text block
            </button>
          </div>
          <p className="fine-print">Mapping format is MM:SS:MS. Use the audio player to find a point, set the start or end, then preview that block’s selected duration.</p>
        </aside>
      </section>

      <section className="output-panel" aria-label="Mapping JSON output">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">READY TO USE</span>
            <h2>Mapping output</h2>
          </div>
          <button type="button" className="secondary-button copy-button" onClick={() => void copyOutputJson()}>
            {copyStatus || "Copy JSON"}
          </button>
        </div>
        <p className="output-hint">
          Includes all non-empty text blocks and only audio mappings with valid start and end times.
        </p>
        <pre className="json-output"><code>{outputJson}</code></pre>
      </section>

      <footer>
        <span>Built with React Audio Book Reader</span>
        <a href="https://github.com/ashishjain3456/pdf-book-reader-audio">View source on GitHub ↗</a>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
