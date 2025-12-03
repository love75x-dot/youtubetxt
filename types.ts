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
  youtubeTitle?: string;
  youtubeDescription?: string;
  hashtags?: string[];
  topicId?: string; // 주제 식별을 위한 ID
}

export interface ScriptRefinementRequest {
  currentScript: string;
  instruction: string; // 사용자의 수정 요청
}

export enum ToneType {
  FRIENDLY = 'FRIENDLY',
  PROFESSIONAL = 'PROFESSIONAL',
  ENERGETIC = 'ENERGETIC'
}

export interface HookScript {
  topic: string;
  targetAudience: string;
  tone: ToneType;
  hook_0_5: string;        // 0-5초: The Hook
  retention_5_15: string;  // 5-15초: Retention
  roadmap_15_30: string;   // 15-30초: Roadmap
  body: string;            // 본문
  midCTA: string;          // 중간 CTA
  endingCTA: string;       // 엔딩 CTA
}

export interface HookScriptRequest {
  topic: string;
  targetAudience: string;
  tone: ToneType;
  keyPoints?: string[];
}

