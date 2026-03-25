'use client'

import { useState, useRef, DragEvent } from 'react'
import { cn } from '@/lib/utils'
import { Globe, FileText, MessageSquare, Link2, Upload, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react'

interface Props {
  onUrlSubmit: (url: string) => void
  onPdfSubmit: (file: File) => void
  onSurveyOnly: () => void
  isLoading: boolean
  error: string | null
}

type Tab = 'url' | 'pdf' | 'survey'

export default function InputSection({ onUrlSubmit, onPdfSubmit, onSurveyOnly, isLoading, error }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('url')
  const [url, setUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabs: { id: Tab; label: string; desc: string; Icon: React.ElementType }[] = [
    { id: 'url', label: 'Company URL', desc: 'Analyze your website', Icon: Globe },
    { id: 'pdf', label: 'Upload Deck', desc: 'Pitch deck or strategy doc', Icon: FileText },
    { id: 'survey', label: 'Self Assessment', desc: 'Answer questions directly', Icon: MessageSquare },
  ]

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = () => setIsDragOver(false)
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') setSelectedFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleSubmit = () => {
    if (activeTab === 'url' && url.trim()) onUrlSubmit(url.trim())
    else if (activeTab === 'pdf' && selectedFile) onPdfSubmit(selectedFile)
    else if (activeTab === 'survey') onSurveyOnly()
  }

  const canSubmit =
    !isLoading &&
    ((activeTab === 'url' && url.trim().length > 0) ||
      (activeTab === 'pdf' && selectedFile !== null) ||
      activeTab === 'survey')

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="card-glass-lg rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1.5 px-3 py-3.5 text-xs font-medium transition-colors border-b-2 -mb-px',
                activeTab === id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* URL Tab */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  type="url"
                  placeholder="https://yourcompany.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                  disabled={isLoading}
                />
              </div>
              <p className="type-caption text-muted-foreground">
                Claude will scrape your website and extract readiness signals before asking targeted questions.
              </p>
            </div>
          )}

          {/* PDF Tab */}
          {activeTab === 'pdf' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : selectedFile
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
              />
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                  <p className="type-caption text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                    className="type-caption text-muted-foreground hover:text-foreground underline"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-secondary border border-border flex items-center justify-center">
                    <Upload className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Drop your PDF here</p>
                    <p className="type-caption text-muted-foreground mt-1">or click to browse — max 10MB</p>
                  </div>
                  <p className="type-caption text-muted-foreground/60">
                    Pitch decks, strategy docs, annual reports, capability documents
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Survey Tab */}
          {activeTab === 'survey' && (
            <div className="py-4 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Self-Assessment Survey</p>
                <p className="text-muted-foreground text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                  No website or document needed. Answer 10–12 targeted questions to get your full assessment.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {['AI Use Cases', 'Data & Access', 'Workflows', 'Technology', 'Team Readiness', 'Security'].map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded border border-border bg-secondary type-caption text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'mt-4 w-full py-2.5 px-5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
              canSubmit
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                : 'bg-secondary text-muted-foreground cursor-not-allowed border border-border'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                {activeTab === 'survey' ? 'Start Assessment' : 'Analyze & Assess'}
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
