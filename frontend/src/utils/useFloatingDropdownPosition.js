import { useEffect, useState } from 'react';

export const useFloatingDropdownPosition = (
  anchorRef,
  isOpen,
  dependencyValues = [],
  preferredDirection = 'auto',
  heightMode = 'compact'
) => {
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
      const shouldOpenUp = preferredDirection === 'up'
        ? true
        : preferredDirection === 'down'
        ? false
        : spaceBelow < 240 && spaceAbove > spaceBelow;
      const availableHeight = Math.max(96, (shouldOpenUp ? spaceAbove : spaceBelow) - 8);
      const maxHeight = heightMode === 'viewport'
        ? availableHeight
        : Math.min(estimatedHeight, availableHeight);

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
  }, [anchorRef, isOpen, preferredDirection, heightMode, ...dependencyValues]);

  return style;
};
