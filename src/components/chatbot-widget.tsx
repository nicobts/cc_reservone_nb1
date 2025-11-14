"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { orpcClient } from "@/lib/orpc-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatbotWidgetProps {
  restaurantId: string
  restaurantName?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

export function ChatbotWidget({ restaurantId, restaurantName }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sessionId] = useState(() => {
    // Use session storage to persist across page reloads
    if (typeof window !== "undefined") {
      let sid = sessionStorage.getItem(`chatbot-session-${restaurantId}`)
      if (!sid) {
        sid = crypto.randomUUID()
        sessionStorage.setItem(`chatbot-session-${restaurantId}`, sid)
      }
      return sid
    }
    return crypto.randomUUID()
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Start conversation when widget opens
  const { data: conversation, isLoading: isStarting } = useQuery({
    queryKey: ["chatbot-conversation", restaurantId, sessionId],
    queryFn: async () => {
      return await orpcClient.chatbot.startConversation({
        restaurantId,
        sessionId,
        channel: "web",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      })
    },
    enabled: isOpen,
  })

  // Update conversation ID when conversation is loaded
  useEffect(() => {
    if (conversation?.id) {
      setConversationId(conversation.id)
    }
  }, [conversation])

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId) throw new Error("No active conversation")
      return await orpcClient.chatbot.sendMessage({
        conversationId,
        message: content,
      })
    },
    onSuccess: () => {
      // Refetch conversation to get new messages
      queryClient.invalidateQueries({
        queryKey: ["chatbot-conversation", restaurantId, sessionId],
      })
      setMessage("")
    },
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation?.messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sendMessageMutation.isPending) return
    sendMessageMutation.mutate(message.trim())
  }

  // Get messages from conversation
  const messages: Message[] =
    conversation?.messages?.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: new Date(msg.createdAt),
    })) || []

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <CardTitle className="text-lg font-semibold">
              {restaurantName ? `Chat with ${restaurantName}` : "Restaurant Assistant"}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {isStarting ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {msg.createdAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={sendMessageMutation.isPending || isStarting}
              />
              <Button
                type="submit"
                size="icon"
                disabled={
                  !message.trim() || sendMessageMutation.isPending || isStarting
                }
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </Card>
      )}
    </>
  )
}
