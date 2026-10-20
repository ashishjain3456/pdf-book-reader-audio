import { useEffect, useState } from 'react';

type ContainerRef = { current: HTMLDivElement | null };

export function usePdfContainerWidth(containerRef: ContainerRef) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => setWidth(container.clientWidth || 0);
    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  return width;
}
