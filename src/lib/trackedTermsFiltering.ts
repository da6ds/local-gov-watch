/**
 * Check if text contains any of the tracked keywords
 * Uses case-insensitive matching
 */
export const matchesTrackedTerms = (
  text: string,
  keywords: string[]
): boolean => {
  if (keywords.length === 0) return true; // No filter active
  
  const lowerText = text.toLowerCase();
  
  return keywords.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
};

/**
 * Filter legislation by tracked keywords
 * Searches in: title, summary, tags
 */
export const filterLegislationByTrackedTerms = <T extends {
  title: string;
  summary?: string | null;
  tags?: string[] | null;
}>(
  items: T[],
  keywords: string[]
): T[] => {
  if (keywords.length === 0) return items;
  
  return items.filter(item => {
    // Search in title
    if (matchesTrackedTerms(item.title, keywords)) return true;
    
    // Search in summary
    if (item.summary && matchesTrackedTerms(item.summary, keywords)) {
      return true;
    }
    
    // Search in tags
    if (item.tags && item.tags.length > 0) {
      const tagsText = item.tags.join(' ');
      if (matchesTrackedTerms(tagsText, keywords)) {
        return true;
      }
    }
    
    return false;
  });
};

/**
 * Filter meetings by tracked keywords
 * Searches in: title, body_name
 */
export const filterMeetingsByTrackedTerms = <T extends {
  title: string;
  body_name?: string | null;
}>(
  items: T[],
  keywords: string[]
): T[] => {
  if (keywords.length === 0) return items;
  
  return items.filter(item => {
    // Search in title
    if (matchesTrackedTerms(item.title, keywords)) return true;
    
    // Search in body name
    if (item.body_name && matchesTrackedTerms(item.body_name, keywords)) {
      return true;
    }
    
    return false;
  });
};
