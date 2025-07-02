import { useEffect, useRef } from 'react';

export const useAutoScrollTabs = (activeTab: string) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLElement>>({});

  const registerTab = (tabValue: string, element: HTMLElement | null) => {
    if (element) {
      triggerRefs.current[tabValue] = element;
    }
  };

  useEffect(() => {
    const activeElement = triggerRefs.current[activeTab];
    const container = tabsRef.current;

    if (activeElement && container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();
      
      // Check if element is outside the visible area
      const isElementOutside = 
        elementRect.left < containerRect.left || 
        elementRect.right > containerRect.right;

      if (isElementOutside) {
        // Calculate scroll position to center the active tab
        const elementCenter = activeElement.offsetLeft + activeElement.offsetWidth / 2;
        const containerCenter = container.offsetWidth / 2;
        const scrollPosition = elementCenter - containerCenter;

        container.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }
  }, [activeTab]);

  return { tabsRef, registerTab };
};