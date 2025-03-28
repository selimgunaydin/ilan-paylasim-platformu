import { useEffect, RefObject } from "react";

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  refs: RefObject<T>[],
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // If the click/touch is inside the ref element, do nothing
      if (refs.some(ref => !ref.current || ref.current.contains(event.target as Node))) {
        return;
      }
      // Otherwise, call the handler (close function)
      handler(event);
    };

    // Bind listeners for both mouse and touch events
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    // Cleanup listeners on unmount
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refs, handler]); // Re-run if refs or handler changes
}