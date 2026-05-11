'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Loader2, Check } from 'lucide-react'

interface Document {
  id: string
  name: string
  size: string
  status: 'processing' | 'ready'
  uploadedAt: Date
}

export function DocumentUpload() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    setIsUploading(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const newDoc: Document = {
        id: Date.now().toString() + i,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
        status: 'processing',
        uploadedAt: new Date(),
      }

      setDocuments((prev) => [newDoc, ...prev])

      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/ingest', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) throw new Error('Upload failed')

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === newDoc.id ? { ...doc, status: 'ready' as const } : doc
          )
        )
      } catch (e) {
        console.error(e)
        // Remove failed document
        setDocuments((prev) => prev.filter(doc => doc.id !== newDoc.id))
      }
    }

    setIsUploading(false)
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">NotebookLM Clone</h1>
        <p className="text-sm text-muted-foreground">
          Upload your documents and chat with them
        </p>
      </div>

      {/* Upload Zone */}
      <Card
        className={`relative border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        } ${isUploading ? 'opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label className="flex flex-col items-center justify-center gap-4 p-8 cursor-pointer">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">
              Drag and drop your files here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse (PDF, TXT)
            </p>
          </div>
          <input
            type="file"
            multiple
            accept=".pdf,.txt"
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </Card>

      {/* Active Sources */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        <h3 className="text-sm font-semibold text-muted-foreground">
          ACTIVE SOURCES
        </h3>
        <div className="space-y-2">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg bg-card border border-border p-3 hover:bg-card/80 transition-colors"
              >
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {doc.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{doc.size}</p>
                </div>
                <div className="flex-shrink-0">
                  {doc.status === 'processing' ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <Badge variant="outline" className="text-xs">
                        Processing...
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <Badge variant="secondary" className="text-xs">
                        Ready
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No documents uploaded yet
            </p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg bg-card/50 border border-border p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          💡 <strong>Tip:</strong> Upload PDF or TXT files containing research
          papers, articles, or documentation to get started.
        </p>
      </div>
    </div>
  )
}
