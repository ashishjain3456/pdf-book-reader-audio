export const continuousRenderingScript = String.raw`
        const continuousRenderInFlight = new Map();

        // A zoomed page's CSS dimensions grow with zoom. Bound the backing store
        // so a long document cannot allocate several enormous canvases at once.
        const getCanvasPixelRatio = (cssViewport) => {
          const requestedRatio = Math.min(window.devicePixelRatio || 1, 1.5);
          const maxCanvasPixels = 4000000;
          const pagePixels = cssViewport.width * cssViewport.height;
          return Math.min(requestedRatio, Math.sqrt(maxCanvasPixels / pagePixels));
        };

        const getContinuousNeighborCount = () => {
          if (currentZoom >= 2) return Math.min(neighborPageCount, 1);
          if (currentZoom >= 1.25) return Math.min(neighborPageCount, 1);
          return neighborPageCount;
        };

        const isInCurrentContinuousWindow = (pageNumber) => {
          const distance = Math.abs(pageNumber - continuousAnchorPage);
          return distance <= getContinuousNeighborCount();
        };

        const createContinuousPlaceholders = (preserveRenderedPages = false) => {
          if (preserveRenderedPages) {
            destroyPageFlip();
          } else {
            clearPages();
          }
          const existingPages = new Map(
            Array.from(pagesNode.querySelectorAll('[data-page-number]')).map((node) => [
              Number(node.getAttribute('data-page-number')),
              node,
            ]),
          );
          const width = Math.max(280, Math.min(window.innerWidth - 24, 900)) * currentZoom;
          const estimatedHeight = Math.round(width * 1.414);
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const wrapper = existingPages.get(pageNumber) || document.createElement('div');
            const hasRenderedCanvas = Boolean(wrapper.querySelector('canvas'));
            wrapper.className = 'page';
            wrapper.id = 'pdf-page-' + pageNumber;
            wrapper.setAttribute('data-page-number', String(pageNumber));
            if (!hasRenderedCanvas) {
              wrapper.style.width = width + 'px';
              wrapper.style.minHeight = estimatedHeight + 'px';
            }
            if (wrapper.parentNode !== pagesNode) pagesNode.appendChild(wrapper);
            existingPages.delete(pageNumber);
          }
          for (const wrapper of existingPages.values()) {
            wrapper.remove();
          }
        };

        const renderContinuousPage = async (pageNumber, token, forceRender = false) => {
          const safePage = clampPage(pageNumber);
          const existing = continuousRenderInFlight.get(safePage);
          if (existing) {
            try {
              await existing;
            } catch (error) {
              if (!forceRender) throw error;
            }
            if (!forceRender || token !== renderToken) return;
            return renderContinuousPage(safePage, token, true);
          }

          const task = (async () => {
            const wrapper = document.getElementById('pdf-page-' + safePage);
            if (!wrapper || (!forceRender && wrapper.querySelector('canvas'))) return;
            const page = await pdf.getPage(safePage);
            if (token !== renderToken || currentViewMode !== 'continuous') return;
            const unscaledViewport = page.getViewport({ scale: 1 });
            const targetWidth =
              Math.max(280, Math.min(window.innerWidth - 24, 900)) * currentZoom;
            const scale = targetWidth / unscaledViewport.width;
            const cssViewport = page.getViewport({ scale });
            const renderPixelRatio = getCanvasPixelRatio(cssViewport);
            const viewport = page.getViewport({ scale: scale * renderPixelRatio });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Canvas is not available.');

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = cssViewport.width + 'px';
            canvas.style.height = cssViewport.height + 'px';
            canvas.setAttribute('aria-label', title + ' page ' + safePage);
            await page.render({ canvasContext: context, viewport }).promise;
            if (
              token !== renderToken ||
              currentViewMode !== 'continuous' ||
              !isInCurrentContinuousWindow(safePage)
            ) {
              canvas.width = 0;
              canvas.height = 0;
              return;
            }
            wrapper.style.width = cssViewport.width + 'px';
            wrapper.style.minHeight = cssViewport.height + 'px';
            wrapper.replaceChildren(canvas);
            if (outerScrollActive) scheduleContentHeightUpdates();
          })();

          continuousRenderInFlight.set(safePage, task);
          try {
            await task;
          } finally {
            continuousRenderInFlight.delete(safePage);
          }
        };

        const renderContinuousWindow = async (anchorPage, token, forceRender = false) => {
          const centerPage = clampPage(anchorPage);
          continuousAnchorPage = centerPage;
          const keepPages = new Set();
          const windowSize = getContinuousNeighborCount();
          for (let offset = -windowSize; offset <= windowSize; offset += 1) {
            keepPages.add(clampPage(centerPage + offset));
          }

          for (const node of Array.from(pagesNode.querySelectorAll('[data-page-number]'))) {
            const pageNumber = Number(node.getAttribute('data-page-number'));
            if (!keepPages.has(pageNumber) && node.querySelector('canvas')) {
              node.replaceChildren();
            }
          }

          await renderContinuousPage(centerPage, token, forceRender);
          const neighborPages = Array.from(keepPages).filter(
            (pageNumber) => pageNumber !== centerPage,
          );
          if (forceRender) {
            void (async () => {
              for (const pageNumber of neighborPages) {
                if (token !== renderToken || centerPage !== continuousAnchorPage) break;
                try {
                  await renderContinuousPage(pageNumber, token, true);
                } catch {
                  // Keep the old page visible if a zoomed neighbor fails to render.
                }
              }
            })();
          } else {
            for (const pageNumber of neighborPages) {
              if (token !== renderToken || centerPage !== continuousAnchorPage) break;
              try {
                await renderContinuousPage(pageNumber, token);
              } catch {
                // A failed neighbor does not block the current page.
              }
            }
          }
        };

        const focusContinuousPage = (node) => {
          if (!node) return;
          if (outerScrollActive) {
            postMessage({
              type: 'scroll-to-page',
              top: Math.max(0, Math.floor(node.getBoundingClientRect().top + window.scrollY)),
            });
          } else {
            node.scrollIntoView({ block: 'start' });
          }
        };

        const renderAllPages = async (
          requestedPage,
          preserveRenderedPages = false,
          forceRender = false,
        ) => {
          if (!pdf) return;
          const myToken = ++renderToken;

          try {
            statusNode.style.display = 'none';
            const targetPage = clampPage(requestedPage || currentPage || initialPage);
            createContinuousPlaceholders(preserveRenderedPages);
            const targetWrapper = document.getElementById('pdf-page-' + targetPage);
            currentPage = targetPage;
            focusContinuousPage(targetWrapper);
            await renderContinuousWindow(targetPage, myToken, forceRender);
            if (myToken !== renderToken) return;
            focusContinuousPage(targetWrapper);
            postMessage({ type: 'page-change', pageNumber: currentPage });
            postMessage({ type: 'ready' });
            scheduleContentHeightUpdates();
          } catch (error) {
            const message = error && error.message ? error.message : 'Failed to load PDF.';
            statusNode.style.display = 'block';
            statusNode.textContent = message;
            postMessage({ type: 'error', message });
          }
        };

        const updateCompleteModePage = (visibleCenterY) => {
          if (!pdf || currentViewMode !== 'continuous') return;
          const nodes = Array.from(document.querySelectorAll('[data-page-number]'));
          let bestPage = currentPage;
          let bestDistance = Infinity;
          const targetY = Number.isFinite(visibleCenterY)
            ? visibleCenterY
            : window.innerHeight * 0.35;

          for (const node of nodes) {
            const rect = node.getBoundingClientRect();
            const distance = Math.abs(rect.top - targetY);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestPage = Number(node.getAttribute('data-page-number')) || bestPage;
            }
          }

          if (bestPage !== currentPage) {
            currentPage = bestPage;
            postMessage({ type: 'page-change', pageNumber: bestPage, isAutoScroll: true });
            void renderContinuousWindow(bestPage, renderToken);
          }
        };

`;
