import React, { useState } from 'react';
import { Zap, Loader2, Copy, Check, Clock, Target, MessageCircle } from 'lucide-react';
import { generate30SecondHook } from '../services/geminiService';
import { HookScript, ToneType } from '../types';

const HookScriptGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState<ToneType>(ToneType.FRIENDLY);
  const [keyPoints, setKeyPoints] = useState<string[]>(['']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<HookScript | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleAddKeyPoint = () => {
    setKeyPoints([...keyPoints, '']);
  };

  const handleRemoveKeyPoint = (index: number) => {
    setKeyPoints(keyPoints.filter((_, i) => i !== index));
  };

  const handleKeyPointChange = (index: number, value: string) => {
    const newKeyPoints = [...keyPoints];
    newKeyPoints[index] = value;
    setKeyPoints(newKeyPoints);
  };

  const handleGenerate = async () => {
    if (!topic.trim() || !targetAudience.trim()) return;

    setIsGenerating(true);
    try {
      const filteredKeyPoints = keyPoints.filter(p => p.trim() !== '');
      const script = await generate30SecondHook({
        topic,
        targetAudience,
        tone,
        keyPoints: filteredKeyPoints.length > 0 ? filteredKeyPoints : undefined
      });
      setGeneratedScript(script);
    } catch (error) {
      console.error('Script generation failed:', error);
      alert('대본 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyFullScript = () => {
    if (!generatedScript) return;
    
    const fullText = `
📺 ${generatedScript.topic}

🎯 타겟: ${generatedScript.targetAudience}

⏱️ [0-5초] The Hook:
${generatedScript.hook_0_5}

⏱️ [5-15초] Retention:
${generatedScript.retention_5_15}

⏱️ [15-30초] Roadmap:
${generatedScript.roadmap_15_30}

📝 본문:
${generatedScript.body}

💬 중간 CTA:
${generatedScript.midCTA}

🎬 엔딩 CTA:
${generatedScript.endingCTA}
    `.trim();
    
    copyToClipboard(fullText, 'full');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* 왼쪽: 입력 영역 */}
          <div className="space-y-6">
            <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-700 sticky top-4">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Zap className="text-yellow-400" />
                30초 훅 스크립트 생성
              </h2>

              {/* 주제 입력 */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  영상 주제 *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="예: 유튜브 조회수 늘리는 법"
                  className="w-full bg-neutral-950 border border-neutral-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {/* 타겟 시청자 */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  타겟 시청자 *
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="예: 유튜브 초보 크리에이터"
                  className="w-full bg-neutral-950 border border-neutral-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {/* 톤앤매너 선택 */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-300 mb-3">
                  톤앤매너 선택 *
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => setTone(ToneType.FRIENDLY)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      tone === ToneType.FRIENDLY
                        ? 'border-purple-500 bg-purple-900/30'
                        : 'border-neutral-600 bg-neutral-800 hover:border-neutral-500'
                    }`}
                  >
                    <div className="font-bold mb-1">👋 친근한 옆집 형/누나</div>
                    <div className="text-sm text-gray-400">반말 사용, 공감과 위로 중심</div>
                  </button>

                  <button
                    onClick={() => setTone(ToneType.PROFESSIONAL)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      tone === ToneType.PROFESSIONAL
                        ? 'border-purple-500 bg-purple-900/30'
                        : 'border-neutral-600 bg-neutral-800 hover:border-neutral-500'
                    }`}
                  >
                    <div className="font-bold mb-1">💼 논리적인 전문가</div>
                    <div className="text-sm text-gray-400">존댓말 사용, 데이터와 근거 중심</div>
                  </button>

                  <button
                    onClick={() => setTone(ToneType.ENERGETIC)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      tone === ToneType.ENERGETIC
                        ? 'border-purple-500 bg-purple-900/30'
                        : 'border-neutral-600 bg-neutral-800 hover:border-neutral-500'
                    }`}
                  >
                    <div className="font-bold mb-1">⚡ 텐션 높은 예능</div>
                    <div className="text-sm text-gray-400">과장된 표현, 빠른 템포</div>
                  </button>
                </div>
              </div>

              {/* 핵심 포인트 (선택) */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  핵심 포인트 (선택)
                </label>
                {keyPoints.map((point, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => handleKeyPointChange(index, e.target.value)}
                      placeholder={`포인트 ${index + 1}`}
                      className="flex-1 bg-neutral-950 border border-neutral-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    />
                    {keyPoints.length > 1 && (
                      <button
                        onClick={() => handleRemoveKeyPoint(index)}
                        className="px-3 py-2 bg-red-900/30 border border-red-700 rounded-lg hover:bg-red-900/50 transition-all text-sm"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddKeyPoint}
                  className="mt-2 text-sm text-purple-400 hover:text-purple-300 underline"
                >
                  + 포인트 추가
                </button>
              </div>

              {/* 생성 버튼 */}
              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || !targetAudience.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    30초 훅 대본 생성하기
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 오른쪽: 결과 영역 */}
          <div className="space-y-4">
            {!generatedScript && !isGenerating && (
              <div className="bg-neutral-900 rounded-xl p-12 border border-neutral-700 text-center h-full flex flex-col items-center justify-center">
                <Target size={64} className="text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">대본이 여기에 표시됩니다</h3>
                <p className="text-gray-500">왼쪽 양식을 작성하고 생성 버튼을 눌러주세요</p>
              </div>
            )}

            {isGenerating && (
              <div className="bg-neutral-900 rounded-xl p-12 border border-neutral-700 text-center h-full flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-purple-400 mb-4" size={64} />
                <h3 className="text-xl font-bold text-white mb-2">AI가 대본을 작성하고 있습니다...</h3>
                <p className="text-gray-400">30초 룰에 맞춰 최적화된 대본을 생성 중입니다</p>
              </div>
            )}

            {generatedScript && !isGenerating && (
              <div className="space-y-4">
                {/* 전체 복사 버튼 */}
                <div className="flex justify-end">
                  <button
                    onClick={copyFullScript}
                    className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg transition-all font-medium"
                  >
                    {copiedSection === 'full' ? <Check size={18} /> : <Copy size={18} />}
                    전체 대본 복사
                  </button>
                </div>

                {/* 주제 & 타겟 */}
                <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-700">
                  <h3 className="font-bold text-lg mb-2">📺 {generatedScript.topic}</h3>
                  <p className="text-gray-400">🎯 타겟: {generatedScript.targetAudience}</p>
                </div>

                {/* 0-5초: The Hook */}
                <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-xl p-5 border-2 border-red-600">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Clock size={20} className="text-red-400" />
                      [0-5초] The Hook
                    </h3>
                    <button
                      onClick={() => copyToClipboard(generatedScript.hook_0_5, 'hook')}
                      className="text-sm flex items-center gap-1 text-gray-300 hover:text-white"
                    >
                      {copiedSection === 'hook' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-white leading-relaxed whitespace-pre-wrap">{generatedScript.hook_0_5}</p>
                </div>

                {/* 5-15초: Retention */}
                <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 rounded-xl p-5 border-2 border-yellow-600">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Clock size={20} className="text-yellow-400" />
                      [5-15초] Retention
                    </h3>
                    <button
                      onClick={() => copyToClipboard(generatedScript.retention_5_15, 'retention')}
                      className="text-sm flex items-center gap-1 text-gray-300 hover:text-white"
                    >
                      {copiedSection === 'retention' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-white leading-relaxed whitespace-pre-wrap">{generatedScript.retention_5_15}</p>
                </div>

                {/* 15-30초: Roadmap */}
                <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-5 border-2 border-blue-600">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Clock size={20} className="text-blue-400" />
                      [15-30초] Roadmap
                    </h3>
                    <button
                      onClick={() => copyToClipboard(generatedScript.roadmap_15_30, 'roadmap')}
                      className="text-sm flex items-center gap-1 text-gray-300 hover:text-white"
                    >
                      {copiedSection === 'roadmap' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-white leading-relaxed whitespace-pre-wrap">{generatedScript.roadmap_15_30}</p>
                </div>

                {/* 본문 */}
                <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <MessageCircle size={20} className="text-purple-400" />
                      본문
                    </h3>
                    <button
                      onClick={() => copyToClipboard(generatedScript.body, 'body')}
                      className="text-sm flex items-center gap-1 text-gray-300 hover:text-white"
                    >
                      {copiedSection === 'body' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{generatedScript.body}</p>
                </div>

                {/* 중간 CTA */}
                <div className="bg-green-900/30 rounded-xl p-5 border border-green-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg">💬 중간 CTA</h3>
                    <button
                      onClick={() => copyToClipboard(generatedScript.midCTA, 'midCTA')}
                      className="text-sm flex items-center gap-1 text-gray-300 hover:text-white"
                    >
                      {copiedSection === 'midCTA' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-green-100 leading-relaxed whitespace-pre-wrap">{generatedScript.midCTA}</p>
                </div>

                {/* 엔딩 CTA */}
                <div className="bg-pink-900/30 rounded-xl p-5 border border-pink-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg">🎬 엔딩 CTA</h3>
                    <button
                      onClick={() => copyToClipboard(generatedScript.endingCTA, 'endingCTA')}
                      className="text-sm flex items-center gap-1 text-gray-300 hover:text-white"
                    >
                      {copiedSection === 'endingCTA' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-pink-100 leading-relaxed whitespace-pre-wrap">{generatedScript.endingCTA}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HookScriptGenerator;
