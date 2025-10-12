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
  if (!agendaText) {
    console.log('⚠️ AGENDA EXTRACTION: No text provided');
    return [];
  }
  
  console.log('=== AGENDA TEXT DEBUG ===');
  console.log('Text length:', agendaText.length);
  console.log('First 500 chars:', agendaText.substring(0, 500));
  console.log('Last 500 chars:', agendaText.substring(agendaText.length - 500));
  
  // Check if text contains any ordinance/resolution keywords
  const hasOrdinance = agendaText.toLowerCase().includes('ordinance');
  const hasResolution = agendaText.toLowerCase().includes('resolution');
  console.log('Contains "ordinance":', hasOrdinance);
  console.log('Contains "resolution":', hasResolution);
  
  // Show sample matches for debugging
  const ordinanceMentions = agendaText.match(/ordinance[^\n]{0,100}/gi) || [];
  console.log('Found ordinance mentions:', ordinanceMentions.length);
  if (ordinanceMentions.length > 0) {
    console.log('Sample ordinance text:', ordinanceMentions.slice(0, 3));
  }
  
  const resolutionMentions = agendaText.match(/resolution[^\n]{0,100}/gi) || [];
  console.log('Found resolution mentions:', resolutionMentions.length);
  if (resolutionMentions.length > 0) {
    console.log('Sample resolution text:', resolutionMentions.slice(0, 3));
  }
  
  const legislation: AgendaLegislation[] = [];
  
  // Multiple patterns to catch different formats
  const ordinancePatterns = [
    // "Ordinance No. 2025-001" or "Ordinance 2025-001"
    /Ordinance\s+(?:No\.?|Number|#)?\s*(\d{4}[-_]?\d+|\d+)(?:[:\s-]+)?([^\n\r]{10,200})?/gi,
    // "Ord. 2025-001" or "Ord 2025-001"
    /Ord\.?\s+(?:No\.?|#)?\s*(\d{4}[-_]?\d+|\d+)(?:[:\s-]+)?([^\n\r]{10,200})?/gi,
    // "2025-001 - Ordinance"
    /(\d{4}[-_]?\d+|\d+)\s*[-–—]\s*Ordinance[:\s]*([^\n\r]{10,200})?/gi,
  ];
  
  const resolutionPatterns = [
    // "Resolution No. 2025-R-15" or "Resolution 2025-15"
    /Resolution\s+(?:No\.?|Number|#)?\s*([\w-]+)(?:[:\s-]+)?([^\n\r]{10,200})?/gi,
    // "Res. 2025-15" or "Res 2025-15"
    /Res\.?\s+(?:No\.?|#)?\s*([\w-]+)(?:[:\s-]+)?([^\n\r]{10,200})?/gi,
    // "2025-R-15 - Resolution"
    /([\w-]+)\s*[-–—]\s*Resolution[:\s]*([^\n\r]{10,200})?/gi,
  ];
  
  // Extract ordinances using all patterns
  let totalOrdinanceMatches = 0;
  for (const pattern of ordinancePatterns) {
    let match;
    while ((match = pattern.exec(agendaText)) !== null) {
      totalOrdinanceMatches++;
      const number = match[1];
      const title = match[2]?.trim() || `Ordinance ${number}`;
      
      // Skip if title looks like noise (too many special chars)
      if (title && title.replace(/[a-zA-Z0-9\s]/g, '').length > title.length / 3) {
        console.log('Skipping noisy ordinance:', number, title.substring(0, 50));
        continue;
      }
      
      console.log('✓ Found ordinance:', number, title.substring(0, 50));
      
      legislation.push({
        type: 'ordinance',
        number: number,
        title: cleanTitle(title),
        status: deriveStatusFromContext(agendaText, match.index),
      });
    }
  }
  console.log('Total ordinance pattern matches:', totalOrdinanceMatches);
  
  // Extract resolutions using all patterns
  let totalResolutionMatches = 0;
  for (const pattern of resolutionPatterns) {
    let match;
    while ((match = pattern.exec(agendaText)) !== null) {
      totalResolutionMatches++;
      const number = match[1];
      const title = match[2]?.trim() || `Resolution ${number}`;
      
      // Skip if title looks like noise
      if (title && title.replace(/[a-zA-Z0-9\s]/g, '').length > title.length / 3) {
        console.log('Skipping noisy resolution:', number, title.substring(0, 50));
        continue;
      }
      
      console.log('✓ Found resolution:', number, title.substring(0, 50));
      
      legislation.push({
        type: 'resolution',
        number: number,
        title: cleanTitle(title),
        status: deriveStatusFromContext(agendaText, match.index),
      });
    }
  }
  console.log('Total resolution pattern matches:', totalResolutionMatches);
  
  console.log('=== EXTRACTION RESULTS ===');
  console.log('Extracted legislation items:', legislation.length);
  if (legislation.length > 0) {
    console.log('Sample items:', JSON.stringify(legislation.slice(0, 3), null, 2));
  }
  console.log('=== END AGENDA DEBUG ===');
  
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
