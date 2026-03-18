export interface BookmarkItem {
  name: string;
  url: string;
  folder?: string;
  dateAdded?: Date;
  description?: string;
}

export interface ParsedBookmarks {
  bookmarks: BookmarkItem[];
  totalCount: number;
  folderCount: number;
  errors: string[];
}

/**
 * Parses Chrome/Edge bookmark export HTML files
 * These follow the Netscape bookmark format
 */
function parseChromeBookmarks(html: string): ParsedBookmarks {
  const bookmarks: BookmarkItem[] = [];
  const errors: string[] = [];
  let folderCount = 0;

  try {
    // Create a DOM parser to handle the HTML structure
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Chrome bookmarks use DT elements with A tags for links
    const linkElements = doc.querySelectorAll('dt a[href]');
    const folderElements = doc.querySelectorAll('dt > h3');
    
    folderCount = folderElements.length;

    linkElements.forEach((link) => {
      const url = link.getAttribute('href');
      const name = link.textContent?.trim();
      
      if (!url || !name) {
        errors.push(`Invalid bookmark entry found`);
        return;
      }

      // Try to determine the folder by traversing up the DOM
      let folder: string | undefined;
      let parent = link.parentElement;
      while (parent) {
        const folderHeader = parent.querySelector('h3');
        if (folderHeader && folderHeader.textContent) {
          folder = folderHeader.textContent.trim();
          break;
        }
        parent = parent.parentElement;
      }

      // Parse date if available
      let dateAdded: Date | undefined;
      const addDate = link.getAttribute('add_date');
      if (addDate) {
        // Chrome stores dates as Unix timestamps
        dateAdded = new Date(parseInt(addDate) * 1000);
      }

      bookmarks.push({
        name,
        url,
        folder,
        dateAdded,
      });
    });

  } catch (error) {
    errors.push(`Failed to parse Chrome bookmark format: ${error}`);
  }

  return {
    bookmarks,
    totalCount: bookmarks.length,
    folderCount,
    errors,
  };
}

/**
 * Parses Firefox bookmark export JSON files
 */
function parseFirefoxBookmarks(jsonString: string): ParsedBookmarks {
  const bookmarks: BookmarkItem[] = [];
  const errors: string[] = [];
  let folderCount = 0;

  try {
    const data = JSON.parse(jsonString);
    
    // Firefox bookmarks have a hierarchical structure
    function traverseFirefoxNode(node: any, currentFolder?: string) {
      if (!node) return;

      if (node.type === 'text/x-moz-place-container') {
        // This is a folder
        folderCount++;
        const folderName = node.title || 'Untitled Folder';
        
        if (node.children) {
          node.children.forEach((child: any) => {
            traverseFirefoxNode(child, folderName);
          });
        }
      } else if (node.type === 'text/x-moz-place' && node.uri) {
        // This is a bookmark
        if (!node.title || !node.uri) {
          errors.push('Invalid Firefox bookmark entry found');
          return;
        }

        let dateAdded: Date | undefined;
        if (node.dateAdded) {
          // Firefox stores dates as microseconds since Unix epoch
          dateAdded = new Date(node.dateAdded / 1000);
        }

        bookmarks.push({
          name: node.title,
          url: node.uri,
          folder: currentFolder,
          dateAdded,
        });
      }
    }

    // Start traversal from root
    traverseFirefoxNode(data);

  } catch (error) {
    errors.push(`Failed to parse Firefox bookmark format: ${error}`);
  }

  return {
    bookmarks,
    totalCount: bookmarks.length,
    folderCount,
    errors,
  };
}

/**
 * Parses Safari bookmark export plist files
 */
