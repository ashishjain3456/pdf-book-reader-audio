export const pageRenderingScript = String.raw`
        const renderPageToNode = async (pageNumber) => {
          const safePage = clampPage(pageNumber);
          if (pageRenderCache.has(safePage)) {
            return pageRenderCache.get(safePage);
          }
          if (pageRenderInFlight.has(safePage)) {
            return pageRenderInFlight.get(safePage);
          }

          const renderTask = (async () => {
            const page = await pdf.getPage(safePage);
            const unscaledViewport = page.getViewport({ scale: 1 });
            const availableWidth = Math.max(280, Math.min(window.innerWidth - 24, 900));
            const targetWidth = availableWidth * currentZoom;
            const widthScale = targetWidth / unscaledViewport.width;
            const scale = widthScale;
            const cssViewport = page.getViewport({ scale });
            const pagePixels = cssViewport.width * cssViewport.height;
            const renderPixelRatio = Math.min(
              window.devicePixelRatio || 1,
              1.5,
              Math.sqrt(4000000 / pagePixels),
            );
            const viewport = page.getViewport({ scale: scale * renderPixelRatio });
            const wrapper = document.createElement('div');
            wrapper.className = 'page active';
            wrapper.id = 'pdf-page-' + safePage;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (!context) {
              throw new Error('Canvas is not available.');
            }

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = cssViewport.width + 'px';
            canvas.style.height = cssViewport.height + 'px';
            canvas.setAttribute('aria-label', title + ' page ' + safePage);
            wrapper.appendChild(canvas);

            await page.render({ canvasContext: context, viewport }).promise;
            pageRenderCache.set(safePage, wrapper);
            return wrapper;
          })();

          pageRenderInFlight.set(safePage, renderTask);

          try {
            return await renderTask;
          } finally {
            pageRenderInFlight.delete(safePage);
          }
        };

        const pruneBookCache = (anchorPage) => {
          const keepPages = new Set();
          const windowSize = getBookNeighborCount();
          for (let offset = -windowSize; offset <= windowSize; offset += 1) {
            keepPages.add(clampPage(anchorPage + offset));
          }
          for (const pageNumber of Array.from(pageRenderCache.keys())) {
            if (!keepPages.has(pageNumber)) {
              pageRenderCache.delete(pageNumber);
            }
          }
        };

        const preRenderNeighborPages = (anchorPage) => {
          if (!pdf || currentViewMode !== 'book') return;
          const centerPage = clampPage(anchorPage);
          const neighbors = [];
          const windowSize = getBookNeighborCount();
          for (let offset = -windowSize; offset <= windowSize; offset += 1) {
            if (offset === 0) continue;
            const candidate = clampPage(centerPage + offset);
            if (candidate === centerPage) continue;
            if (!neighbors.includes(candidate)) {
              neighbors.push(candidate);
            }
          }

          for (const pageNumber of neighbors) {
            if (pageRenderCache.has(pageNumber) || pageRenderInFlight.has(pageNumber)) continue;
            void renderPageToNode(pageNumber).catch(() => {
              // keep navigation resilient if a neighbor pre-render fails
            });
          }
        };

        const renderPage = async (requestedPage, options) => {
          if (!pdf) return;
          const targetPage = clampPage(requestedPage);
          const announceReady = !options || options.announceReady !== false;
          const myToken = ++renderToken;

          try {
            statusNode.style.display = 'none';
            const wrapper = await renderPageToNode(targetPage);
            if (myToken !== renderToken) return;

            clearPages();
            wrapper.className = 'page active';
            pagesNode.appendChild(wrapper);
            currentPage = targetPage;
            pruneBookCache(targetPage);
            preRenderNeighborPages(targetPage);

            postMessage({
              type: 'book-page-size',
              height: Math.ceil(wrapper.getBoundingClientRect().height + 24),
            });
            postMessage({ type: 'page-change', pageNumber: targetPage });
            if (announceReady) {
              postMessage({ type: 'ready' });
            }
          } catch (error) {
            const message = error && error.message ? error.message : 'Failed to load PDF.';
            statusNode.style.display = 'block';
            statusNode.textContent = message;
            postMessage({ type: 'error', message });
          }
        };

`;
