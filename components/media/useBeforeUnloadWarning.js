import { useEffect } from "react";

const DEFAULT_WARNING =
  "Media processing is still in progress. Refreshing or closing this page will stop it.";

export default function useBeforeUnloadWarning(
  shouldWarn,
  message = DEFAULT_WARNING,
) {
  useEffect(() => {
    if (!shouldWarn) return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [message, shouldWarn]);
}
