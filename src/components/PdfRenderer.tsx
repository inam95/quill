"use client";

interface PdfRendererProps {}

export default function PdfRenderer({}: PdfRendererProps) {
  return (
    <div className="flex w-full flex-col items-center rounded-md bg-white shadow">
      <div className="flex h-14 w-full items-center justify-between border-b border-zinc-200 px-2">
        <div className="flex items-center gap-3.5">Top bar</div>
      </div>
    </div>
  );
}
