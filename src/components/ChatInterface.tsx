'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import ReactMarkdown from 'react-markdown'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, FileText, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sourceChunk?: {
    document: string
    chunk: number
  }
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMsg = newMessages[newMessages.length - 1]
          if (lastMsg.role === 'assistant') {
            lastMsg.content += chunk
          }
          return newMessages
        })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [textareaHeight, setTextareaHeight] = useState(50)

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLElement
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    handleInputChange(e)
    setTextareaHeight(
      Math.min(Math.max(e.target.scrollHeight, 50), 200)
    )
  }

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Messages Area */}
      <ScrollArea
        className="flex-1"
        ref={scrollAreaRef}
      >
        <div className="space-y-4 p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    No conversations yet
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload documents and start asking questions to begin
                  </p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user'
                    ? 'flex-row-reverse justify-start'
                    : 'flex-row justify-start'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    message.role === 'user'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {message.role === 'user' ? 'U' : 'AI'}
                </div>
                <div
                  className={`max-w-md ${
                    message.role === 'user'
                      ? 'bg-primary/15 text-foreground rounded-2xl rounded-tr-sm'
                      : 'flex-1'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="space-y-2">
                      <div className="border border-border/50 rounded-xl p-4 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-colors">
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => (
                                <p className="text-foreground mb-2" {...props} />
                              ),
                              strong: ({ node, ...props }) => (
                                <strong
                                  className="font-semibold text-primary"
                                  {...props}
                                />
                              ),
                              code: ({ node, ...props }) => (
                                <code
                                  className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs"
                                  {...props}
                                />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul className="list-disc list-inside mb-2" {...props} />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol className="list-decimal list-inside mb-2" {...props} />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <Badge
                          variant="outline"
                          className="text-xs hover:bg-primary/10 cursor-pointer transition-colors"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          📄 AI_Research_Paper.pdf (Chunk 3)
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-2 rounded-2xl rounded-bl-sm bg-primary/15">
                      <p className="text-foreground text-sm break-words">
                        {message.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
              <div className="max-w-md">
                <div className="border border-border/50 rounded-xl p-4 bg-card/50">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-100" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse delay-200" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Disclaimer */}
      <div className="px-6 py-3 bg-background/80 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Answers are strictly grounded in your uploaded documents.
        </p>
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="gap-3 p-6 border-t border-border bg-background"
      >
        <div className="flex gap-3">
          <Textarea
            value={input}
            onChange={handleTextareaChange}
            placeholder="Ask a question about your documents..."
            disabled={isLoading}
            className="resize-none bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
            style={{ height: textareaHeight }}
            rows={1}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="lg"
            className="flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
