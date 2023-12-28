import { Send } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useContext, useRef, useState } from "react";
import { ChatContext } from "./ChatContext";

interface ChatInputProps {
  isDisabled: boolean;
}

const ChatInput = ({ isDisabled }: ChatInputProps) => {
  const [val, setVal] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addMessage, handleInputChange, isLoading, message } =
    useContext(ChatContext);

  return (
    <div className="absolute bottom-0 left-0 w-full">
      <div className="mx-2 flex flex-row gap-3 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl">
        <div className="relative flex h-full flex-1 items-stretch md:flex-col">
          <div className="relative flex w-full flex-grow flex-col p-4">
            <div className="relative">
              <Textarea
                rows={1}
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    addMessage();
                    textareaRef.current?.focus();
                  }
                }}
                placeholder="Enter your question..."
                maxRows={4}
                autoFocus
                className="scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrollbar-touch resize-none py-3 pr-12 text-base"
              />
              <Button
                disabled={isLoading || isDisabled}
                aria-label="send message"
                className="absolute bottom-1.5 right-[8px]"
                onClick={() => {
                  addMessage();
                  textareaRef.current?.focus();
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
