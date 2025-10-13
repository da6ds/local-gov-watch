/**
 * Determine meeting type based on body name
 */
export function determineMeetingType(bodyName: string): {
  meetingType: 'city_council' | 'board_of_supervisors' | 'committee' | 'commission' | 'authority';
  isLegislative: boolean;
} {
  const lowerBody = bodyName.toLowerCase();
  
  // City Councils - Legislative
  if (lowerBody.includes('city council')) {
    return { meetingType: 'city_council', isLegislative: true };
  }
  
  // Board of Supervisors / Commissioners Court - Legislative
  if (lowerBody.includes('board of supervisors') || lowerBody.includes('commissioners court')) {
    return { meetingType: 'board_of_supervisors', isLegislative: true };
  }
  
  // Authorities - Advisory
  if (lowerBody.includes('authority')) {
    return { meetingType: 'authority', isLegislative: false };
  }
  
  // Commissions - Advisory
  if (lowerBody.includes('commission')) {
    return { meetingType: 'commission', isLegislative: false };
  }
  
  // Committees - Advisory (default for everything else)
  return { meetingType: 'committee', isLegislative: false };
}
