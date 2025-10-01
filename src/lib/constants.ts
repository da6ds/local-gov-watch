export const JURISDICTIONS = [
  { value: 'austin-tx', label: 'Austin, TX', type: 'city' },
  { value: 'travis-county-tx', label: 'Travis County, TX', type: 'county' },
  { value: 'texas', label: 'Texas', type: 'state' },
] as const;

export const LEGISLATION_STATUSES = [
  { value: 'introduced', label: 'Introduced', color: 'blue' },
  { value: 'passed', label: 'Passed', color: 'green' },
  { value: 'effective', label: 'Effective', color: 'emerald' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'red' },
  { value: 'pending', label: 'Pending', color: 'amber' },
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
};