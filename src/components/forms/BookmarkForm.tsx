'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  check_interval: number;
  timeout: number;
  expected_status: number;
  follow_redirects: boolean;
  check_ssl: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BookmarkFormData {
  url: string;
  title: string;
  description?: string;
  tags: string[];
  check_interval: number;
  timeout: number;
  expected_status: number;
  follow_redirects: boolean;
  check_ssl: boolean;
}

interface BookmarkFormProps {
  bookmark?: Bookmark;
  onSubmit: (data: BookmarkFormData) => Promise<void>;
  onCancel: () => void;
}

const CHECK_INTERVALS = [
  { value: 300, label: '5 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
  { value: 7200, label: '2 hours' },
  { value: 21600, label: '6 hours' },
  { value: 43200, label: '12 hours' },
  { value: 86400, label: '24 hours' },
];

const TIMEOUT_OPTIONS = [
  { value: 5000, label: '5 seconds' },
  { value: 10000, label: '10 seconds' },
  { value: 15000, label: '15 seconds' },
  { value: 30000, label: '30 seconds' },
  { value: 60000, label: '1 minute' },
];

const STATUS_CODES = [
  { value: 200, label: '200 OK' },
  { value: 201, label: '201 Created' },
  { value: 202, label: '202 Accepted' },
  { value: 204, label: '204 No Content' },
  { value: 301, label: '301 Moved Permanently' },
  { value: 302, label: '302 Found' },
];

export default function BookmarkForm({ bookmark, onSubmit, onCancel }: BookmarkFormProps) {
  const [formData, setFormData] = useState<BookmarkFormData>({
    url: '',
    title: '',
    description: '',
    tags: [],
    check_interval: 3600,
    timeout: 10000,
    expected_status: 200,
    follow_redirects: true,
    check_ssl: true,
  });

  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidUrl, setIsValidUrl] = useState(true);

  // Initialize form with bookmark data if editing
  useEffect(() => {
    if (bookmark) {
      setFormData({
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description || '',
        tags: bookmark.tags,
        check_interval: bookmark.check_interval,
        timeout: bookmark.timeout,
        expected_status: bookmark.expected_status,
        follow_redirects: bookmark.follow_redirects,
        check_ssl: bookmark.check_ssl,
      });
    }
  }, [bookmark]);

  // Validate URL format
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Auto-generate title from URL if empty
  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, url }));
    setIsValidUrl(validateUrl(url));
    
    // Auto-generate title if URL is valid and title is empty
    if (validateUrl(url) && !formData.title) {
      try {
        const urlObj = new URL(url);
        const title = urlObj.hostname.replace(/^www\./, '');
        setFormData(prev => ({ ...prev, title }));
      } catch {
        // Ignore error, URL validation already handled above
      }
    }
  };

  // Handle tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrl(formData.url)) {
      setError('Please enter a valid URL');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bookmark');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {bookmark ? 'Edit Bookmark' : 'Add New Bookmark'}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={!isValidUrl && formData.url ? 'border-red-500' : ''}
              required
            />
            {!isValidUrl && formData.url && (
              <p className="text-sm text-red-500">Please enter a valid URL</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Website name or description"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Optional description or notes"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="space-y-2">
              <Input
                id="tags"
                placeholder="Add tags (press Enter or comma to add)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check-interval">Check Interval</Label>
              <Select
                value={formData.check_interval.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, check_interval: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHECK_INTERVALS.map((interval) => (
                    <SelectItem key={interval.value} value={interval.value.toString()}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout</Label>
              <Select
                value={formData.timeout.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, timeout: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEOUT_OPTIONS.map((timeout) => (
                    <SelectItem key={timeout.value} value={timeout.value.toString()}>
                      {timeout.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected-status">Expected Status Code</Label>
            <Select
              value={formData.expected_status.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, expected_status: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_CODES.map((status) => (
                  <SelectItem key={status.value} value={status.value.toString()}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="follow-redirects"
                checked={formData.follow_redirects}
                onChange={(e) => setFormData(prev => ({ ...prev, follow_redirects: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="follow-redirects" className="text-sm font-normal">
                Follow redirects
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="check-ssl"
                checked={formData.check_ssl}
                onChange={(e) => setFormData(prev => ({ ...prev, check_ssl: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="check-ssl" className="text-sm font-normal">
                Verify SSL certificate
              </Label>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isValidUrl}
          >
            {isSubmitting ? 'Saving...' : bookmark ? 'Update Bookmark' : 'Add Bookmark'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}