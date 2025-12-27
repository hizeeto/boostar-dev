"use client"

import * as React from "react"
import { Send, Search, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useIsMobile } from "@/hooks/use-mobile"

interface Message {
  id: string
  sender: {
    id: string
    name: string
    avatar?: string
  }
  content: string
  time: string
  isRead: boolean
}

interface Conversation {
  id: string
  participant: {
    id: string
    name: string
    avatar?: string
  }
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
}

export default function MessagesPage() {
  const isMobile = useIsMobile()
  const [conversations, setConversations] = React.useState<Conversation[]>([
    {
      id: "1",
      participant: {
        id: "user1",
        name: "김아티스트",
        avatar: undefined,
      },
      lastMessage: "안녕하세요! 프로젝트 관련해서 문의드립니다.",
      lastMessageTime: "10분 전",
      unreadCount: 2,
      messages: [
        {
          id: "m1",
          sender: { id: "user1", name: "김아티스트" },
          content: "안녕하세요! 프로젝트 관련해서 문의드립니다.",
          time: "10분 전",
          isRead: false,
        },
      ],
    },
    {
      id: "2",
      participant: {
        id: "user2",
        name: "이프로듀서",
        avatar: undefined,
      },
      lastMessage: "네, 확인했습니다.",
      lastMessageTime: "1시간 전",
      unreadCount: 0,
      messages: [
        {
          id: "m2",
          sender: { id: "user2", name: "이프로듀서" },
          content: "네, 확인했습니다.",
          time: "1시간 전",
          isRead: true,
        },
      ],
    },
  ])

  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [messageInput, setMessageInput] = React.useState("")

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId)

  // 모바일에서 리스트로 돌아가기
  const handleBackToList = () => {
    setSelectedConversationId(null)
  }

  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const query = searchQuery.toLowerCase()
    return conversations.filter(
      (c) =>
        c.participant.name.toLowerCase().includes(query) ||
        c.lastMessage.toLowerCase().includes(query)
    )
  }, [conversations, searchQuery])

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversationId) return

    // TODO: 실제 메시지 전송 API 호출
    console.log("메시지 전송:", messageInput)
    setMessageInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 모바일일 때: 선택된 대화가 있으면 메시지 창만, 없으면 리스트만 표시
  // 데스크톱일 때: 항상 둘 다 표시
  const showList = !isMobile || !selectedConversationId
  const showMessage = !isMobile || selectedConversationId

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* 좌측: 대화 목록 */}
      {showList && (
        <div className={`${isMobile ? 'w-full' : 'w-80'} border-r flex flex-col bg-background`}>
          <div className="p-4 border-b">
            <h1 className="text-xl font-semibold mb-4">메시지</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="대화 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  대화가 없습니다.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedConversationId === conversation.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={conversation.participant.avatar}
                            alt={conversation.participant.name}
                          />
                          <AvatarFallback>
                            {conversation.participant.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className={`text-sm font-semibold truncate ${
                                selectedConversationId === conversation.id
                                  ? "text-primary-foreground"
                                  : ""
                              }`}
                            >
                              {conversation.participant.name}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span
                                className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                                  selectedConversationId === conversation.id
                                    ? "bg-primary-foreground text-primary"
                                    : "bg-primary text-primary-foreground"
                                }`}
                              >
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs truncate ${
                              selectedConversationId === conversation.id
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {conversation.lastMessage}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              selectedConversationId === conversation.id
                                ? "text-primary-foreground/60"
                                : "text-muted-foreground"
                            }`}
                          >
                            {conversation.lastMessageTime}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* 우측: 메시지 영역 */}
      {showMessage && (
        <div className={`${isMobile ? 'w-full' : 'flex-1'} flex flex-col bg-background`}>
          {selectedConversation ? (
            <>
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBackToList}
                      className="mr-2"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedConversation.participant.avatar}
                      alt={selectedConversation.participant.name}
                    />
                    <AvatarFallback>
                      {selectedConversation.participant.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedConversation.participant.name}</p>
                    <p className="text-sm text-muted-foreground">온라인</p>
                  </div>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender.id === "current-user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender.id === "current-user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender.id === "current-user"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              대화를 선택하세요.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

