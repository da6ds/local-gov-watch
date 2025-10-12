export interface AgendaLegislation {
  type: 'ordinance' | 'resolution' | 'item';
  number: string;
  title: string;
  status: 'introduced' | 'public_hearing' | 'passed' | 'continued' | 'tabled';
  action_taken?: string;
}

/**
 * Extract legislation items (ordinances, resolutions) from agenda PDF text
 * Supports common formats from California city/county meetings
 */
export function extractLegislationFromAgenda(
  agendaText: string
): AgendaLegislation[] {
  if (!agendaText) return [];
  
  const legislation: AgendaLegislation[] = [];
  
  // Pattern 1: "Ordinance No. 2025-001" or "Ordinance 2025-001" with optional title
  const ordinancePattern = /Ordinance\s+(?:No\.?)?\s*(\d{4}[-_]\d+|\d+)(?:[:\s-]+)?([^\n\r]{10,200})?/gi;
  
  // Pattern 2: "Resolution No. 2025-R-15" or "Resolution 2025-15"  
  const resolutionPattern = /Resolution\s+(?:No\.?)?\s*([\w-]+)(?:[:\s-]+)?([^\n\r]{10,200})?/gi;
  
  // Extract ordinances
  let match;
  while ((match = ordinancePattern.exec(agendaText)) !== null) {
    const number = match[1];
    const title = match[2]?.trim() || `Ordinance ${number}`;
    
    // Skip if title looks like noise (too many special chars)
    if (title && title.replace(/[a-zA-Z0-9\s]/g, '').length > title.length / 3) {
      continue;
    }
    
    legislation.push({
      type: 'ordinance',
      number: number,
      title: cleanTitle(title),
      status: deriveStatusFromContext(agendaText, match.index),
    });
  }
  
  // Extract resolutions
  while ((match = resolutionPattern.exec(agendaText)) !== null) {
    const number = match[1];
    const title = match[2]?.trim() || `Resolution ${number}`;
    
    // Skip if title looks like noise
    if (title && title.replace(/[a-zA-Z0-9\s]/g, '').length > title.length / 3) {
      continue;
    }
    
    legislation.push({
      type: 'resolution',
      number: number,
      title: cleanTitle(title),
      status: deriveStatusFromContext(agendaText, match.index),
    });
  }
  
  return legislation;
}

function cleanTitle(title: string): string {
  // Remove common prefixes
  title = title.replace(/^(An|A|The)\s+/i, '');
  
  // Remove trailing punctuation except periods
  title = title.replace(/[,;:\-_]+$/, '');
  
  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }
  
  return title.trim();
}

function deriveStatusFromContext(text: string, matchIndex: number): AgendaLegislation['status'] {
  // Look at surrounding text (500 chars before and after match)
  const start = Math.max(0, matchIndex - 250);
  const end = Math.min(text.length, matchIndex + 500);
  const context = text.substring(start, end).toLowerCase();
  
  // Check for passage indicators
  if (context.includes('approved') || 
      context.includes('adopted') || 
      context.includes('passed') ||
      context.includes('enacted')) {
    return 'passed';
  }
  
  // Check for continuation
  if (context.includes('continued') || 
      context.includes('postponed') ||
      context.includes('deferred')) {
    return 'continued';
  }
  
  // Check for tabled
  if (context.includes('tabled') || 
      context.includes('withdrawn')) {
    return 'tabled';
  }
  
  // Check for public hearing
  if (context.includes('public hearing') ||
      context.includes('hearing scheduled')) {
    return 'public_hearing';
  }
  
  // Default to introduced if on agenda but no action indicated
  return 'introduced';
}
