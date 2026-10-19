export const verseNavigationScript = String.raw`
        const findVerseNode = (verseId) => {
          const safeVerseId =
            verseId === null || verseId === undefined ? '' : String(verseId);
          if (!safeVerseId) return null;
          return (
            Array.from(document.querySelectorAll('[data-verse-id]')).find(
              (node) => node.getAttribute('data-verse-id') === safeVerseId
            ) || null
          );
        };

        const getVersePage = (verseId) => {
          const safeVerseId =
            verseId === null || verseId === undefined ? '' : String(verseId);
          if (!safeVerseId) return 0;
          return versePages.findIndex((pageItems) =>
            pageItems.some(
              (verse) => String(verse.id) === safeVerseId
            )
          ) + 1;
        };

        const renderAllPages = (requestedPage, anchorVerseId) => {
          const targetPage = clampPage(requestedPage || currentPage || 1);
          clearPages();
          for (let pageNumber = 1; pageNumber <= versePages.length; pageNumber += 1) {
            pagesNode.appendChild(buildPageNode(pageNumber, false));
          }
          currentPage = targetPage;
          const target =
            findVerseNode(anchorVerseId) ||
            document.getElementById('pdf-page-' + targetPage);
          if (target) {
            target.scrollIntoView({ block: 'start' });
            window.requestAnimationFrame(() => {
              target.scrollIntoView({ block: 'start' });
            });
          }
          postMessage({ type: 'page-change', pageNumber: currentPage });
          postMessage({ type: 'ready' });
          if (currentViewMode === 'continuous') {
            scheduleContentHeightUpdates();
          }
        };

        const updateCompleteModePage = () => {
          if (currentViewMode !== 'continuous') return;
          const nodes = Array.from(document.querySelectorAll('[data-page-number]'));
          let bestPage = currentPage;
          let bestDistance = Infinity;
          const viewportHeight = Math.max(
            320,
            Math.min(
              Number(layout.readerHeightPx) || Number(layout.viewportHeightPx) || 640,
              Number(layout.viewportHeightPx) || 640
            )
          );
          const targetY = Math.max(120, Math.floor(viewportHeight * 0.35));

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
          }
        };

        const rerender = (requestedPage) => {
          if (!versePages.length) {
            statusNode.style.display = 'block';
            statusNode.textContent = 'No verse content found.';
            postMessage({ type: 'document-meta', pageCount: 0 });
            postMessage({ type: 'ready' });
            return;
          }

          statusNode.style.display = 'none';
          postMessage({ type: 'document-meta', pageCount: versePages.length });
          postMessage({
            type: 'verse-pages',
            pages: versePages.map((page, pageIndex) => ({
              pageNumber: pageIndex + 1,
              verseIds: page.map((verse) => String(verse.id)),
            })),
          });
          if (currentViewMode === 'continuous') {
            renderAllPages(requestedPage);
          } else {
            renderBookPage(requestedPage, true, 'none');
          }
          postVerseLayoutState();
        };

        const goToPage = (requestedPage) => {
          const targetPage = getSpreadAnchor(requestedPage);
          if (currentViewMode === 'continuous') {
            const target = document.getElementById('pdf-page-' + targetPage);
            if (target) {
              currentPage = targetPage;
              target.scrollIntoView({ block: 'start', behavior: 'smooth' });
              postMessage({ type: 'page-change', pageNumber: currentPage });
            }
            return;
          }
          if (targetPage === currentPage) return;
          if (
            layout.enablePageTurnEffect !== false &&
            turnPageFlipToPage(targetPage)
          ) {
            return;
          }
          renderBookPage(targetPage, false, targetPage > currentPage ? 'next' : 'prev');
        };

        const handleBridgeEvent = (event) => {
          try {
            const payload = JSON.parse(event && event.data ? event.data : '{}');

            if (payload.type === 'set-view-mode') {
              if (payload.mode !== 'book' && payload.mode !== 'continuous') return;
              const nextPage = clampPage(payload.page || currentPage);
              const previousMode = currentViewMode;
              const previousPage = currentPage;
              currentViewMode = payload.mode;
              applyViewModeLayout(currentViewMode);
              if (currentViewMode === 'continuous') {
                paginateVerses();
                renderAllPages(nextPage);
              } else {
                paginateVerses();
                const anchored = getSpreadAnchor(nextPage);
                const direction =
                  previousMode === 'book'
                    ? anchored > previousPage
                      ? 'next'
                      : anchored < previousPage
                        ? 'prev'
                        : 'none'
                    : 'none';
                renderBookPage(anchored, false, direction);
              }
              return;
            }

            if (payload.type !== 'goto-page') return;
            const requested = Number(payload.pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            goToPage(requested);
          } catch {
            // ignore malformed bridge payloads
          }
        };

        window.__PDF_READER_BRIDGE__ = {
          goToPage: (pageNumber) => {
            const requested = Number(pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            goToPage(requested);
          },
          showMappedVerse: (pageNumber, verseId, isPlaying) => {
            const requested = Number(pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            const targetPage = clampPage(requested);
            if (currentViewMode === 'book') {
              renderBookPage(targetPage, false, 'none');
              postMessage({ type: 'page-change', pageNumber: targetPage });
            } else {
              goToPage(targetPage);
            }
            window.requestAnimationFrame(() => {
              window.__PDF_READER_BRIDGE__.setActiveVerse(
                verseId,
                isPlaying,
                false
              );
            });
          },
          goToNextPage: () => {
            turnRelativeBookPage('next');
          },
          goToPreviousPage: () => {
            turnRelativeBookPage('prev');
          },
          setViewMode: (mode, page, anchorVerseId, zoom) => {
            if (mode !== 'book' && mode !== 'continuous') return;
            const requestedPage = (Number.isInteger(Number(page)) && Number(page) > 0) ? Number(page) : currentPage;
            const zoomChanged = applyZoomValue(zoom);
            if (zoomChanged) {
              paginateVerses();
            }
            const anchorPage = getVersePage(anchorVerseId);
            const anchorMatchesRequestedPage = anchorPage > 0 && anchorPage === clampPage(requestedPage);
            if (mode === currentViewMode) {
              if (mode === 'continuous') {
                const anchorNode = anchorMatchesRequestedPage
                  ? findVerseNode(anchorVerseId)
                  : null;
                if (anchorNode) {
                  currentPage = anchorPage;
                  anchorNode.scrollIntoView({ block: 'start' });
                  postMessage({ type: 'page-change', pageNumber: currentPage });
                  return;
                }
              }
              if (zoomChanged) {
                rerender(requestedPage);
              } else if (mode === 'book') {
                renderBookPage(requestedPage, false, 'none');
              } else {
                goToPage(requestedPage);
              }
              return;
            }
            const previousMode = currentViewMode;
            const previousPage = currentPage;
            const visibleBookVerseId =
              previousMode === 'book'
                ? pagesNode
                    .querySelector('.page.active [data-verse-id]')
                    ?.getAttribute('data-verse-id') || ''
                : '';
            const visibleBookVersePage = getVersePage(visibleBookVerseId);
            const requestedAnchorPage = getVersePage(anchorVerseId);
            const requestedClampedPage = clampPage(requestedPage);
            const effectiveAnchorVerseId =
              visibleBookVersePage === requestedClampedPage
                ? visibleBookVerseId
                : requestedAnchorPage === requestedClampedPage
                  ? anchorVerseId || ''
                  : '';
            const effectiveAnchorPage = getVersePage(effectiveAnchorVerseId);
            const effectiveRequestedPage = effectiveAnchorPage > 0
              ? effectiveAnchorPage
              : requestedClampedPage;
            currentViewMode = mode;
            applyViewModeLayout(currentViewMode);
            paginateVerses();
            if (currentViewMode === 'continuous') {
              renderAllPages(
                effectiveRequestedPage,
                effectiveAnchorVerseId
              );
            } else {
              const anchored = getSpreadAnchor(effectiveRequestedPage);
              const direction =
                previousMode === 'book'
                  ? anchored > previousPage
                    ? 'next'
                    : anchored < previousPage
                      ? 'prev'
                      : 'none'
                  : 'none';
              renderBookPage(anchored, false, direction);
            }
          },
          setZoom: (zoom, page) => {
            const requestedPage = clampPage(page || currentPage);
            const anchorVerseId = String(
              versePages[requestedPage - 1]?.[0]?.id || ''
            );
            if (!applyZoomValue(zoom)) return;
            paginateVerses();
            const anchorPage = anchorVerseId
              ? versePages.findIndex((pageItems) =>
                  pageItems.some((verse) => String(verse.id) === anchorVerseId)
                ) + 1
              : requestedPage;
            rerender(clampPage(anchorPage > 0 ? anchorPage : requestedPage));
          },
          setActiveVerse: (verseId, isPlaying, shouldScroll) => {
            const safeVerseId = verseId === null || verseId === undefined ? '' : String(verseId);
            for (const node of Array.from(document.querySelectorAll('[data-verse-id]'))) {
              const isActive = safeVerseId && node.getAttribute('data-verse-id') === safeVerseId;
              node.classList.toggle('active-verse', Boolean(isActive));
              if (isActive && shouldScroll && currentViewMode === 'continuous') {
                node.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }
            }
          }
        };

        window.addEventListener('message', handleBridgeEvent);
        document.addEventListener('message', handleBridgeEvent);
        let completeModeScrollRaf = 0;
        let completeModeScrollDebounce = 0;
        const handleScrollEvent = () => {
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
        pagesNode.addEventListener('scroll', handleScrollEvent, { passive: true });
        window.addEventListener('scroll', handleScrollEvent, { passive: true });
        document.addEventListener('touchstart', (event) => {
          notifyInteraction();
          handleTouchStart(event);
        }, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        let resizeTimer = null;
        window.addEventListener('resize', () => {
          if (resizeTimer) {
            clearTimeout(resizeTimer);
          }
          resizeTimer = setTimeout(() => {
            paginateVerses();
            rerender(currentPage);
          }, 120);
        });

        applyViewModeLayout(currentViewMode);
        applyTypography();
        paginateVerses();
        rerender(initialPage);
`;
