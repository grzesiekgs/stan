import { useRef } from "react";

export const useRenderCount = (label?: string) => {
  const renderCountRef = useRef(0);

  renderCountRef.current++;

  if (label) {
    console.warn('RENDER COUNT', label, renderCountRef.current);
  }

  return renderCountRef.current;
}