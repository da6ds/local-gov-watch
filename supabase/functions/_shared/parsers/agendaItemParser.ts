export interface AgendaLegislation {
  type: 'ordinance' | 'resolution' | 'item';
  number: string;
  title: string;
  author?: string;
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
  
  // Balanced patterns - not too strict, not too loose
  const ordinancePatterns = [
    // Format: "Ordinance No. 2025-001" or "Ordinance 2025-001" (year-based)
    /Ordinance\s+(?:No\.?|Number|#)?\s*(\d{4}[-_]\d+)\s*[:\-–—]?\s*([^\n\r]{15,250})?/gi,
    // Format: "Ord. No. 123" (short number)
    /Ord(?:inance)?\s+(?:No\.?|Number|#)?\s*(\d{3,6})\s*[:\-–—]?\s*([^\n\r]{15,250})?/gi,
  ];
  
  const resolutionPatterns = [
    // Format: "Resolution No. 2025-15" or "Resolution 95-0926" (year-based or hyphenated)
    /Resolution\s+(?:No\.?|Number|#)?\s*([\d]{2,4}[-_][\dA-Z]+)\s*[:\-–—]?\s*([^\n\r]{15,250})?/gi,
    // Format: "Res. No. 123" (short number)
    /Res(?:olution)?\s+(?:No\.?|Number|#)?\s*(\d{3,6})\s*[:\-–—]?\s*([^\n\r]{15,250})?/gi,
  ];
  
  // Extract ordinances using all patterns
  let totalOrdinanceMatches = 0;
  for (const pattern of ordinancePatterns) {
    let match;
    while ((match = pattern.exec(agendaText)) !== null) {
      totalOrdinanceMatches++;
      const number = match[1];
      let title = match[2]?.trim() || `Ordinance ${number}`;
      
      // Clean the title first
      title = cleanTitle(title);
      
      // Validate title quality - skip garbage
      if (!isValidLegislationTitle(title)) {
        console.log('❌ Skipping invalid ordinance:', number, title.substring(0, 60));
        continue;
      }
      
      const author = extractAuthorFromContext(agendaText, match.index);
      console.log('✓ Found ordinance:', number, title.substring(0, 50), author ? `by ${author}` : '');
      
      legislation.push({
        type: 'ordinance',
        number: number,
        title: title,
        author: author,
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
      let title = match[2]?.trim() || `Resolution ${number}`;
      
      // Clean the title first
      title = cleanTitle(title);
      
      // Validate title quality - skip garbage
      if (!isValidLegislationTitle(title)) {
        console.log('❌ Skipping invalid resolution:', number, title.substring(0, 60));
        continue;
      }
      
      const author = extractAuthorFromContext(agendaText, match.index);
      console.log('✓ Found resolution:', number, title.substring(0, 50), author ? `by ${author}` : '');
      
      legislation.push({
        type: 'resolution',
        number: number,
        title: title,
        author: author,
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

function isValidLegislationTitle(title: string): boolean {
  if (!title) return false;
  
  // Must be between 10-200 characters (after cleaning)
  if (title.length < 10 || title.length > 200) {
    return false;
  }
  
  // Must have at least some letters
  const letterCount = (title.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 8) {
    return false;
  }
  
  // Skip Spanish boilerplate (common in California agendas)
  const spanishBoilerplate = [
    'también pueden',
    'los miembros',
    'siguientes',
    'está disponible',
    'deben usar',
    'han adoptado',
    'es una entidad',
    'distritales también',
    'del condado de',
    'antes de la audiencia',
    'que hayan recibido',
    'para obtener',
    'la junta',
  ];
  
  const lowerTitle = title.toLowerCase();
  for (const phrase of spanishBoilerplate) {
    if (lowerTitle.includes(phrase)) {
      return false;
    }
  }
  
  // Skip if starts with common noise words/fragments
  if (/^(with|and|or|for|to|in|on|at|by|of|include|the amount|that|which)\s/i.test(title)) {
    return false;
  }
  
  // Skip if too many special characters (PDF noise)
  const specialChars = title.replace(/[a-zA-Z0-9\s]/g, '');
  if (specialChars.length > title.length / 3) {
    return false;
  }
  
  // Skip if it's mostly numbers (like "Resolution 95-0926" without title)
  const digitCount = (title.match(/\d/g) || []).length;
  if (digitCount > title.length / 2) {
    return false;
  }
  
  return true;
}

function cleanTitle(title: string): string {
  // Remove excessive whitespace and line breaks
  title = title.replace(/\s+/g, ' ').trim();
  
  // Remove common PDF artifacts
  title = title.replace(/\f/g, ''); // Form feed
  title = title.replace(/\r/g, ''); // Carriage return
  
  // Remove page numbers and headers
  title = title.replace(/Page \d+ of \d+/gi, '');
  title = title.replace(/^[\d\s]+/, ''); // Leading numbers/spaces
  
  // Remove common redundant prefixes
  title = title.replace(/^(?:An|A|The)\s+(?:Ordinance|Resolution)\s+/i, '');
  title = title.replace(/^to\s+/i, '');
  
  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }
  
  // Remove trailing punctuation except periods
  title = title.replace(/[,;:\-_]+$/, '');
  
  // Truncate if too long (max 200 chars)
  if (title.length > 200) {
    title = title.substring(0, 197) + '...';
  }
  
  return title.trim();
}

function extractAuthorFromContext(text: string, matchIndex: number): string | undefined {
  // Look at text around the match (500 chars before and after)
  const start = Math.max(0, matchIndex - 500);
  const end = Math.min(text.length, matchIndex + 500);
  const context = text.substring(start, end);
  
  // Common patterns for author/sponsor in agendas
  const authorPatterns = [
    // Standard author/sponsor formats
    /(?:Author|Sponsor|Introduced by|By):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /(?:Supervisor|Councilmember|Member)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*(?:Supervisor|Councilmember|District)/i,
    
    // California Board of Supervisors specific formats
    /District\s+\d+[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /Moved by\s+(?:Supervisor|Director|Member)\s+([A-Z][a-z]+)/i,
    /Presented by\s+(?:Supervisor|Director|Member)\s+([A-Z][a-z]+)/i,
  ];
  
  for (const pattern of authorPatterns) {
    const match = context.match(pattern);
    if (match && match[1]) {
      // Clean up the author name
      const name = match[1].trim();
      // Exclude common false positives
      const excludeList = ['Board', 'Council', 'Staff', 'Department', 'Committee', 'Clerk', 'Manager', 'Attorney'];
      if (!excludeList.some(exclude => name.includes(exclude))) {
        return name;
      }
    }
  }
  
  return undefined;
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
