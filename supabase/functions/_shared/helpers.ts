import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';

export interface PoliteRequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

const USER_AGENT = 'LocalGovWatch/1.0 (+https://localgov.watch/about)';
const DEFAULT_TIMEOUT = 10000;
const RETRY_DELAYS = [1000, 2000, 4000];

export async function politeFetch(url: string, options: PoliteRequestOptions = {}): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, retries = 3, ...fetchOptions } = options;
  
  const headers = {
    'User-Agent': USER_AGENT,
    ...options.headers,
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      if (response.status === 429 || response.status >= 500) {
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
          continue;
        }
      }

      return response;
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
    }
  }

  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

export async function loadHTML(html: string) {
  return cheerio.load(html);
}

export function safeText(str: string | null | undefined): string {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ');
}

export function normalizeDate(dateStr: string, timezone = 'America/Chicago'): Date | null {
  if (!dateStr) return null;
  try {
    // Simple date parsing - in production you'd use a proper date library
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export function docHash(content: string): string {
  // Simple hash function for deduplication
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function createExternalId(parts: (string | number | Date | null | undefined)[]): string {
  const cleaned = parts
    .filter(p => p != null)
    .map(p => {
      if (p instanceof Date) {
        return p.toISOString().split('T')[0];
      }
      return String(p);
    })
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return cleaned || docHash(parts.join(''));
}

export interface IngestStats {
  newCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  pdfsProcessed: number;
  aiTokensUsed: number;
  errors: string[];
}

export function createIngestStats(): IngestStats {
  return {
    newCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    pdfsProcessed: 0,
    aiTokensUsed: 0,
    errors: [],
  };
}

export function addError(stats: IngestStats, error: string, maxErrors = 10) {
  stats.errorCount++;
  if (stats.errors.length < maxErrors) {
    stats.errors.push(error);
  }
}

export async function extractPdfText(pdfUrl: string): Promise<string | null> {
  try {
    // Check PDF size first
    const headResponse = await politeFetch(pdfUrl, { method: 'HEAD' });
    const contentLength = headResponse.headers.get('content-length');
    const maxBytes = (parseInt(Deno.env.get('PDF_MAX_MB') || '15')) * 1024 * 1024;
    
    if (contentLength && parseInt(contentLength) > maxBytes) {
      console.warn(`Skipping large PDF: ${pdfUrl} (${contentLength} bytes)`);
      return null;
    }

    // For now, return a placeholder - actual PDF parsing would require additional setup
    // In production, you'd use a PDF parsing service or library
    console.log(`PDF extraction not yet implemented for: ${pdfUrl}`);
    return `[PDF content from ${pdfUrl}]`;
  } catch (error) {
    console.error(`Failed to extract PDF text from ${pdfUrl}:`, error);
    return null;
  }
}

export function extractKeywordTags(text: string): string[] {
  const KEYWORD_TAG_MAP: Record<string, string[]> = {
    'zoning': ['zoning', 'land use', 'platting', 'variance', 'rezoning'],
    'short-term-rentals': ['short-term rental', 'STR', 'airbnb', 'vacation rental'],
    'budget': ['budget', 'appropriation', 'general fund', 'fiscal'],
    'water': ['water', 'drought', 'conservation', 'wastewater'],
    'transportation': ['transit', 'bus', 'rail', 'traffic', 'mobility', 'road'],
    'housing': ['housing', 'affordable', 'homeless', 'shelter'],
    'environment': ['environment', 'climate', 'sustainability', 'green', 'pollution'],
    'parks': ['park', 'recreation', 'trail', 'greenspace'],
    'police': ['police', 'public safety', 'crime', 'enforcement'],
    'fire': ['fire', 'emergency', 'EMS'],
    'taxes': ['tax', 'property tax', 'rate', 'levy'],
  };

  const lowerText = text.toLowerCase();
  const tags: string[] = [];

  for (const [tag, keywords] of Object.entries(KEYWORD_TAG_MAP)) {
    if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      tags.push(tag);
    }
  }

  return tags;
}
