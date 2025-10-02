export const JURISDICTIONS = [
  { value: 'austin-tx', label: 'Austin, TX', type: 'city' },
  { value: 'travis-county-tx', label: 'Travis County, TX', type: 'county' },
  { value: 'texas', label: 'Texas', type: 'state' },
] as const;

export const LEGISLATION_STATUSES = [
  { value: 'introduced', label: 'Introduced', color: 'blue' },
  { value: 'in_committee', label: 'In Committee', color: 'yellow' },
  { value: 'first_reading', label: 'First Reading', color: 'orange' },
  { value: 'second_reading', label: 'Second Reading', color: 'orange' },
  { value: 'passed', label: 'Passed', color: 'green' },
  { value: 'failed', label: 'Failed', color: 'red' },
  { value: 'effective', label: 'Effective', color: 'emerald' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'red' },
  { value: 'pending', label: 'Pending', color: 'amber' },
] as const;

export const LEGISLATION_TIMELINE_STAGES = [
  { key: 'introduced', label: 'Introduced' },
  { key: 'in_committee', label: 'In Committee' },
  { key: 'first_reading', label: 'First Reading' },
  { key: 'second_reading', label: 'Second Reading' },
  { key: 'passed', label: 'Passed' },
  { key: 'effective', label: 'Effective' },
] as const;

export const ELECTION_KINDS = [
  { value: 'general', label: 'General Election' },
  { value: 'primary', label: 'Primary Election' },
  { value: 'runoff', label: 'Runoff Election' },
  { value: 'special', label: 'Special Election' },
] as const;

export const SOURCE_KINDS = [
  { value: 'meetings', label: 'Meetings' },
  { value: 'ordinances', label: 'Ordinances' },
  { value: 'elections', label: 'Elections' },
  { value: 'rss', label: 'RSS Feed' },
  { value: 'docs', label: 'Documents' },
] as const;

export const KEYWORD_TAG_MAP: Record<string, string[]> = {
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

// Export alias for digest settings page
export const TOPIC_KEYWORDS = KEYWORD_TAG_MAP;