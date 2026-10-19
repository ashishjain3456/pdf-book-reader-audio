export const readerInteractionsScript = String.raw`
        const handleBridgeEvent = (event) => {
          try {
            const payload = JSON.parse(event && event.data ? event.data : '{}');
            if (!pdf) return;

            if (payload.type === 'set-view-mode') {
              if (payload.mode !== 'book' && payload.mode !== 'continuous') return;
              if (payload.mode === currentViewMode) return;
              currentViewMode = payload.mode;
              applyViewModeLayout(currentViewMode);
              postMessage({ type: 'page-change', pageNumber: currentPage });
              if (currentViewMode === 'continuous') {
                void renderAllPages(currentPage);
              } else {
                void renderPage(currentPage);
              }
              return;
            }

            if (payload.type !== 'goto-page') return;
            const requested = Number(payload.pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            if (currentViewMode === 'continuous') {
              const target = document.getElementById('pdf-page-' + clampPage(requested));
              if (target) {
                currentPage = clampPage(requested);
                focusContinuousPage(target);
                postMessage({ type: 'page-change', pageNumber: currentPage });
                void renderContinuousWindow(currentPage, renderToken);
              }
              return;
            }
            if (requested === currentPage) return;
            renderPage(requested);
          } catch {
            // ignore malformed bridge payloads
          }
        };

        window.__PDF_READER_BRIDGE__ = {
          setOuterViewport: (top, bottom) => {
            if (currentViewMode !== 'continuous') return;
            if (!outerScrollActive) {
              outerScrollActive = true;
              applyViewModeLayout(currentViewMode);
              window.scrollTo(0, 0);
              pagesNode.scrollTop = 0;
              scheduleContentHeightUpdates();
            }
            if (!firstOuterViewportReceived) {
              firstOuterViewportReceived = true;
              if (currentPage > 1) {
                focusContinuousPage(
                  document.getElementById('pdf-page-' + currentPage),
                );
              }
            }
            const visibleTop = Number(top);
            const visibleBottom = Number(bottom);
            if (
              Number.isFinite(visibleTop) &&
              Number.isFinite(visibleBottom) &&
              visibleBottom > 0
            ) {
              updateCompleteModePage(
                (Math.max(0, visibleTop) + visibleBottom) / 2,
              );
            }
          },
          goToPage: (pageNumber) => {
            if (!pdf) return;
            const requested = Number(pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            if (currentViewMode === 'continuous') {
              const target = document.getElementById('pdf-page-' + clampPage(requested));
              if (target) {
                currentPage = clampPage(requested);
                focusContinuousPage(target);
                postMessage({ type: 'page-change', pageNumber: currentPage });
                void renderContinuousWindow(currentPage, renderToken);
              }
              return;
            }
            if (requested === currentPage) return;
            renderPage(requested);
          },
          setViewMode: (mode, page) => {
            if (mode !== 'book' && mode !== 'continuous') return;
            const requestedPage = (Number.isInteger(Number(page)) && Number(page) > 0) ? Number(page) : currentPage;
            if (mode === currentViewMode) {
              // Same mode — just navigate to page
              if (currentViewMode === 'continuous') {
                const target = document.getElementById('pdf-page-' + clampPage(requestedPage));
                if (target) {
                  currentPage = clampPage(requestedPage);
                  focusContinuousPage(target);
                  postMessage({ type: 'page-change', pageNumber: currentPage });
                  void renderContinuousWindow(currentPage, renderToken);
                }
              } else if (requestedPage !== currentPage) {
                void renderPage(requestedPage);
              }
              return;
            }
            currentViewMode = mode;
            applyViewModeLayout(currentViewMode);
            if (currentViewMode === 'continuous') {
              void renderAllPages(requestedPage);
            } else {
              void renderPage(requestedPage);
            }
          },
          setZoom: (zoom, page) => {
            const requestedZoom = Number(zoom);
            if (!Number.isFinite(requestedZoom)) return;
            currentZoom = Math.max(minimumZoomLevel, Math.min(maximumZoomLevel, requestedZoom));
            pageRenderCache.clear();
            const requestedPage = clampPage(page || currentPage);
            if (currentViewMode === 'continuous') {
              void renderAllPages(requestedPage, true, true);
            } else {
              void renderPage(requestedPage);
            }
          }
        };

        window.addEventListener('message', handleBridgeEvent);
        document.addEventListener('message', handleBridgeEvent);
        let completeModeScrollRaf = 0;
        let completeModeScrollDebounce = 0;
        const handleCompleteModeScroll = () => {
          if (outerScrollActive) {
            notifyInteraction();
            return;
          }
          if (currentViewMode !== 'continuous') {
            notifyInteraction();
            return;
          }
          if (completeModeScrollRaf) {
            window.cancelAnimationFrame(completeModeScrollRaf);
          }
          if (completeModeScrollDebounce) {
            window.clearTimeout(completeModeScrollDebounce);
          }
          completeModeScrollRaf = window.requestAnimationFrame(() => {
            completeModeScrollRaf = 0;
            updateCompleteModePage();
          });
          completeModeScrollDebounce = window.setTimeout(() => {
            completeModeScrollDebounce = 0;
            updateCompleteModePage();
            notifyInteraction();
          }, 120);
        };

        pagesNode.addEventListener('scroll', handleCompleteModeScroll, { passive: true });
        window.addEventListener('scroll', handleCompleteModeScroll, { passive: true });
        document.addEventListener('touchstart', notifyInteraction, { passive: true });
        let bookDragStart = null;
        pagesNode.addEventListener('pointerdown', (event) => {
          if (currentViewMode !== 'book' || event.isPrimary === false) return;
          bookDragStart = {
            x: event.clientX,
            y: event.clientY,
            pointerId: event.pointerId,
          };
          notifyInteraction();
        }, { passive: true });
        pagesNode.addEventListener('pointerup', (event) => {
          const start = bookDragStart;
          bookDragStart = null;
          if (
            !start ||
            start.pointerId !== event.pointerId ||
            currentViewMode !== 'book' ||
            currentZoom > 1.05
          ) {
            return;
          }
          const deltaX = event.clientX - start.x;
          const deltaY = event.clientY - start.y;
          if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) {
            return;
          }
          if (deltaX < 0) {
            void renderPage(currentPage + 1);
          } else {
            void renderPage(currentPage - 1);
          }
        }, { passive: true });
        pagesNode.addEventListener('pointercancel', () => {
          bookDragStart = null;
        }, { passive: true });

        const renderDocument = async () => {
          try {
            applyViewModeLayout(currentViewMode);
            const loadingTask = pdfjsLib.getDocument({
              url: pdfUrl,
              disableAutoFetch: true,
              disableRange: false,
              disableStream: false,
              withCredentials: false,
            });
            pdf = await loadingTask.promise;
            statusNode.style.display = 'none';

            postMessage({
              type: 'document-meta',
              pageCount: pdf.numPages,
            });
            if (currentViewMode === 'continuous') {
              await renderAllPages(initialPage);
            } else {
              await renderPage(initialPage);
            }
          } catch (error) {
            const message = error && error.message ? error.message : 'Failed to load PDF.';
            statusNode.style.display = 'block';
            statusNode.textContent = message;
            postMessage({
              type: 'error',
              message,
              code: /failed to fetch/i.test(message) ? 'fetch-failed' : 'render-failed',
            });
          }
        };

        renderDocument();
`;
