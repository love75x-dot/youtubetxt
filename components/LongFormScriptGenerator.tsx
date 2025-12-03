import React, { useState } from 'react';
import { Film, Loader2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { generateLongFormScript } from '../services/geminiService';
import { LongFormScript } from '../types';

const LongFormScriptGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<LongFormScript | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const result = await generateLongFormScript(topic);
      setScript(result);
    } catch (error) {
      console.error('Long-form script generation failed:', error);
      alert('대본 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const copyAllSessions = () => {
    if (!script) return;
    const allText = `
# ${script.topic}

## SESSION 1 - 오프닝
${script.sessions.session1}

## SESSION 2 - 전개
${script.sessions.session2}

## SESSION 3 - 심화
${script.sessions.session3}

## SESSION 4 - 반전/확장
${script.sessions.session4}

## SESSION 5 - 결론
${script.sessions.session5}

---
## 부록

### 장면 지시
${script.appendix.sceneDirections}

### BGM/효과음 추천
${script.appendix.bgmRecommendations}

### 예상 소요 시간
${script.appendix.estimatedDuration}

### YouTube SEO
**제목 후보:**
${script.appendix.seoMetadata.titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

**설명:**
${script.appendix.seoMetadata.description}

**태그:**
${script.appendix.seoMetadata.tags.join(', ')}
    `.trim();
    
    copyToClipboard(allText, 'all');
  };

  const toggleSession = (sessionNum: number) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionNum)) {
      newExpanded.delete(sessionNum);
    } else {
      newExpanded.add(sessionNum);
    }
    setExpandedSessions(newExpanded);
  };

  const renderSession = (sessionNum: number, title: string, content: string, subtitle: string) => {
    const isExpanded = expandedSessions.has(sessionNum);
    
    return (
      <div key={sessionNum} className="bg-neutral-900 rounded-xl border border-neutral-600 overflow-hidden">
        <button
          onClick={() => toggleSession(sessionNum)}
          className="w-full p-5 flex items-center justify-between hover:bg-neutral-800 transition-colors"
        >
          <div className="text-left">
            <h3 className="text-lg font-bold text-white mb-1">SESSION {sessionNum} - {title}</h3>
            <p className="text-sm text-gray-400">{subtitle}</p>
          </div>
          {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
        </button>
        
        {isExpanded && (
          <div className="border-t border-neutral-600">
            <div className="p-6 bg-neutral-800">
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => copyToClipboard(content, `session${sessionNum}`)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm transition-colors"
                >
                  {copiedSection === `session${sessionNum}` ? <Check size={16} /> : <Copy size={16} />}
                  {copiedSection === `session${sessionNum}` ? '복사됨' : '복사'}
                </button>
              </div>
              <div className="whitespace-pre-wrap text-gray-100 leading-relaxed text-base">
                {content}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {!script && !isGenerating && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Film size={48} className="text-purple-400" />
                <h1 className="text-4xl font-bold text-white">롱폼 스크립트 생성기</h1>
              </div>
              <p className="text-gray-300 text-lg">
                17~20분 분량의 완성도 높은 유튜브 대본을 자동 생성합니다 (약 10,000자)
              </p>
            </div>

            <div className="bg-neutral-900 rounded-xl p-8 border border-neutral-700">
              <label className="block text-sm font-bold text-gray-300 mb-3">
                영상 주제를 입력하세요
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="예: 양자역학 쉽게 이해하기"
                className="w-full bg-neutral-950 border border-neutral-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none mb-4 text-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              />
              
              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Film size={24} />
                1만 자 대본 생성하기
              </button>
              
              <p className="text-xs text-gray-400 mt-3 text-center">
                생성에는 약 1~2분이 소요됩니다
              </p>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-6">
              <h3 className="font-bold text-blue-300 mb-3">생성되는 구조</h3>
              <ul className="space-y-2 text-sm text-blue-100">
                <li>• <strong>SESSION 1</strong> - 오프닝 (2,000자): 5초 Hook, 30초 Hook</li>
                <li>• <strong>SESSION 2</strong> - 전개 (2,600자): 문제 제기, 배경 설명</li>
                <li>• <strong>SESSION 3</strong> - 심화 (2,800자): 구체적 사례, 입체적 분석</li>
                <li>• <strong>SESSION 4</strong> - 반전/확장 (2,600자): 미드롤 Hook, 소프트 CTA</li>
                <li>• <strong>SESSION 5</strong> - 결론 (2,000자): 핵심 요약, FAQ, 최종 CTA</li>
                <li>• <strong>부록</strong> - 장면 지시, BGM 추천, YouTube SEO</li>
              </ul>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-purple-400 mb-6" size={64} />
            <h3 className="text-2xl font-bold text-white mb-2">1만 자 대본을 작성 중입니다...</h3>
            <p className="text-gray-400">약 1~2분 소요됩니다. 잠시만 기다려주세요.</p>
          </div>
        )}

        {script && !isGenerating && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-white">{script.topic}</h2>
              <button
                onClick={() => {
                  setScript(null);
                  setTopic('');
                }}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors"
              >
                새 주제 입력
              </button>
            </div>

            <button
              onClick={copyAllSessions}
              className="w-full bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {copiedSection === 'all' ? <Check size={20} /> : <Copy size={20} />}
              전체 대본 복사
            </button>

            <div className="space-y-4">
              {renderSession(1, '오프닝', script.sessions.session1, '5초 Hook, 30초 Hook 포함 - 2,000자')}
              {renderSession(2, '전개', script.sessions.session2, '문제 제기, 배경 설명 - 2,600자')}
              {renderSession(3, '심화', script.sessions.session3, '구체적 사례, 입체적 분석 - 2,800자')}
              {renderSession(4, '반전/확장', script.sessions.session4, '미드롤 Hook, 소프트 CTA - 2,600자')}
              {renderSession(5, '결론', script.sessions.session5, '핵심 요약, FAQ, 최종 CTA - 2,000자')}
            </div>

            {/* 부록 */}
            <div className="bg-neutral-900 rounded-xl border border-neutral-600 p-6 mt-8">
              <h3 className="text-2xl font-bold text-purple-300 mb-6">📎 부록 (Appendix)</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-lg text-white mb-2">🎬 장면 지시</h4>
                  <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{script.appendix.sceneDirections}</p>
                </div>

                <div>
                  <h4 className="font-bold text-lg text-white mb-2">🎵 BGM/효과음 추천</h4>
                  <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{script.appendix.bgmRecommendations}</p>
                </div>

                <div>
                  <h4 className="font-bold text-lg text-white mb-2">⏱️ 예상 소요 시간</h4>
                  <p className="text-gray-300 text-sm">{script.appendix.estimatedDuration}</p>
                </div>

                <div>
                  <h4 className="font-bold text-lg text-white mb-3">🔍 YouTube SEO</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 font-bold block mb-1">제목 후보</label>
                      {script.appendix.seoMetadata.titles.map((title, i) => (
                        <div key={i} className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 mb-2 text-white">
                          {i + 1}. {title}
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 font-bold block mb-1">설명</label>
                      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-gray-200 text-sm">
                        {script.appendix.seoMetadata.description}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 font-bold block mb-2">태그</label>
                      <div className="flex flex-wrap gap-2">
                        {script.appendix.seoMetadata.tags.map((tag, i) => (
                          <span key={i} className="bg-blue-900/30 border border-blue-700 text-blue-200 px-3 py-1 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LongFormScriptGenerator;
