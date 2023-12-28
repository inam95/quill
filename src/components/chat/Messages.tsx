import { trpc } from "@/app/_trpc/client";
import { INFINITE_QUERY_LIMIT } from "@/config/inifinite-query";
import { Loader2, MessageSquare } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { Message } from "./Message";
import { useContext, useEffect, useRef } from "react";
import { ChatContext } from "./ChatContext";
import { useIntersection } from "@mantine/hooks";

interface MessagesProps {
  fileId: string;
}

const Messages = ({ fileId }: MessagesProps) => {
  const { isLoading: isAiThinking } = useContext(ChatContext);
  const { data, isLoading, fetchNextPage } =
    trpc.getFileMessages.useInfiniteQuery(
      {
        fileId,
        limit: INFINITE_QUERY_LIMIT,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        keepPreviousData: true,
      },
    );

  const messages = data?.pages.flatMap((page) => page.messages);
  const loadingMessages = {
    createdAt: new Date().toISOString(),
    id: "loading-message",
    isUserMessage: false,
    text: (
      <span className="flex h-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>
    ),
  };
  const combinedMessages = [
    ...(isAiThinking ? [loadingMessages] : []),
    ...(messages ?? []),
  ];

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const { ref, entry } = useIntersection({
    root: lastMessageRef.current,
    threshold: 1,
  });

  useEffect(() => {
    if (entry?.isIntersecting) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage]);

  return (
    <div className="max-h-calc[100vh-3.5rem-7rem] scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch flex flex-1 flex-col-reverse gap-4 overflow-y-auto border-zinc-200 p-3">
      {combinedMessages && combinedMessages.length > 0 ? (
        combinedMessages.map((msg, i) => {
          const isNextMessageSamePerson =
            combinedMessages[i - 1]?.isUserMessage ===
            combinedMessages[i]?.isUserMessage;
          if (i === combinedMessages.length - 1) {
            return (
              <Message
                key={msg.id}
                isNextMessageSamePerson={isNextMessageSamePerson}
                message={msg}
                ref={ref}
              />
            );
          }
          return (
            <Message
              key={msg.id}
              isNextMessageSamePerson={isNextMessageSamePerson}
              message={msg}
            />
          );
        })
      ) : isLoading ? (
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-1/6" />
          <Skeleton className="h-1/6" />
          <Skeleton className="h-1/6" />
          <Skeleton className="h-1/6" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <MessageSquare className="h-8 w-8 text-blue-500" />
          <h3 className="text-xl font-semibold">You&apos;re all set!</h3>
          <p className="text-sm text-zinc-500">
            Ask your first question to get started
          </p>
        </div>
      )}
    </div>
  );
};

export default Messages;
