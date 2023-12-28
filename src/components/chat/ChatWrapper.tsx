"use client";

import { trpc } from "@/app/_trpc/client";
import ChatInput from "./ChatInput";
import Messages from "./Messages";
import { ChevronLeft, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { ChatContextProvider } from "./ChatContext";

interface ChatWrapperProps {
  fileId: string;
}

export default function ChatWrapper({ fileId }: ChatWrapperProps) {
  const { data, isLoading, isError } = trpc.getFileUploadStatus.useQuery(
    { fileId },
    {
      refetchInterval: (data) => {
        return data?.status === "SCUCCESS" || data?.status === "FAILED"
          ? false
          : 500;
      },
    },
  );

  if (isLoading) {
    return (
      <div className="relative flex min-h-full flex-col justify-between gap-2 divide-y divide-zinc-200 bg-zinc-50">
        <div className="mb-28 flex flex-1 flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
            <h1 className="text-xl font-semibold">Loading...</h1>
            <p className="text-sm text-zinc-500">
              We&apos;re preparing your PDF
            </p>
          </div>
        </div>
        <ChatInput isDisabled />
      </div>
    );
  }

  if (data?.status === "PROCESSING") {
    return (
      <div className="relative flex min-h-full flex-col justify-between gap-2 divide-y divide-zinc-200 bg-zinc-50">
        <div className="mb-28 flex flex-1 flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
            <h1 className="text-xl font-semibold">Processing PDF...</h1>
            <p className="text-sm text-zinc-500">This won&apos;t take long.</p>
          </div>
        </div>
        <ChatInput isDisabled />
      </div>
    );
  }

  if (data?.status === "FAILED") {
    return (
      <div className="relative flex min-h-full flex-col justify-between gap-2 divide-y divide-zinc-200 bg-zinc-50">
        <div className="mb-28 flex flex-1 flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <XCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-xl font-semibold">Too many pages in PDF</h1>
            <p className="text-sm text-zinc-500">
              Your <span className="font-medium">Free</span> plan supports up to
              5 pages per PDF
            </p>
            <Link
              href="/dashboard"
              className={buttonVariants({
                variant: "secondary",
                className: "mt-4",
              })}
            >
              <ChevronLeft className="mr-1.5 h-3 w-3" /> Back
            </Link>
          </div>
        </div>
        <ChatInput isDisabled />
      </div>
    );
  }

  return (
    <ChatContextProvider fileId={fileId}>
      <div className="relative flex min-h-full flex-col justify-between gap-2 divide-y divide-zinc-200 bg-zinc-50">
        <div className="mb-28 flex flex-1 flex-col justify-between">
          <Messages fileId={fileId} />
        </div>
        <ChatInput isDisabled={false} />
      </div>
    </ChatContextProvider>
  );
}
