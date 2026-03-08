export type PageType = 'personal' | 'company';

export type PublicPageSummary = {
  url: string;
  pageType: PageType;
  displayName: string;
  headlineOrTagline: string;
  about: string;
  recentPosts: string[];
  metadataHints: string[];
  visibleEmployeeCount?: number | null;
  avgVisiblePostInteractions?: number | null;
  fetchQuality: 'full' | 'partial';
  troubleshooting: string[];
};

export type AnalysisPayload = {
  summary: PublicPageSummary;
  pageRecommendations: string[];
  contentRecommendations: string[];
};
