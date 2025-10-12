export interface TrendingTopic {
  keyword: string;
  count: number;
  percentage: number;
  relatedItemCount: number;
}

/**
 * Common words to exclude from trending analysis
 */
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which',
  'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
  'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good',
  'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now',
  'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
  'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
  'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give',
  'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had',
  'were', 'said', 'did', 'having', 'may', 'should', 'am', 'being',
  // Domain-specific stop words
  'ordinance', 'resolution', 'city', 'council', 'meeting', 'agenda',
  'minutes', 'section', 'shall', 'code', 'chapter', 'article',
  'bill', 'act', 'law', 'county', 'state', 'public', 'government',
  'general', 'related', 'regarding', 'concerning'
]);

/**
 * Extract keywords from text
 */
const extractKeywords = (text: string): string[] => {
  if (!text) return [];
  
  // Convert to lowercase and remove special characters
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split into words
  const words = cleaned.split(' ');
  
  // Filter out stop words and short words
  const keywords = words.filter(word => 
    word.length > 3 && 
    !STOP_WORDS.has(word) &&
    !/^\d+$/.test(word) // exclude pure numbers
  );
  
  // Also extract 2-word phrases
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (
      !STOP_WORDS.has(words[i]) && 
      !STOP_WORDS.has(words[i + 1]) &&
      words[i].length > 3 && 
      words[i + 1].length > 3
    ) {
      phrases.push(phrase);
    }
  }
  
  return [...keywords, ...phrases];
};

/**
 * Analyze legislation to find trending topics
 */
export const analyzeTrendingTopicsFromLegislation = <T extends {
  title: string;
  summary?: string | null;
  tags?: string[] | null;
}>(
  items: T[],
  limit: number = 10
): TrendingTopic[] => {
  const keywordCounts = new Map<string, number>();
  const totalItems = items.length;
  
  if (totalItems === 0) return [];
  
  // Count keyword occurrences
  items.forEach(item => {
    const text = `${item.title} ${item.summary || ''} ${item.tags?.join(' ') || ''}`;
    const keywords = extractKeywords(text);
    
    // Count unique keywords per item (avoid double-counting)
    const uniqueKeywords = new Set(keywords);
    uniqueKeywords.forEach(keyword => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });
  });
  
  // Convert to array and sort by count
  const trending = Array.from(keywordCounts.entries())
    .map(([keyword, count]) => ({
      keyword,
      count,
      percentage: (count / totalItems) * 100,
      relatedItemCount: count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  
  return trending;
};

/**
 * Analyze meetings to find trending topics
 */
export const analyzeTrendingTopicsFromMeetings = <T extends {
  title: string;
  body_name?: string | null;
  ai_summary?: string | null;
}>(
  items: T[],
  limit: number = 10
): TrendingTopic[] => {
  const keywordCounts = new Map<string, number>();
  const totalItems = items.length;
  
  if (totalItems === 0) return [];
  
  items.forEach(item => {
    const text = `${item.title} ${item.body_name || ''} ${item.ai_summary || ''}`;
    const keywords = extractKeywords(text);
    
    const uniqueKeywords = new Set(keywords);
    uniqueKeywords.forEach(keyword => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });
  });
  
  const trending = Array.from(keywordCounts.entries())
    .map(([keyword, count]) => ({
      keyword,
      count,
      percentage: (count / totalItems) * 100,
      relatedItemCount: count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  
  return trending;
};

/**
 * Combine trending topics from legislation and meetings
 */
export const analyzeCombinedTrendingTopics = <
  L extends { title: string; summary?: string | null; tags?: string[] | null },
  M extends { title: string; body_name?: string | null; ai_summary?: string | null }
>(
  legislation: L[],
  meetings: M[],
  limit: number = 10
): TrendingTopic[] => {
  const keywordCounts = new Map<string, number>();
  const allItems = [...legislation, ...meetings];
  const totalItems = allItems.length;
  
  if (totalItems === 0) return [];
  
  // Analyze legislation
  legislation.forEach(item => {
    const text = `${item.title} ${item.summary || ''} ${item.tags?.join(' ') || ''}`;
    const keywords = extractKeywords(text);
    const uniqueKeywords = new Set(keywords);
    uniqueKeywords.forEach(keyword => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });
  });
  
  // Analyze meetings
  meetings.forEach(item => {
    const text = `${item.title} ${item.body_name || ''} ${item.ai_summary || ''}`;
    const keywords = extractKeywords(text);
    const uniqueKeywords = new Set(keywords);
    uniqueKeywords.forEach(keyword => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });
  });
  
  const trending = Array.from(keywordCounts.entries())
    .map(([keyword, count]) => ({
      keyword,
      count,
      percentage: (count / totalItems) * 100,
      relatedItemCount: count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  
  return trending;
};
