"use client";

import { createContext, useRef, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/app/_trpc/client";
import { INFINITE_QUERY_LIMIT } from "@/config/inifinite-query";

type StreamResponse = {
  addMessage: () => void;
  message: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
};

export const ChatContext = createContext<StreamResponse>({
  addMessage: () => {},
  message: "",
  handleInputChange: () => {},
  isLoading: false,
});

interface ChatContextProviderProps {
  fileId: string;
  children: React.ReactNode;
}

export const ChatContextProvider = ({
  fileId,
  children,
}: ChatContextProviderProps) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const utils = trpc.useContext();
  const { toast } = useToast();
  const backupMessage = useRef("");

  const { mutate: sendMessage } = useMutation({
    mutationKey: ["SEND_MESSAGE"],
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch("/api/message", {
        method: "POST",
        body: JSON.stringify({
          fileId,
          message,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.body;
    },
    onMutate: async ({ message }) => {
      backupMessage.current = message;
      setMessage("");

      await utils.getFileMessages.cancel();

      // do optimistic update
      const previousMessages = utils.getFileMessages.getInfiniteData();

      utils.getFileMessages.setInfiniteData(
        {
          fileId,
          limit: INFINITE_QUERY_LIMIT,
        },
        (oldData) => {
          if (!oldData) {
            return {
              pages: [],
              pageParams: [],
            };
          }

          let newPages = [...oldData.pages];
          let latestPage = newPages[0]!;

          latestPage.messages = [
            {
              createdAt: new Date().toISOString(),
              id: crypto.randomUUID(),
              text: message,
              isUserMessage: true,
            },
            ...latestPage.messages,
          ];

          newPages[0] = latestPage;
          return {
            ...oldData,
            pages: newPages,
          };
        },
      );
      setIsLoading(true);

      return {
        previousMessages:
          previousMessages?.pages.flatMap((page) => page.messages) ?? [],
      };
    },
    onSuccess: async (stream) => {
      setIsLoading(false);
      if (!stream) {
        return toast({
          title: "There was a problem sending your message",
          description: "Please refresh the page and try again",
          variant: "destructive",
        });
      }
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let done = false;

      // accumulate response
      let accResponse = "";
      while (!done) {
        const { value, done: _done } = await reader.read();
        if (value) {
          accResponse += decoder.decode(value);
        }
        // append chunk to the actual response
        utils.getFileMessages.setInfiniteData(
          {
            fileId,
            limit: INFINITE_QUERY_LIMIT,
          },
          (oldData) => {
            if (!oldData) {
              return {
                pages: [],
                pageParams: [],
              };
            }

            let isAiResponseCreated = oldData.pages.some((page) =>
              page.messages.some((msg) => msg.id === "ai-response"),
            );

            let updatedPages = oldData.pages.map((page) => {
              if (page === oldData.pages[0]) {
                let updatedMessages;
                if (!isAiResponseCreated) {
                  updatedMessages = [
                    {
                      createdAt: new Date().toISOString(),
                      id: "ai-response",
                      text: accResponse,
                      isUserMessage: false,
                    },
                    ...page.messages,
                  ];
                } else {
                  updatedMessages = page.messages.map((msg) => {
                    if (msg.id === "ai-response") {
                      return {
                        ...msg,
                        text: accResponse,
                      };
                    }
                    return msg;
                  });
                }
                return {
                  ...page,
                  messages: updatedMessages,
                };
              }
              return page;
            });
            return {
              ...oldData,
              pages: updatedPages,
            };
          },
        );
        done = _done;
      }
    },
    onError: (_, __, context) => {
      setMessage(backupMessage.current);

      utils.getFileMessages.setData(
        { fileId },
        { messages: context?.previousMessages ?? [] },
      );
    },
    onSettled: async () => {
      setIsLoading(false);
      await utils.getFileMessages.invalidate();
    },
  });

  const addMessage = () => {
    sendMessage({ message });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  return (
    <ChatContext.Provider
      value={{
        addMessage,
        handleInputChange,
        isLoading,
        message,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
