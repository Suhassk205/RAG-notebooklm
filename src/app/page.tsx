'use client'

import { useState } from 'react'
import { DocumentUpload } from '@/components/DocumentUpload'
import { ChatInterface } from '@/components/ChatInterface'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 left-4 z-50 text-foreground"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      )}

      {/* Sidebar / Left Panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-full sm:relative sm:w-[30%]
          bg-background border-r border-border
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
          overflow-hidden flex flex-col
        `}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <DocumentUpload />
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area / Right Panel */}
      <main className="flex-1 flex flex-col overflow-hidden w-full sm:w-[70%]">
        <ChatInterface />
      </main>
    </div>
  )
}
