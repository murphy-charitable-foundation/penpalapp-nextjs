"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer({ url }) {
  const viewerRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const observer = new ResizeObserver(([entry]) => {
      setPageWidth(Math.floor(entry.contentRect.width));
    });

    observer.observe(viewer);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={viewerRef}
      className="h-[70vh] w-full overflow-auto rounded-lg bg-slate-100 p-2"
    >
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setPageCount(numPages)}
        onLoadError={(error) => console.error("Failed to load PDF:", error)}
        loading={
          <p className="p-4 text-center text-sm text-slate-600">
            Loading PDF...
          </p>
        }
        error={
          <p className="p-4 text-center text-sm text-red-700">
            Unable to load this PDF.
          </p>
        }
      >
        {pageWidth > 0 &&
          Array.from({ length: pageCount }, (_, index) => (
            <Page
              key={index + 1}
              pageNumber={index + 1}
              width={pageWidth}
              className="mx-auto mb-3 w-fit bg-white shadow-sm"
            />
          ))}
      </Document>
    </div>
  );
}