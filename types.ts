export interface ScriptAnalysis {
  tone: string;
  targetAudience: string;
  pacing: string;
  keyThemes: string[];
  strengths: string[];
  writingStyle: string;
}

export interface TopicRecommendation {
  title: string;
  premise: string;
  reason: string;
  viralityScore: number;
}

export enum AppStep {
  INPUT = 'INPUT',
  ANALYZING = 'ANALYZING',
  TOPICS = 'TOPICS',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT'
}

export interface GeneratedScript {
  title: string;
  content: string;
}
