import { GoogleGenAI, Type } from "@google/genai";
import { ScriptAnalysis, TopicRecommendation, HookScript, HookScriptRequest, ToneType, GeneratedScript, ScriptRefinementRequest, LongFormScript } from "../types";

// Helper to get API key from multiple sources
const getApiKey = (): string => {
  // Try environment variable first
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== 'your_api_key_here') {
    return envKey;
  }
  
  // Try localStorage
  const savedKey = localStorage.getItem('gemini_api_key');
  if (savedKey) {
    return savedKey;
  }
  
  throw new Error("API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file or enter it in the app");
};

// Helper to ensure we have a key (though app structure guarantees it via environment usually)
const getAI = () => {
  const apiKey = getApiKey();
  return new GoogleGenAI({ apiKey });
};

export const analyzeScript = async (scriptText: string): Promise<ScriptAnalysis> => {
  const ai = getAI();
  
  const prompt = `
    Analyze the following YouTube script text. 
    Identify the tone, target audience, pacing, key themes, strengths, and writing style.
    Return the result in Korean.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { text: prompt },
      { text: scriptText }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tone: { type: Type.STRING, description: "The overall mood (e.g., Humorous, Serious, Educational)" },
          targetAudience: { type: Type.STRING, description: "Who this video is for" },
          pacing: { type: Type.STRING, description: "Speed of delivery (Fast, Moderate, Slow)" },
          keyThemes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Main topics covered" },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "What makes this script good" },
          writingStyle: { type: Type.STRING, description: "Description of the writing style (e.g., First-person narrative, Data-driven)" }
        },
        required: ["tone", "targetAudience", "pacing", "keyThemes", "strengths", "writingStyle"]
      }
    }
  });

  if (!response.text) throw new Error("No analysis returned");
  return JSON.parse(response.text) as ScriptAnalysis;
};

export const generateTopics = async (analysis: ScriptAnalysis, count: number = 4): Promise<TopicRecommendation[]> => {
  const ai = getAI();

  const prompt = `
    Based on the following script analysis, suggest ${count} new, high-potential YouTube video topics.
    The topics should appeal to the same audience and maintain the identified style but cover fresh ground.
    Provide the output in Korean.
    
    Analysis Context:
    Tone: ${analysis.tone}
    Audience: ${analysis.targetAudience}
    Themes: ${analysis.keyThemes.join(", ")}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Catchy YouTube title" },
            premise: { type: Type.STRING, description: "One sentence summary of the video idea" },
            reason: { type: Type.STRING, description: "Why this topic fits the channel" },
            viralityScore: { type: Type.NUMBER, description: "Predicted potential score out of 100" }
          },
          required: ["title", "premise", "reason", "viralityScore"]
        }
      }
    }
  });

  if (!response.text) throw new Error("No topics returned");
  return JSON.parse(response.text) as TopicRecommendation[];
};

