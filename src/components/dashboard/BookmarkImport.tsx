'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BookmarkImportProps {
  onImportComplete: () => void
  isOpen: boolean
  onClose: () => void
}

interface ParsedBookmark {
  title: string
  url: string
  folder?: string
}

interface ImportStats {
  total: number
  imported: number
  failed: number
  duplicates: number
}

export default function BookmarkImport({ onImportComplete, isOpen, onClose }: BookmarkImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [parsedBookmarks, setParsedBookmarks] = useState<ParsedBookmark[]>([])
  const [importStats, setImportStats] = useState<ImportStats | null>(null)
  const [error, setError] = useState<string>('')
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.name.endsWith('.html')) {
      setError('Please select an HTML bookmark file')
      return
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const parseBookmarkFile = async (file: File): Promise<ParsedBookmark[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const html = e.target?.result as string
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')
          const links = doc.querySelectorAll('a[href]')
          
          const bookmarks: ParsedBookmark[] = []
          
          links.forEach((link) => {
            const url = link.getAttribute('href')
            const title = link.textContent?.trim()
            
            if (url && title && (url.startsWith('http://') || url.startsWith('https://'))) {
              // Try to find folder name from parent elements
              let folder = ''
              let parent = link.parentElement
              while (parent) {
                if (parent.tagName === 'H3') {
                  folder = parent.textContent?.trim() || ''
                  break
                }
                parent = parent.parentElement
              }
              
              bookmarks.push({
                title,
                url,
                folder: folder || undefined
              })
            }
          })
          
          resolve(bookmarks)
        } catch (error) {
          reject(new Error('Failed to parse bookmark file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setError('')

    try {
      // Parse the bookmark file
      setUploadProgress(30)
      const bookmarks = await parseBookmarkFile(file)
      
      if (bookmarks.length === 0) {
        throw new Error('No valid bookmarks found in the file')
      }

      setUploadProgress(100)
      setParsedBookmarks(bookmarks)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process bookmark file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImport = async () => {
    if (parsedBookmarks.length === 0) return

    setStep('importing')
    setUploadProgress(0)

    try {
      const response = await fetch('/api/bookmarks/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookmarks: parsedBookmarks }),
      })

      if (!response.ok) {
        throw new Error('Failed to import bookmarks')
      }

      const result = await response.json()
      setImportStats(result.stats)
      setStep('complete')

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.stats.imported} bookmarks`,
      })

      onImportComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import bookmarks')
      setStep('preview')
    }
  }

  const handleClose = () => {
    setFile(null)
    setIsUploading(false)
    setUploadProgress(0)
    setParsedBookmarks([])
    setImportStats(null)
    setError('')
    setStep('upload')
    onClose()
  }

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold">Import Browser Bookmarks</h3>
        <p className="mt-2 text-sm text-gray-600">
          Upload an HTML bookmark file exported from your browser
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
        <Input
          type="file"
          accept=".html"
          onChange={handleFileSelect}
          className="mb-4"
        />
        
        {file && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>{file.name}</span>
            <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          To export bookmarks: Chrome/Edge → Settings → Bookmarks → Export bookmarks. 
          Firefox → Bookmarks → Manage Bookmarks → Import and Backup → Export Bookmarks to HTML.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing file...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}
    </div>
  )

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-lg font-semibold">Ready to Import</h3>
        <p className="mt-2 text-sm text-gray-600">
          Found {parsedBookmarks.length} bookmarks ready for import
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Import Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total bookmarks:</span>
                <span className="font-medium">{parsedBookmarks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Unique URLs:</span>
                <span className="font-medium">
                  {new Set(parsedBookmarks.map(b => b.url)).size}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Folders found:</span>
                <span className="font-medium">
                  {new Set(parsedBookmarks.filter(b => b.folder).map(b => b.folder)).size}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {parsedBookmarks.slice(0, 5).map((bookmark, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium truncate">{bookmark.title}</div>
                  <div className="text-gray-500 truncate">{bookmark.url}</div>
                  {bookmark.folder && (
                    <div className="text-xs text-gray-400">📁 {bookmark.folder}</div>
                  )}
                </div>
              ))}
              {parsedBookmarks.length > 5 && (
                <div className="text-xs text-gray-400">
                  ...and {parsedBookmarks.length - 5} more
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )

  const renderImportingStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <h3 className="mt-4 text-lg font-semibold">Importing Bookmarks</h3>
        <p className="mt-2 text-sm text-gray-600">
          Please wait while we import your bookmarks...
        </p>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-lg font-semibold">Import Complete!</h3>
        <p className="mt-2 text-sm text-gray-600">
          Your bookmarks have been successfully imported
        </p>
      </div>

      {importStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total processed:</span>
                  <span className="font-medium">{importStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">Successfully imported:</span>
                  <span className="font-medium text-green-600">{importStats.imported}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-orange-600">Duplicates skipped:</span>
                  <span className="font-medium text-orange-600">{importStats.duplicates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-red-600">Failed:</span>
                  <span className="font-medium text-red-600">{importStats.failed}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Import Bookmarks</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Import bookmarks from your browser to start monitoring them
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === 'upload' && renderUploadStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'importing' && renderImportingStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
              >
                {isUploading ? 'Processing...' : 'Process File'}
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={handleImport}>
                Import {parsedBookmarks.length} Bookmarks
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}