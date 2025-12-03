import { GoogleGenAI, Type } from "@google/genai";
import { ScriptAnalysis, TopicRecommendation, HookScript, HookScriptRequest, ToneType, GeneratedScript, ScriptRefinementRequest } from "../types";

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

  const scriptPrompt = `
    YouTube 비디오의 완전한 대본을 작성해주세요. 특히 첫 30초가 매우 중요합니다.

    주제: "${topic.title}"
    타겟 시청자: ${analysis.targetAudience}
    작성 스타일: ${analysis.writingStyle}
    톤: ${analysis.tone}
    주제 설명: ${topic.premise}

    **필수 구조:**

    1. **[0-5초] The Hook**: 시청자의 호기심, 공포, 욕망을 강력하게 자극하는 한 문장
       - 예: "당신이 유튜브를 망치는 이유가 딱 하나 있습니다."
       
    2. **[5-15초] Retention**: 이 영상을 끝까지 봐야 하는 명확한 이유와 이득 제시
       - 예: "이 영상 끝까지 보시면 조회수 2배로 올리는 법을 알게 됩니다."
       
    3. **[15-30초] Roadmap**: 영상의 진행 순서를 간단히 요약하여 신뢰감 제공
       - 예: "오늘 딱 3가지 단계로 설명드릴게요."

    4. **본문 (Body)**: 3-4개의 핵심 포인트를 다룸
       - 각 챕터 전환 시 브릿지 멘트 필수 (예: "자, 첫 번째는 알겠죠? 그럼 이걸 어떻게 적용할까요?")
       - 분석된 톤앤매너를 처음부터 끝까지 일관되게 유지
       - [Visual Cue], [Sound Effect], (Host speaking) 같은 디렉션 포함
       
    5. **중간 CTA**: 본문 중간에 꿀팁을 준 직후 자연스럽게 좋아요/구독 요청
       - 예: "이 팁 진짜 유용하죠? 까먹기 전에 좋아요 한번 눌러주세요!"
       
    6. **엔딩 CTA & 결론**: 영상 마무리에 구독과 다음 영상 시청 유도
       - 예: "구독하시면 다음 영상에서 더 강력한 팁 알려드릴게요!"

    **중요 규칙:**
    - 분석된 톤앤매너를 절대 바꾸지 말 것
    - 브릿지 멘트로 자연스럽게 연결할 것
    - CTA는 정해진 위치에만 배치할 것
    - 모든 내용은 한국어로 작성할 것
    - 30초 구간은 반드시 [0-5초], [5-15초], [15-30초] 태그로 구분할 것

    대본을 마크다운 형식으로 작성해주세요.
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

