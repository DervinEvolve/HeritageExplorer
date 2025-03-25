import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, AlertCircle, Link as LinkIcon, Loader2 } from "lucide-react";
import { askPerplexity } from "@/lib/perplexity";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  citations?: string[];
}

export function PerplexityChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { 
      id: Date.now().toString(),
      role: "user", 
      content: input 
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await askPerplexity(input);
      setMessages((prev) => [...prev, { 
        id: (Date.now() + 1).toString(),
        role: "assistant", 
        content: response.content,
        citations: response.citations 
      }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessages((prev) => [...prev, { 
        id: (Date.now() + 1).toString(),
        role: "error", 
        content: errorMessage
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (content: string) => {
    return content.split('###').map((section, index) => {
      if (index === 0) return (
        <div key={`intro-${index}`} className="prose prose-sm max-w-none">
          {section.trim().split('\n').map((paragraph, pIndex) => (
            <p key={`p-${pIndex}`} className="mb-4">{paragraph.trim()}</p>
          ))}
        </div>
      );

      const [title, ...contentParts] = section.split('\n');
      return (
        <div key={`section-${index}`} className="mt-6">
          <h3 className="text-lg font-semibold mb-3">{title.trim()}</h3>
          <div className="space-y-4">
            {contentParts.map((part, idx) => {
              const trimmedPart = part.trim();
              if (!trimmedPart) return null;

              if (/^\d+\.\s/.test(trimmedPart)) {
                return (
                  <div key={`list-${idx}`} className="ml-4">
                    <p className="text-muted-foreground">{trimmedPart}</p>
                  </div>
                );
              }

              if (trimmedPart.startsWith('* ') || trimmedPart.startsWith('- ')) {
                return (
                  <div key={`bullet-${idx}`} className="ml-4">
                    <p className="text-muted-foreground">• {trimmedPart.substring(2)}</p>
                  </div>
                );
              }

              return (
                <p key={`content-${idx}`} className="text-muted-foreground">
                  {trimmedPart}
                </p>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardContent className="flex-1 p-4 flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "error" ? (
                    <Alert variant="destructive" className="w-full">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{message.content}</AlertDescription>
                    </Alert>
                  ) : (
                    <motion.div 
                      className="max-w-[85%]"
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className={`p-4 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {formatContent(message.content)}
                      </div>
                      {message.citations && message.citations.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="mt-2 pl-4 space-y-1 border-l-2 border-muted"
                        >
                          <p className="text-sm text-muted-foreground font-medium">Sources:</p>
                          {message.citations.map((citation, idx) => (
                            <a
                              key={idx}
                              href={citation}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                              <LinkIcon className="h-3 w-3" />
                              {new URL(citation).hostname}
                            </a>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-center gap-2 text-muted-foreground p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about cultural heritage..."
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}