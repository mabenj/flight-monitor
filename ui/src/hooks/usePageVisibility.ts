/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any
import { useState, useEffect } from "react";

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(
    typeof document !== "undefined" ? !document.hidden : true
  );

  const browserCompatApi = () => {
    let hidden, visibilityChange;
    if ("hidden" in document) {
      hidden = "hidden";
      visibilityChange = "visibilitychange";
    } else if ("mozHidden" in document) {
      // Firefox up to v17
      hidden = "mozHidden";
      visibilityChange = "mozvisibilitychange";
    } else if ("webkitHidden" in document) {
      // Chrome up to v32, Android up to v4.4, Blackberry up to v10
      hidden = "webkitHidden";
      visibilityChange = "webkitvisibilitychange";
    }
    return {
      hidden,
      visibilityChange,
    };
  };

  useEffect(() => {
    const { hidden, visibilityChange } = browserCompatApi();

    const handleVisibilityChange = () => {
      setIsVisible(!(document as any)[hidden!]);
    };

    document.addEventListener(visibilityChange!, handleVisibilityChange);
    return () =>
      document.removeEventListener(visibilityChange!, handleVisibilityChange);
  }, []);

  return isVisible;
}