function parseSafariBookmarks(plistString: string): ParsedBookmarks {
  const bookmarks: BookmarkItem[] = [];
  const errors: string[] = [];
  let folderCount = 0;

  try {
    // Safari exports as XML plist format
    const parser = new DOMParser();
    const doc = parser.parseFromString(plistString, 'application/xml');
    
    // Look for dict elements that contain bookmark data
    const dictElements = doc.querySelectorAll('dict');
    
    dictElements.forEach((dict) => {
      const keys = dict.querySelectorAll('key');
      let isBookmark = false;
      let url = '';
      let title = '';
      let isFolder = false;

      keys.forEach((key, index) => {
        const keyText = key.textContent?.trim();
        const nextElement = key.nextElementSibling;
        
        if (keyText === 'WebBookmarkType' && nextElement?.textContent === 'WebBookmarkTypeLeaf') {
          isBookmark = true;
        } else if (keyText === 'WebBookmarkType' && nextElement?.textContent === 'WebBookmarkTypeList') {
          isFolder = true;
        } else if (keyText === 'URLString' && nextElement?.textContent) {
          url = nextElement.textContent.trim();
        } else if (keyText === 'URIDictionary') {
          const titleKey = nextElement?.querySelector('key[text()="title"]');
          if (titleKey?.nextElementSibling?.textContent) {
            title = titleKey.nextElementSibling.textContent.trim();
          }
        }
      });

      if (isFolder) {
        folderCount++;
      } else if (isBookmark && url && title) {
        bookmarks.push({
          name: title,
          url: url,
          folder: undefined, // Safari folder structure is complex, skip for now
        });
      }
    });

  } catch (error) {
    errors.push(`Failed to parse Safari bookmark format: ${error}`);
  }

  return {
    bookmarks,
    totalCount: bookmarks.length,
    folderCount,
    errors,
  };
}

/**
 * Detects bookmark file format and parses accordingly
 */
export function parseBookmarkFile(fileContent: string, fileName?: string): ParsedBookmarks {
  const content = fileContent.trim();
  
  // Try to detect format based on content structure
  if (content.startsWith('<!DOCTYPE NETSCAPE-Bookmark-file-1>') || 
      content.includes('<H3>') || 
      content.includes('DT><A HREF=')) {
    // Chrome/Edge HTML format
    return parseChromeBookmarks(content);
  } else if (content.startsWith('{') && content.includes('"type":"text/x-moz-place')) {
    // Firefox JSON format
    return parseFirefoxBookmarks(content);
  } else if (content.includes('<?xml') && content.includes('plist')) {
    // Safari plist format
    return parseSafariBookmarks(content);
  } else if (content.startsWith('{')) {
    // Try parsing as generic JSON first
    try {
      const data = JSON.parse(content);
      if (data.roots || data.children || Array.isArray(data)) {
        // Looks like Chrome JSON format (from chrome://bookmarks export)
        return parseFirefoxBookmarks(content);
      }
    } catch {
      // Not valid JSON, continue to HTML attempt
    }
  }

  // Fallback: try parsing as HTML (most common format)
  const htmlResult = parseChromeBookmarks(content);
  if (htmlResult.bookmarks.length > 0) {
    return htmlResult;
  }

  // If no format worked, return empty result with error
  return {
    bookmarks: [],
    totalCount: 0,
    folderCount: 0,
    errors: ['Unable to detect bookmark file format. Supported formats: Chrome/Edge HTML, Firefox JSON, Safari plist'],
  };
}

/**
 * Validates that URLs are properly formatted
 */
export function validateBookmarks(bookmarks: BookmarkItem[]): {
  valid: BookmarkItem[];
  invalid: Array<{ bookmark: BookmarkItem; reason: string }>;
} {
  const valid: BookmarkItem[] = [];
  const invalid: Array<{ bookmark: BookmarkItem; reason: string }> = [];

  bookmarks.forEach((bookmark) => {
    try {
      // Basic URL validation
      const url = new URL(bookmark.url);
      
      // Check for supported protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        invalid.push({
          bookmark,
          reason: `Unsupported protocol: ${url.protocol}`,
        });
        return;
      }

      // Check for valid hostname
      if (!url.hostname) {
        invalid.push({
          bookmark,
          reason: 'Invalid hostname',
        });
        return;
      }

      valid.push(bookmark);
    } catch (error) {
      invalid.push({
        bookmark,
        reason: 'Invalid URL format',
      });
    }
  });

  return { valid, invalid };
}

/**
 * Deduplicates bookmarks based on URL
 */
export function deduplicateBookmarks(bookmarks: BookmarkItem[]): {
  unique: BookmarkItem[];
  duplicates: BookmarkItem[];
} {
  const seen = new Set<string>();
  const unique: BookmarkItem[] = [];
  const duplicates: BookmarkItem[] = [];

  bookmarks.forEach((bookmark) => {
    // Normalize URL for comparison (remove trailing slash, convert to lowercase)
    const normalizedUrl = bookmark.url.toLowerCase().replace(/\/$/, '');
    
    if (seen.has(normalizedUrl)) {
      duplicates.push(bookmark);
    } else {
      seen.add(normalizedUrl);
      unique.push(bookmark);
    }
  });

  return { unique, duplicates };
}