export const writeNewScript = async (topic: TopicRecommendation, analysis: ScriptAnalysis): Promise<GeneratedScript> => {
  const ai = getAI();

  // 롱폼 대본 생성 (17~20분용, 약 10,000자)
  const scriptPrompt = `
    당신은 Vrew 편집에 최적화된 유튜브 롱폼 내레이션 대본 생성기입니다.
    
    **역할 정의:**
    - 톤앤매너: ${analysis.tone}
    - 작성 스타일: ${analysis.writingStyle}
    - 타겟 시청자: ${analysis.targetAudience}
    - 목표: 17~20분 분량의 촬영용 대본 생성 (총 약 10,000자)
    
    **주제:** ${topic.title}
    **주제 설명:** ${topic.premise}
    
    **전체 구조 (5개 세션):**
    
    1. **[SESSION1] 오프닝 (2,000자)**
       - 5초 Hook: 강력한 첫 문장으로 시청자의 주의를 끌 것
       - 30초 Hook: 이 영상을 봐야 하는 이유 제시
       - 호기심을 자극하는 질문이나 반전 제시
       
    2. **[SESSION2] 전개 (2,600자)**
       - 문제 제기 및 배경 설명
       - 시청자와 공감대 형성
       - 왜 이 주제가 중요한지 설명
       
    3. **[SESSION3] 심화 (2,800자)**
       - 구체적인 사례 제시
       - 입체적 분석 및 다양한 관점 소개
       - 데이터나 연구 결과 인용 (필요시)
       
    4. **[SESSION4] 반전/확장 (2,600자)**
       - 미드롤 Hook: 시청 피로도를 깨는 반전 또는 새로운 정보
       - 소프트 CTA: "여기까지 유용하셨다면 좋아요 부탁드려요"
       - 주제의 확장 또는 실용적 적용
       
    5. **[SESSION5] 결론 (2,000자)**
       - 핵심 내용 요약
       - FAQ 2개 포함
       - 강력한 최종 CTA (구독 유도)
    
    **작성 규칙:**
    - 각 세션을 명확히 구분하여 작성
    - 문장은 짧게 끊어서 리듬감 있게 작성
    - 본문에는 오직 '내레이션 대사'만 작성 (지시문 없음)
    - 분석된 톤앤매너를 일관되게 유지
    - 자연스럽고 대화하듯이 작성
    
    마크다운 형식으로 SESSION을 구분하여 작성해주세요.
  `;

  const scriptResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: scriptPrompt,
  });

  if (!scriptResponse.text) throw new Error("No script generated");
  const scriptContent = scriptResponse.text;

  // YouTube 메타데이터 생성
  const metaPrompt = `
    다음 YouTube 비디오 대본을 바탕으로 최적화된 메타데이터를 생성해주세요.

    대본 주제: "${topic.title}"
    타겟 시청자: ${analysis.targetAudience}
    
    다음을 생성해주세요:
    1. YouTube 업로드용 제목 (40-60자, 클릭을 유도하는 제목, 검색량 많은 키워드 포함)
    2. YouTube 설명란 내용 (200-300자, 영상 요약 + 시청 유도 + 관련 키워드 포함)
    3. 해시태그 (5-8개, 검색량 많은 키워드 위주, # 포함)

    JSON 형식으로 응답해주세요.
  `;

  const metaResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: metaPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          youtubeTitle: { type: Type.STRING, description: "YouTube 업로드용 최적화된 제목" },
          youtubeDescription: { type: Type.STRING, description: "YouTube 설명란 내용" },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "해시태그 배열" }
        },
        required: ["youtubeTitle", "youtubeDescription", "hashtags"]
      }
    }
  });

  if (!metaResponse.text) throw new Error("No metadata generated");
  const metadata = JSON.parse(metaResponse.text);

  return {
    title: topic.title,
    content: scriptContent,
    youtubeTitle: metadata.youtubeTitle,
    youtubeDescription: metadata.youtubeDescription,
    hashtags: metadata.hashtags,
    topicId: `${topic.title}-${Date.now()}`
  };
};

const getToneDescription = (tone: ToneType): string => {
  switch (tone) {
    case ToneType.FRIENDLY:
      return "친근한 옆집 형/누나 같은 말투. 반말 사용, 공감과 위로 중심";
    case ToneType.PROFESSIONAL:
      return "논리적이고 전문적인 말투. 존댓말 사용, 데이터와 근거 중심";
    case ToneType.ENERGETIC:
      return "텐션 높은 예능 스타일. 과장된 표현, 리액션 중심, 빠른 템포";
  }
};

