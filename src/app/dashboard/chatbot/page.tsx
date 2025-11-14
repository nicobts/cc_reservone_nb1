"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { orpcClient } from "@/lib/orpc-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  MessageCircle,
  Plus,
  Trash2,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  Users,
} from "lucide-react"

export default function ChatbotSettingsPage() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("")
  const [newKnowledge, setNewKnowledge] = useState({
    category: "faq" as "faq" | "policy" | "menu" | "special_instructions",
    question: "",
    answer: "",
    keywords: "",
  })

  const queryClient = useQueryClient()

  // Get user's restaurants
  const { data: restaurants, isLoading: isLoadingRestaurants } = useQuery({
    queryKey: ["myRestaurants"],
    queryFn: async () => {
      return await orpcClient.restaurant.getMyRestaurants()
    },
  })

  // Get restaurant settings
  const { data: settings } = useQuery({
    queryKey: ["restaurantSettings", selectedRestaurant],
    queryFn: async () => {
      if (!selectedRestaurant) return null
      return await orpcClient.settings.getRestaurantSettings({
        restaurantId: selectedRestaurant,
      })
    },
    enabled: !!selectedRestaurant,
  })

  // Get knowledge base
  const { data: knowledge } = useQuery({
    queryKey: ["chatbotKnowledge", selectedRestaurant],
    queryFn: async () => {
      if (!selectedRestaurant) return []
      return await orpcClient.chatbot.getKnowledge({
        restaurantId: selectedRestaurant,
      })
    },
    enabled: !!selectedRestaurant,
  })

  // Get conversation stats
  const { data: stats } = useQuery({
    queryKey: ["chatbotStats", selectedRestaurant],
    queryFn: async () => {
      if (!selectedRestaurant) return null
      return await orpcClient.chatbot.getConversationStats({
        restaurantId: selectedRestaurant,
      })
    },
    enabled: !!selectedRestaurant && settings?.enableAIChatbot,
  })

  // Toggle chatbot enabled
  const toggleChatbotMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!selectedRestaurant) throw new Error("No restaurant selected")
      return await orpcClient.settings.updateSettings({
        restaurantId: selectedRestaurant,
        settings: {
          enableAIChatbot: enabled,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantSettings"] })
      toast.success("Chatbot settings updated")
    },
  })

  // Update greeting
  const updateGreetingMutation = useMutation({
    mutationFn: async (greeting: string) => {
      if (!selectedRestaurant) throw new Error("No restaurant selected")
      return await orpcClient.settings.updateSettings({
        restaurantId: selectedRestaurant,
        settings: {
          chatbotGreeting: greeting,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantSettings"] })
      toast.success("Greeting updated")
    },
  })

  // Add knowledge
  const addKnowledgeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRestaurant) throw new Error("No restaurant selected")
      return await orpcClient.chatbot.addKnowledge({
        restaurantId: selectedRestaurant,
        category: newKnowledge.category,
        question: newKnowledge.question,
        answer: newKnowledge.answer,
        keywords: newKnowledge.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbotKnowledge"] })
      setNewKnowledge({ category: "faq", question: "", answer: "", keywords: "" })
      toast.success("Knowledge added")
    },
  })

  if (isLoadingRestaurants) {
    return <div className="p-8">Loading...</div>
  }

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>No Restaurants Found</CardTitle>
            <CardDescription>
              You need to create a restaurant first to manage chatbot settings
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Chatbot</h1>
        <p className="text-muted-foreground">
          Configure your AI-powered restaurant assistant
        </p>
      </div>

      {/* Restaurant Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Restaurant</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a restaurant" />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map((restaurant: any) => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedRestaurant && (
        <>
          {/* Statistics */}
          {settings?.enableAIChatbot && stats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalConversations}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeConversations} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalMessages}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg: {stats.averageMessagesPerConversation.toFixed(1)} per conversation
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.conversionsToReservations} reservations created
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Channels</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Web:</span>
                      <span className="font-medium">{stats.channelBreakdown.web}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>WhatsApp:</span>
                      <span className="font-medium">{stats.channelBreakdown.whatsapp}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chatbot Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Chatbot Settings</CardTitle>
              <CardDescription>
                Configure your AI assistant's behavior and appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable AI Chatbot</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to chat with your AI assistant
                  </p>
                </div>
                <Button
                  variant={settings?.enableAIChatbot ? "default" : "outline"}
                  onClick={() =>
                    toggleChatbotMutation.mutate(!settings?.enableAIChatbot)
                  }
                  disabled={toggleChatbotMutation.isPending}
                >
                  {settings?.enableAIChatbot ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enabled
                    </>
                  ) : (
                    "Enable"
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Greeting Message</Label>
                <Textarea
                  placeholder="Enter a custom greeting for your chatbot..."
                  defaultValue={settings?.chatbotGreeting || ""}
                  onBlur={(e) => {
                    if (e.target.value !== settings?.chatbotGreeting) {
                      updateGreetingMutation.mutate(e.target.value)
                    }
                  }}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  This message will be shown when customers start a conversation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Integration */}
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Integration</CardTitle>
              <CardDescription>
                Enable WhatsApp Business API to chat with customers on WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to message you on WhatsApp
                  </p>
                </div>
                <Button
                  variant={settings?.enableWhatsApp ? "default" : "outline"}
                  onClick={() => {
                    if (!selectedRestaurant) return
                    orpcClient.settings.updateSettings({
                      restaurantId: selectedRestaurant,
                      settings: { enableWhatsApp: !settings?.enableWhatsApp },
                    }).then(() => {
                      queryClient.invalidateQueries({ queryKey: ["restaurantSettings"] })
                      toast.success("WhatsApp settings updated")
                    })
                  }}
                >
                  {settings?.enableWhatsApp ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enabled
                    </>
                  ) : (
                    "Enable"
                  )}
                </Button>
              </div>

              {settings?.enableWhatsApp && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                  <h4 className="font-semibold text-sm">Setup Instructions</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Create a WhatsApp Business account at business.whatsapp.com</li>
                    <li>Set up WhatsApp Business API</li>
                    <li>Configure webhook URL: {process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com"}/api/webhooks/whatsapp</li>
                    <li>Add your access token and phone number ID to environment variables</li>
                    <li>Verify webhook with token: "reservone-webhook"</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    Need help? Check our documentation or contact support.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>
                Teach your chatbot about your restaurant's policies, menu, and FAQs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Knowledge */}
              <div className="p-4 border rounded-lg space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Knowledge
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newKnowledge.category}
                      onValueChange={(value: any) =>
                        setNewKnowledge({ ...newKnowledge, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="faq">FAQ</SelectItem>
                        <SelectItem value="policy">Policy</SelectItem>
                        <SelectItem value="menu">Menu</SelectItem>
                        <SelectItem value="special_instructions">
                          Special Instructions
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Keywords (comma separated)</Label>
                    <Input
                      placeholder="e.g. parking, valet, garage"
                      value={newKnowledge.keywords}
                      onChange={(e) =>
                        setNewKnowledge({ ...newKnowledge, keywords: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Question</Label>
                  <Input
                    placeholder="What customers might ask..."
                    value={newKnowledge.question}
                    onChange={(e) =>
                      setNewKnowledge({ ...newKnowledge, question: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Answer</Label>
                  <Textarea
                    placeholder="How the chatbot should respond..."
                    value={newKnowledge.answer}
                    onChange={(e) =>
                      setNewKnowledge({ ...newKnowledge, answer: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => addKnowledgeMutation.mutate()}
                  disabled={
                    !newKnowledge.question ||
                    !newKnowledge.answer ||
                    addKnowledgeMutation.isPending
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Knowledge
                </Button>
              </div>

              {/* Knowledge List */}
              <div className="space-y-2">
                <h3 className="font-semibold">Existing Knowledge</h3>
                {knowledge && knowledge.length > 0 ? (
                  <div className="space-y-2">
                    {knowledge.map((item: any) => (
                      <div key={item.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                {item.category}
                              </span>
                              {item.keywords && item.keywords.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  Keywords: {item.keywords.join(", ")}
                                </span>
                              )}
                            </div>
                            <p className="font-medium">{item.question}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.answer}
                            </p>
                            {item.timesUsed > 0 && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Used {item.timesUsed} times
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No knowledge base entries yet. Add your first one above!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
