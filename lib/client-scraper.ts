/**
 * Client-side HTML parser and cleaner
 * Replaces the server-side scraping logic to keep everything local
 */

export function cleanAndFormatHtml(html: string): string {
  // Enhanced text extraction with formatting preservation
  let cleanedHtml = html
    // Remove script, style, and non-content tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove navigation, headers, footers, and sidebars
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')

  // Convert HTML to formatted text while preserving structure
  const text = cleanedHtml
    // Preserve headings with clear formatting
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n## $1 ##\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n# $1 #\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n** $1 **\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n\n* $1 *\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n\n$1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n\n$1\n\n')
    // Preserve paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n')
    // Preserve line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Preserve lists with bullet points
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    // Preserve strong/bold and emphasis
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Convert links to readable format
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&euro;/g, '€')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    // Clean up whitespace while preserving intentional line breaks
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim()

  return text.substring(0, 50000) // Limit length
}