export const generate30SecondHook = async (request: HookScriptRequest): Promise<HookScript> => {
  const ai = getAI();
  
  const toneDesc = getToneDescription(request.tone);
  const keyPointsText = request.keyPoints && request.keyPoints.length > 0 
    ? `주요 포인트: ${request.keyPoints.join(', ')}` 
    : '';

  const prompt = `
    YouTube 비디오의 완전한 대본을 작성해주세요. 특히 첫 30초가 매우 중요합니다.

    주제: ${request.topic}
    타겟 시청자: ${request.targetAudience}
    톤앤매너: ${toneDesc}
    ${keyPointsText}

    **필수 구조:**

    1. **0-5초 (The Hook)**: 시청자의 호기심, 공포, 욕망을 강력하게 자극하는 한 문장
       - 예: "당신이 유튜브를 망치는 이유가 딱 하나 있습니다."
       
    2. **5-15초 (Retention)**: 이 영상을 끝까지 봐야 하는 명확한 이유와 이득 제시
       - 예: "이 영상 끝까지 보시면 조회수 2배로 올리는 법을 알게 됩니다."
       
    3. **15-30초 (Roadmap)**: 영상의 진행 순서를 간단히 요약하여 신뢰감 제공
       - 예: "오늘 딱 3가지 단계로 설명드릴게요."

    4. **본문 (Body)**: 3-4개의 핵심 포인트를 다룸
       - 각 챕터 전환 시 브릿지 멘트 필수 (예: "자, 첫 번째는 알겠죠? 그럼 이걸 어떻게 적용할까요?")
       - 선택한 톤앤매너를 처음부터 끝까지 일관되게 유지
       
    5. **중간 CTA (Mid-CTA)**: 본문 중간에 꿀팁을 준 직후 자연스럽게 좋아요/구독 요청
       - 예: "이 팁 진짜 유용하죠? 까먹기 전에 좋아요 한번 눌러주세요!"
       
    6. **엔딩 CTA (Ending-CTA)**: 영상 마무리에 구독과 다음 영상 시청 유도
       - 예: "구독하시면 다음 영상에서 더 강력한 팁 알려드릴게요!"

    **중요 규칙:**
    - 선택한 톤앤매너를 절대 바꾸지 말 것
    - 브릿지 멘트로 자연스럽게 연결할 것
    - CTA는 정해진 위치에만 배치할 것
    - 모든 내용은 한국어로 작성할 것

    JSON 형식으로 응답해주세요.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING, description: "영상 주제" },
          targetAudience: { type: Type.STRING, description: "타겟 시청자" },
          tone: { type: Type.STRING, description: "톤앤매너 타입" },
          hook_0_5: { type: Type.STRING, description: "0-5초: The Hook - 강력한 첫 문장" },
          retention_5_15: { type: Type.STRING, description: "5-15초: Retention - 시청 이유 제시" },
          roadmap_15_30: { type: Type.STRING, description: "15-30초: Roadmap - 영상 진행 순서" },
          body: { type: Type.STRING, description: "본문 - 브릿지 멘트 포함, 일관된 톤 유지" },
          midCTA: { type: Type.STRING, description: "중간 CTA - 자연스러운 좋아요/구독 요청" },
          endingCTA: { type: Type.STRING, description: "엔딩 CTA - 구독 및 다음 영상 유도" }
        },
        required: ["topic", "targetAudience", "tone", "hook_0_5", "retention_5_15", "roadmap_15_30", "body", "midCTA", "endingCTA"]
      }
    }
  });

  if (!response.text) throw new Error("No hook script generated");
  return JSON.parse(response.text) as HookScript;
};

export const refineScript = async (request: ScriptRefinementRequest): Promise<string> => {
  const ai = getAI();

  const prompt = `
    다음 YouTube 대본을 사용자의 요청에 따라 수정해주세요.

    **현재 대본:**
    ${request.currentScript}

    **사용자 수정 요청:**
    ${request.instruction}

    **수정 규칙:**
    - 사용자의 요청을 정확히 반영할 것
    - 기존 대본의 30초 룰 구조([0-5초], [5-15초], [15-30초])는 유지할 것
    - 톤앤매너 변경 요청이 있으면 전체적으로 일관되게 적용할 것
    - 분량 조절 요청 시 핵심 내용은 유지하면서 조정할 것
    - 수정된 대본을 마크다운 형식으로 작성할 것

    수정된 대본만 출력해주세요.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  if (!response.text) throw new Error("No refined script generated");
  return response.text;
};

