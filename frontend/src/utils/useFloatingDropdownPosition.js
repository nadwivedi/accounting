import { useEffect, useState } from 'react';

export const useFloatingDropdownPosition = (anchorRef, isOpen, dependencyValues = []) => {
  const [style, setStyle] = useState(null);

  useEffect(() => {
    if (!isOpen || !anchorRef?.current) {
      setStyle(null);
      return undefined;
    }

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 12;
      const estimatedHeight = 320;
      const clampedWidth = Math.min(rect.width, window.innerWidth - viewportPadding * 2);
      const clampedLeft = Math.max(
        viewportPadding,
        Math.min(rect.left, window.innerWidth - clampedWidth - viewportPadding)
      );
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const shouldOpenUp = spaceBelow < 240 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(
        180,
        Math.min(estimatedHeight, shouldOpenUp ? spaceAbove - 8 : spaceBelow - 8)
      );

      setStyle({
        left: clampedLeft,
        width: clampedWidth,
        top: shouldOpenUp ? 'auto' : rect.bottom + 6,
        bottom: shouldOpenUp ? window.innerHeight - rect.top + 6 : 'auto',
        maxHeight
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, isOpen, ...dependencyValues]);

  return style;
};
