export const bookRenderingScript = String.raw`
        const getBookContentFits = () => {
          if (currentViewMode !== 'book') return true;
          const isVisibleBookSheet = (pageNode) => {
            const rect = pageNode.getBoundingClientRect();
            return rect.width > 1 && rect.height > 1;
          };
          const activePages = Array.from(
            pagesNode.querySelectorAll('.page.book-sheet')
          ).filter(isVisibleBookSheet);
          if (!activePages.length) return true;
          return activePages.every((pageNode) => {
            const contentNode = pageNode.querySelector('.verse-page-content');
            if (!contentNode) return true;
            return (
              contentNode.scrollHeight <= contentNode.clientHeight + 2 &&
              contentNode.scrollWidth <= contentNode.clientWidth + 2
            );
          });
        };

        const updateBookOverflowClasses = () => {
          if (currentViewMode !== 'book') return;
          for (const pageNode of Array.from(
            pagesNode.querySelectorAll('.page.book-sheet')
          )) {
            const rect = pageNode.getBoundingClientRect();
            if (rect.width <= 1 || rect.height <= 1) {
              pageNode.classList.remove('overflowing-verse');
              continue;
            }
            const contentNode = pageNode.querySelector('.verse-page-content');
            const overflowing =
              Boolean(contentNode) &&
              (contentNode.scrollHeight > contentNode.clientHeight + 2 ||
                contentNode.scrollWidth > contentNode.clientWidth + 2);
            pageNode.classList.toggle('overflowing-verse', overflowing);
          }
        };

        const postVerseLayoutState = () => {
          updateBookOverflowClasses();
          const contentFits = getBookContentFits();
          postMessage({
            type: 'verse-layout-state',
            contentFits,
            canZoomIn:
              currentViewMode !== 'book' ||
              (contentFits && layout.verseFontSizePx < layout.maxFontSizePx),
          });
        };

        const buildPageNode = (pageNumber, active) => {
          const pageData = versePages[pageNumber - 1] || [];
          const configuredPagePadding = Number(layout.pagePaddingPx);
          const pagePadding = Number.isFinite(configuredPagePadding)
            ? Math.max(0, configuredPagePadding)
            : 18;
          const wrapper = document.createElement('div');
          wrapper.className = active ? 'page active' : 'page';
          wrapper.id = 'pdf-page-' + pageNumber;
          wrapper.setAttribute('data-page-number', String(pageNumber));
          wrapper.style.padding = pagePadding + 'px';
          wrapper.style.boxSizing = 'border-box';
          wrapper.setAttribute('aria-label', title + ' page ' + pageNumber);

          const contentWrap = document.createElement('div');
          contentWrap.className = 'verse-page-content';
          for (const verse of pageData) {
            contentWrap.appendChild(createVerseBlock(verse));
          }
          const ornament = document.createElement('div');
          ornament.className = 'page-ornament';
          wrapper.appendChild(contentWrap);
          wrapper.appendChild(ornament);
          return wrapper;
        };

        const updateBookActivePage = (pageNumber) => {
          const activePage = clampPage(pageNumber);
          for (const pageNode of Array.from(
            pagesNode.querySelectorAll('.page.book-sheet')
          )) {
            pageNode.classList.toggle(
              'active',
              Number(pageNode.getAttribute('data-page-number')) === activePage
            );
          }
        };

        const getBookPageDimensions = () => {
          const bounds = pagesNode.getBoundingClientRect();
          const viewportWidth = Math.max(
            280,
            Math.floor(bounds.width || window.innerWidth || layout.viewportWidthPx || 360)
          );
          const viewportHeight = Math.max(
            320,
            Math.floor(bounds.height || window.innerHeight || layout.readerHeightPx || layout.viewportHeightPx || 640)
          );
          const isDouble =
            layout.bookSpreadMode === 'double' && layout.showSecondPage !== false;
          const spreadGap = isDouble ? 14 : 0;
          const pageWidth = Math.max(
            isDouble ? 220 : 280,
            Math.floor((viewportWidth - spreadGap) / (isDouble ? 2 : 1))
          );

          return {
            isDouble,
            pageWidth,
            pageHeight: viewportHeight,
            bookWidth: isDouble ? pageWidth * 2 : pageWidth,
            bookHeight: viewportHeight,
          };
        };

        const buildPageFlipPageNode = (pageNumber, active, dimensions) => {
          const pageNode = buildPageNode(pageNumber, active);
          pageNode.classList.add('book-sheet');
          pageNode.classList.add('page-flip-page');
          pageNode.setAttribute('data-density', 'soft');
          pageNode.style.width = dimensions.pageWidth + 'px';
          pageNode.style.height = dimensions.pageHeight + 'px';
          return pageNode;
        };

        const renderSimpleBookPage = (requestedPage, announceReady, directionHint) => {
          const targetPage = getSpreadAnchor(requestedPage);
          const direction =
            directionHint ||
            (targetPage > currentPage
              ? 'next'
              : targetPage < currentPage
                ? 'prev'
                : 'none');
          clearPages();

          const spreadNode = document.createElement('div');
          const spreadClass =
            layout.bookSpreadMode === 'double' && layout.showSecondPage !== false
              ? 'double'
              : 'single';
          spreadNode.className =
            'book-spread ' +
            spreadClass;
          if (layout.enablePageTurnEffect !== false) {
            if (direction === 'next') spreadNode.classList.add('turn-next');
            if (direction === 'prev') spreadNode.classList.add('turn-prev');
          }

          const primaryPage = buildPageNode(targetPage, true);
          primaryPage.classList.add('book-sheet');
          spreadNode.appendChild(primaryPage);

          if (layout.bookSpreadMode === 'double' && layout.showSecondPage !== false) {
            const secondPage = targetPage + 1;
            if (secondPage <= versePages.length) {
              const secondaryPage = buildPageNode(secondPage, false);
              secondaryPage.classList.add('book-sheet');
              spreadNode.appendChild(secondaryPage);
            }
          }

          pagesNode.appendChild(spreadNode);
          currentPage = targetPage;
          updateBookOverflowClasses();
          postMessage({ type: 'page-change', pageNumber: currentPage });
          postVerseLayoutState();
          if (announceReady !== false) {
            postMessage({ type: 'ready' });
          }
          scheduleContentHeightUpdates();
        };

        const renderPageFlipBook = (requestedPage, announceReady) => {
          if (!window.St || !window.St.PageFlip) {
            return false;
          }

          const targetPage = getSpreadAnchor(requestedPage);
          const dimensions = getBookPageDimensions();
          clearPages();

          const bookNode = document.createElement('div');
          bookNode.id = 'page-flip-book';
          bookNode.className = dimensions.isDouble ? 'double-spread' : 'single-spread';
          bookNode.style.width = dimensions.bookWidth + 'px';
          bookNode.style.height = dimensions.bookHeight + 'px';
          bookNode.style.minWidth = dimensions.bookWidth + 'px';
          bookNode.style.minHeight = dimensions.bookHeight + 'px';
          bookNode.style.maxWidth = '100%';
          bookNode.style.maxHeight = '100%';

          const pageNodes = [];
          for (let pageNumber = 1; pageNumber <= versePages.length; pageNumber += 1) {
            const pageNode = buildPageFlipPageNode(
              pageNumber,
              pageNumber === targetPage,
              dimensions
            );
            pageNodes.push(pageNode);
            bookNode.appendChild(pageNode);
          }

          pagesNode.appendChild(bookNode);

          try {
            suppressPageFlipEvent = true;
            pageFlip = new window.St.PageFlip(bookNode, {
              width: dimensions.pageWidth,
              height: dimensions.pageHeight,
              size: 'fixed',
              minWidth: dimensions.pageWidth,
              maxWidth: dimensions.pageWidth,
              minHeight: dimensions.pageHeight,
              maxHeight: dimensions.pageHeight,
              startPage: Math.max(0, targetPage - 1),
              drawShadow: true,
              flippingTime: 420,
              usePortrait: !dimensions.isDouble,
              startZIndex: 0,
              autoSize: false,
              maxShadowOpacity: 0.24,
              showCover: false,
              mobileScrollSupport: true,
              swipeDistance: 30,
              clickEventForward: true,
              useMouseEvents: true,
              showPageCorners: false,
              disableFlipByClick: false,
            });

            if (typeof pageFlip.userStop === 'function') {
              const originalUserStop = pageFlip.userStop.bind(pageFlip);
              pageFlip.userStop = (point, isSwipe) => {
                if (isSwipe || pageFlip.isUserMove) {
                  originalUserStop(point, isSwipe);
                  return;
                }
                originalUserStop(point, true);
              };
            }

            pageFlip.on('flip', (event) => {
              if (suppressPageFlipEvent) return;
              const flippedPage = clampPage((Number(event?.data) || 0) + 1);
              currentPage = getSpreadAnchor(flippedPage);
              updateBookActivePage(currentPage);
              updateBookOverflowClasses();
              postMessage({ type: 'page-change', pageNumber: currentPage });
              postVerseLayoutState();
              scheduleContentHeightUpdates();
            });

            pageFlip.loadFromHTML(pageNodes);
            currentPage = targetPage;
            updateBookActivePage(currentPage);
            updateBookOverflowClasses();
            pageFlipReady = true;
            window.setTimeout(() => {
              suppressPageFlipEvent = false;
            }, 60);
            postMessage({ type: 'page-change', pageNumber: currentPage });
            postVerseLayoutState();
            if (announceReady !== false) {
              postMessage({ type: 'ready' });
            }
            scheduleContentHeightUpdates();
            return true;
          } catch {
            destroyPageFlip();
            clearPages();
            return false;
          }
        };

        const renderBookPage = (requestedPage, announceReady, directionHint) => {
          if (
            layout.enablePageTurnEffect !== false &&
            renderPageFlipBook(requestedPage, announceReady)
          ) {
            return;
          }

          renderSimpleBookPage(requestedPage, announceReady, directionHint);
        };

        const postBookPageChange = (pageNumber) => {
          currentPage = getSpreadAnchor(pageNumber);
          updateBookActivePage(currentPage);
          updateBookOverflowClasses();
          postMessage({ type: 'page-change', pageNumber: currentPage });
          postVerseLayoutState();
          scheduleContentHeightUpdates();
        };

        const forcePageFlipPage = (pageNumber) => {
          const targetPage = getSpreadAnchor(pageNumber);
          if (!pageFlip || !pageFlip.turnToPage) {
            renderBookPage(targetPage, false, 'none');
            return;
          }
          try {
            suppressPageFlipEvent = true;
            pageFlip.turnToPage(Math.max(0, targetPage - 1));
            postBookPageChange(targetPage);
          } catch {
            renderBookPage(targetPage, false, 'none');
          } finally {
            window.setTimeout(() => {
              suppressPageFlipEvent = false;
            }, 40);
          }
        };

        const turnPageFlipToPage = (targetPage) => {
          if (!window.St || !window.St.PageFlip) return false;

          const anchoredTarget = getSpreadAnchor(targetPage);
          const anchoredCurrent = getSpreadAnchor(currentPage);
          if (anchoredTarget === anchoredCurrent) return true;

          const step = getSpreadStep();
          const isAdjacent =
            Math.abs(anchoredTarget - anchoredCurrent) <= step;
          if (!isAdjacent) {
            forcePageFlipPage(anchoredTarget);
            return true;
          }

          const direction = anchoredTarget > anchoredCurrent ? 'next' : 'prev';
          const initialized = renderPageFlipBook(anchoredCurrent, false);
          if (!initialized) return false;

          window.setTimeout(() => {
            try {
              if (direction === 'next' && pageFlip && pageFlip.flipNext) {
                pageFlip.flipNext('bottom');
              } else if (direction === 'prev' && pageFlip && pageFlip.flipPrev) {
                pageFlip.flipPrev('bottom');
              } else {
                forcePageFlipPage(anchoredTarget);
                return;
              }

              window.setTimeout(() => {
                renderBookPage(anchoredTarget, false, 'none');
              }, 900);
            } catch {
              forcePageFlipPage(anchoredTarget);
            }
          }, 90);

          return true;
        };

        const turnRelativeBookPage = (direction) => {
          if (currentViewMode !== 'book') return;
          const step = getSpreadStep();
          const targetPage =
            direction === 'next'
              ? clampPage(currentPage + step)
              : clampPage(currentPage - step);
          if (targetPage === currentPage) return;

          if (layout.enablePageTurnEffect !== false && pageFlip && pageFlipReady) {
            try {
              if (pageFlip.getState && pageFlip.getState() !== 'read') return;
              if (direction === 'next' && pageFlip.flipNext) {
                pageFlip.flipNext('bottom');
              } else if (direction === 'prev' && pageFlip.flipPrev) {
                pageFlip.flipPrev('bottom');
              } else {
                renderBookPage(targetPage, false, 'none');
                return;
              }

              const startingPage = currentPage;
              window.setTimeout(() => {
                if (currentPage === startingPage) {
                  renderBookPage(targetPage, false, 'none');
                }
              }, 520);
              return;
            } catch {
              pageFlipReady = false;
            }
          }

          renderBookPage(targetPage, false, direction);
        };

`;