export const generateLongFormScript = async (topic: string): Promise<LongFormScript> => {
  const ai = getAI();

  const prompt = `
    당신은 Vrew 편집에 최적화된 유튜브 롱폼 내레이션 대본 생성기입니다.
    
    **역할 정의:**
    - 톤앤매너: 친근하고 설명 위주, 1인 진행자 시점
    - 목표: 17~20분 분량의 촬영용 대본 생성 (총 약 10,000자)
    
    **주제:** ${topic}
    
    **전체 구조 (5개 세션):**
    
    1. **[SESSION1] 오프닝 (2,000자)**
       - 5초 Hook: 강력한 첫 문장으로 시청자의 주의를 끌 것
       - 30초 Hook: 이 영상을 봐야 하는 이유 제시
       - 호기심을 자극하는 질문이나 반전 제시
       
    2. **[SESSION2] 전개 (2,600자)**
       - 문제 제기 및 배경 설명
       - 시청자와 공감대 형성
       - 왜 이 주제가 중요한지 설명
       
    3. **[SESSION3] 심화 (2,800자)**
       - 구체적인 사례 제시
       - 입체적 분석 및 다양한 관점 소개
       - 데이터나 연구 결과 인용 (필요시)
       
    4. **[SESSION4] 반전/확장 (2,600자)**
       - 미드롤 Hook: 시청 피로도를 깨는 반전 또는 새로운 정보
       - 소프트 CTA: "여기까지 유용하셨다면 좋아요 부탁드려요"
       - 주제의 확장 또는 실용적 적용
       
    5. **[SESSION5] 결론 (2,000자)**
       - 핵심 내용 요약
       - FAQ 2개 포함
       - 강력한 최종 CTA (구독 유도)
    
    **작성 규칙:**
    - 각 세션은 독립적인 블록으로 작성
    - 문장은 짧게 끊어서 리듬감 있게 작성
    - 본문에는 오직 '내레이션 대사'만 작성 (지시문 없음)
    - 자연스럽고 대화하듯이 작성
    
    **부록(Appendix) 포함:**
    - 세션별 장면 지시 (이미지/자막 가이드)
    - 추천 BGM/효과음
    - 예상 소요 시간
    - YouTube SEO (제목 3개, 설명, 태그)
    
    JSON 형식으로 응답해주세요.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          sessions: {
            type: Type.OBJECT,
            properties: {
              session1: { type: Type.STRING, description: "오프닝 2,000자" },
              session2: { type: Type.STRING, description: "전개 2,600자" },
              session3: { type: Type.STRING, description: "심화 2,800자" },
              session4: { type: Type.STRING, description: "반전/확장 2,600자" },
              session5: { type: Type.STRING, description: "결론 2,000자" }
            },
            required: ["session1", "session2", "session3", "session4", "session5"]
          },
          appendix: {
            type: Type.OBJECT,
            properties: {
              sceneDirections: { type: Type.STRING, description: "세션별 장면 지시" },
              bgmRecommendations: { type: Type.STRING, description: "BGM/효과음 추천" },
              estimatedDuration: { type: Type.STRING, description: "예상 소요 시간" },
              seoMetadata: {
                type: Type.OBJECT,
                properties: {
                  titles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "제목 3개" },
                  description: { type: Type.STRING, description: "YouTube 설명" },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "태그" }
                },
                required: ["titles", "description", "tags"]
              }
            },
            required: ["sceneDirections", "bgmRecommendations", "estimatedDuration", "seoMetadata"]
          }
        },
        required: ["topic", "sessions", "appendix"]
      }
    }
  });

  if (!response.text) throw new Error("No long-form script generated");
  return JSON.parse(response.text) as LongFormScript;
};

export const convertToShortForm = async (longFormScript: string): Promise<string> => {
  const ai = getAI();

  const prompt = `
    다음 롱폼 유튜브 대본을 숏폼(Shorts/릴스)용으로 변환해주세요.

    **원본 롱폼 대본:**
    ${longFormScript}

    **숏폼 변환 규칙:**
    1. 길이: 30~60초 분량 (약 150~300자)
    2. 구조:
       - 첫 3초: 강력한 Hook (시선 사로잡기)
       - 중간: 핵심 메시지 1~2개만 전달
       - 마지막: 빠른 CTA 또는 임팩트 있는 마무리
    
    3. 특징:
       - 불필요한 설명 모두 제거
       - 짧고 강렬한 문장 사용
       - 템포가 빠르고 리듬감 있게
       - 롱폼의 가장 흥미로운 부분만 추출
       - 시청자가 멈추지 않고 끝까지 보도록 유도
    
    4. 톤:
       - 원본의 톤앤매너는 유지하되 더 강렬하게
       - 에너지가 높고 다이나믹하게
    
    **중요:** 롱폼 대본의 핵심 메시지를 유지하면서 숏폼에 최적화된 형태로 변환하세요.
    
    숏폼 대본만 출력해주세요 (마크다운 형식).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  if (!response.text) throw new Error("No short-form script generated");
  return response.text;
};

