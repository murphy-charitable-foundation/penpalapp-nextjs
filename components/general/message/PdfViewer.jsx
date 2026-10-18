"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export default function PdfViewer({ url }) {
  const viewerRef = useRef(null);
  const scrollRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const observer = new ResizeObserver(([entry]) => {
      setPageWidth(Math.floor(entry.contentRect.width));
    });

    observer.observe(viewer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  return (
    <div
      ref={viewerRef}
      className="flex h-[70vh] w-full flex-col rounded-lg bg-slate-100 p-2"
    >
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => {
            setPageCount(numPages);
            setCurrentPage(1);
          }}
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
          {pageWidth > 0 && pageCount > 0 && (
            <Page
              pageNumber={currentPage}
              width={pageWidth}
              className="mx-auto mb-3 w-fit bg-white shadow-sm"
            />
          )}
        </Document>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-4 py-3">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="rounded bg-slate-200 px-3 py-2 text-sm disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-slate-700">
            Page {currentPage} of {pageCount}
          </span>

          <button
            type="button"
            onClick={() =>
              setCurrentPage((page) => Math.min(pageCount, page + 1))
            }
            disabled={currentPage === pageCount}
            className="rounded bg-slate-200 px-3 py-2 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}