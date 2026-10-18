"use client";

//the file has to be here or i get a warning
import Error from "next/error";
import { useEffect } from "react";
import { logError } from "./utils/analytics";

export default function GlobalError({ error }) {
  useEffect(() => {
    logError(error, { description: "Global error boundary", source: "react_boundary" })
  }, [error]);

  return (
    <html>
      <body>
        <Error />
      </body>
    </html>
  );
}
