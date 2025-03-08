import { useEffect, useRef, useState, useCallback } from "react";

export const useAutoScroll = (endRef: React.RefObject<HTMLDivElement>) => {
  const firstRender = useRef(true);
  const [isNearBottom, setIsNearBottom] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearBottom(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      }
    );

    if (endRef.current) {
      observer.observe(endRef.current);
    }

    return () => {
      if (endRef.current) {
        observer.unobserve(endRef.current);
      }
    };
  }, [endRef]);

  const scrollToBottom = useCallback(() => {
    if (firstRender.current && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "auto" });
      firstRender.current = false;
    } else if (isNearBottom && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [endRef, isNearBottom]);

  return { scrollToBottom };
};