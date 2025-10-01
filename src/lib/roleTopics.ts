// Role-based topic suggestions for onboarding
export const ROLE_TOPICS = {
  activist: {
    label: 'Activist',
    description: 'Community organizer focused on local change',
    defaultTopics: ['housing', 'environment', 'zoning', 'police', 'transportation'],
    icon: '✊'
  },
  government: {
    label: 'Government Staff',
    description: 'Public sector professional tracking policy',
    defaultTopics: ['budget', 'zoning', 'taxes', 'water', 'fire'],
    icon: '🏛️'
  },
  nonprofit: {
    label: 'Non-profit',
    description: 'Organization serving community needs',
    defaultTopics: ['housing', 'parks', 'water', 'environment', 'budget'],
    icon: '🤝'
  }
} as const;

export type UserRole = keyof typeof ROLE_TOPICS;
