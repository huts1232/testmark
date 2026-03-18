"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface BookmarkFormProps {
  children: React.ReactNode
  bookmark?: { id: string; url: string; title?: string; category?: string }
}

export function BookmarkForm({ children, bookmark }: BookmarkFormProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(bookmark?.url || "")
  const [title, setTitle] = useState(bookmark?.title || "")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const method = bookmark ? "PUT" : "POST"
    const endpoint = bookmark ? `/api/bookmarks/${bookmark.id}` : "/api/bookmarks"

    await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, title }),
    })

    setLoading(false)
    setOpen(false)
    window.location.reload()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bookmark ? "Edit Bookmark" : "Add Bookmark"}</DialogTitle>
          <DialogDescription>
            {bookmark ? "Update your bookmark details." : "Add a new URL to monitor."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <Input
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : bookmark ? "Update" : "Add Bookmark"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
