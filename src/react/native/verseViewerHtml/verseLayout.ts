export const verseLayoutScript = String.raw`
        const getAllowedInlineStyle = (styleValue) => {
          if (!styleValue) return '';

          const probe = document.createElement('span');
          probe.setAttribute('style', String(styleValue));

          const parts = [];
          const color = probe.style.color;
          const fontWeight = probe.style.fontWeight;
          const fontStyle = probe.style.fontStyle;
          const textDecoration = probe.style.textDecorationLine || probe.style.textDecoration;

          if (preserveInlineColors && color) {
            parts.push('color: ' + color);
          }

          if (fontWeight) {
            parts.push('font-weight: ' + fontWeight);
          }

          if (fontStyle) {
            parts.push('font-style: ' + fontStyle);
          }

          if (textDecoration) {
            parts.push('text-decoration: ' + textDecoration);
          }

          return parts.join('; ');
        };

        const appendSanitizedRichContent = (targetNode, rawContent) => {
          const root = document.createElement('div');
          root.innerHTML = String(rawContent || '');

          const allowedTags = new Set(['SPAN', 'B', 'STRONG', 'I', 'EM', 'U', 'BR']);

          const appendNode = (parentNode, sourceNode) => {
            if (!sourceNode) return;

            if (sourceNode.nodeType === Node.TEXT_NODE) {
              parentNode.appendChild(document.createTextNode(sourceNode.textContent || ''));
              return;
            }

            if (sourceNode.nodeType !== Node.ELEMENT_NODE) {
              return;
            }

            const sourceEl = sourceNode;
            const tagName = String(sourceEl.tagName || '').toUpperCase();

            if (!allowedTags.has(tagName)) {
              for (const child of Array.from(sourceEl.childNodes || [])) {
                appendNode(parentNode, child);
              }
              return;
            }

            if (tagName === 'BR') {
              parentNode.appendChild(document.createElement('br'));
              return;
            }

            const outEl = document.createElement(tagName.toLowerCase());
            const safeStyle = getAllowedInlineStyle(sourceEl.getAttribute('style'));
            if (safeStyle) {
              outEl.setAttribute('style', safeStyle);
            }

            for (const child of Array.from(sourceEl.childNodes || [])) {
              appendNode(outEl, child);
            }

            parentNode.appendChild(outEl);
          };

          for (const child of Array.from(root.childNodes || [])) {
            appendNode(targetNode, child);
          }
        };

        const createVerseBlock = (verse) => {
          const block = document.createElement('article');
          block.className = 'verse-block';
          block.setAttribute('data-verse-id', String(verse.id));
          if (verse.groupId !== null && verse.groupId !== undefined) {
            block.setAttribute('data-group-id', String(verse.groupId));
          }
          const styleClass = verse.styleKey ? 'style-' + String(verse.styleKey).replace(/[^a-zA-Z0-9_-]/g, '') : '';

          if (verse.groupLabel) {
            const groupEl = document.createElement('p');
            groupEl.className = 'verse-group';
            groupEl.textContent = String(verse.groupLabel);
            block.appendChild(groupEl);
          }

          if (verse.label) {
            const labelEl = document.createElement('p');
            labelEl.className = styleClass ? ('verse-label ' + styleClass) : 'verse-label';
            labelEl.textContent = String(verse.label);
            block.appendChild(labelEl);
          }

          const contentEl = document.createElement('p');
          contentEl.className = styleClass ? ('verse-content ' + styleClass) : 'verse-content';
          appendSanitizedRichContent(contentEl, String(verse.content || '').trim());
          block.appendChild(contentEl);
          return block;
        };

        const paginateVerses = () => {
          if (!Array.isArray(verses) || !verses.length) {
            versePages = [];
            return;
          }

          const viewportWidth = Math.max(
            280,
            Math.floor(window.innerWidth || layout.viewportWidthPx || 360)
          );
          const viewportHeight = Math.max(
            320,
            Math.floor(window.innerHeight || layout.readerHeightPx || layout.viewportHeightPx || 640)
          );
          const availablePageWidth = Math.max(
            280,
            viewportWidth - (layout.fullScreen ? 4 : 12)
          );
          const targetWidth =
            layout.bookSpreadMode === 'double' &&
            layout.showSecondPage !== false
              ? Math.max(280, (availablePageWidth - 14) / 2)
              : availablePageWidth;
          const configuredPagePadding = Number(layout.pagePaddingPx);
          const pagePadding = Number.isFinite(configuredPagePadding)
            ? Math.max(0, configuredPagePadding)
            : 30;
          const maxVersesPerPage =
            currentViewMode === 'book'
              ? 1
              : Number.isFinite(Number(layout.maxVersesPerPage)) &&
                  Number(layout.maxVersesPerPage) > 0
                ? Math.max(1, Math.trunc(Number(layout.maxVersesPerPage)))
                : Number.MAX_SAFE_INTEGER;
          const referenceHeight = layout.fullScreen
            ? viewportHeight
            : Math.max(
                320,
                Math.floor(
                  Number(layout.readerHeightPx) ||
                    Number(layout.viewportHeightPx) ||
                    640
                )
              );
          const usableHeight = Math.max(
            220,
            referenceHeight - (layout.fullScreen ? 4 : 12)
          );
          const maxContentHeight = Math.max(120, usableHeight - pagePadding * 2);

          const measureHost = document.createElement('div');
          measureHost.style.position = 'fixed';
          measureHost.style.left = '-99999px';
          measureHost.style.top = '0';
          measureHost.style.width = targetWidth + 'px';
          measureHost.style.visibility = 'hidden';
          measureHost.style.pointerEvents = 'none';
          document.body.appendChild(measureHost);

          const pageWrap = document.createElement('div');
          pageWrap.className = 'page';
          pageWrap.style.width = targetWidth + 'px';
          pageWrap.style.padding = pagePadding + 'px';
          const contentWrap = document.createElement('div');
          contentWrap.className = 'verse-page-content';
          pageWrap.appendChild(contentWrap);
          measureHost.appendChild(pageWrap);

          const pages = [];
          let current = [];

          const flushCurrent = () => {
            if (!current.length) return;
            pages.push(current);
            current = [];
            while (contentWrap.firstChild) {
              contentWrap.removeChild(contentWrap.firstChild);
            }
          };

          for (let index = 0; index < verses.length; index += 1) {
            const verse = verses[index];
            if (!verse || !String(verse.content || '').trim()) {
              continue;
            }

            const block = createVerseBlock(verse);
            contentWrap.appendChild(block);
            current.push(verse);

            const overflowed =
              current.length > 1 && contentWrap.scrollHeight > maxContentHeight;
            const reachedCap = current.length > maxVersesPerPage;

            if (overflowed || reachedCap) {
              current.pop();
              contentWrap.removeChild(block);
              flushCurrent();

              contentWrap.appendChild(block);
              current.push(verse);

              if (contentWrap.scrollHeight > maxContentHeight) {
                flushCurrent();
              }
            }
          }

          flushCurrent();
          document.body.removeChild(measureHost);
          versePages = pages;
        };

`;
