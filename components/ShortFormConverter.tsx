import { useState, useEffect } from "react";
import { Zap, Copy, CheckCircle2, Sparkles, ArrowLeft, Edit2, Home, Loader2, TrendingUp } from "lucide-react";
import { convertToShortForm, refineShortForm } from "../services/geminiService";
import { ShortFormData, ShortFormRecommendation, ShortFormVersion } from "../types";

interface ShortFormConverterProps {
  onBack: () => void;
  onReset: () => void;
  currentTopicId: string;
  shortFormDataMap: Map<string, ShortFormData>;
  setShortFormDataMap: (map: Map<string, ShortFormData>) => void;
}

interface ShortFormRecWithScript extends ShortFormRecommendation {
  script: string;
}

export default function ShortFormConverter({ 
  onBack, 
  onReset,
  currentTopicId,
  shortFormDataMap,
  setShortFormDataMap
}: ShortFormConverterProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [longFormInput, setLongFormInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedScript, setEditedScript] = useState("");
  const [activeTab, setActiveTab] = useState<"recommendations" | "selected">("recommendations");
  
  // 현재 주제의 데이터 가져오기
  const currentData = currentTopicId ? shortFormDataMap.get(currentTopicId) : null;
  const recommendations = currentData?.recommendations || [];
  const selectedRecommendation = currentData?.selectedRecommendation || null;
  const currentScript = currentData?.currentScript || "";
  const versions = currentData?.versions || [];
  const currentVersion = currentData?.currentVersion || 0;

  // 현재 버전의 스크립트 가져오기
  const getCurrentScript = () => {
    if (versions.length > 0 && versions[currentVersion]) {
      return versions[currentVersion].script;
    }
    return currentScript;
  };

  // 데이터 업데이트 헬퍼
  const updateShortFormData = (updates: Partial<ShortFormData>) => {
    if (!currentTopicId) return;
    
    const existing = shortFormDataMap.get(currentTopicId) || {
      recommendations: [],
      selectedRecommendation: null,
      currentScript: "",
      versions: [],
      currentVersion: 0
    };
    
    const updated = { ...existing, ...updates };
    const newMap = new Map(shortFormDataMap);
    newMap.set(currentTopicId, updated);
    setShortFormDataMap(newMap);
  };

  const handleConvert = async () => {
    if (!longFormInput.trim()) {
      setError("롱폼 대본을 입력해주세요.");
      return;
    }

    setIsConverting(true);
    setError("");

    try {
      const result = await convertToShortForm(longFormInput);
      const parsed = JSON.parse(result);
      
      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        updateShortFormData({
          recommendations: parsed.recommendations,
          selectedRecommendation: null,
          currentScript: "",
          versions: [],
          currentVersion: 0
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "변환 중 오류가 발생했습니다.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleSelectRecommendation = (rec: ShortFormRecWithScript) => {
    const initialVersion: ShortFormVersion = {
      version: 0,
      script: rec.script,
      timestamp: Date.now(),
      instruction: "원본 AI 추천 대본"
    };

    updateShortFormData({
      selectedRecommendation: rec,
      currentScript: rec.script,
      versions: [initialVersion],
      currentVersion: 0
    });
    
    // 선택된 대본 탭으로 이동
    setActiveTab("selected");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getCurrentScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async () => {
    if (!refineInstruction.trim()) return;
    
    setIsRefining(true);
    try {
      const refinedScript = await refineShortForm({
        currentScript: getCurrentScript(),
        instruction: refineInstruction
      });
      
      const newVersion: ShortFormVersion = {
        version: versions.length,
        script: refinedScript,
        timestamp: Date.now(),
        instruction: refineInstruction
      };
      
      updateShortFormData({
        currentScript: refinedScript,
        versions: [...versions, newVersion],
        currentVersion: newVersion.version
      });
      
      setRefineInstruction('');
      setShowRefineModal(false);
    } catch (error) {
      console.error('Short-form script refinement failed:', error);
      setError('대본 수정 중 오류가 발생했습니다.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleVersionChange = (versionNum: number) => {
    updateShortFormData({
      currentVersion: versionNum
    });
  };

  const handleDirectEdit = () => {
    setIsEditing(true);
    setEditedScript(getCurrentScript());
  };

  const handleSaveEdit = () => {
    const newVersion: ShortFormVersion = {
      version: versions.length,
      script: editedScript,
      timestamp: Date.now(),
      instruction: "직접 수정"
    };
    
    updateShortFormData({
      currentScript: editedScript,
      versions: [...versions, newVersion],
      currentVersion: newVersion.version
    });
    
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedScript("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-800 rounded-xl border border-neutral-600 shadow-2xl overflow-hidden mb-6">
        <div className="bg-neutral-900 border-b border-neutral-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-white">숏폼 대본 변환</h2>
            {currentTopicId && (
              <span className="text-sm text-gray-400 ml-2">
                (주제: {currentTopicId})
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors font-medium"
            >
              <ArrowLeft size={16} />
              이전
            </button>
            
            {currentScript && (
              <button
                onClick={() => {
                  updateShortFormData({
                    selectedRecommendation: null,
                    currentScript: "",
                    versions: [],
                    currentVersion: 0
                  });
                  setLongFormInput("");
                  setError("");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors font-medium"
              >
                <Edit2 size={16} />
                새로 만들기
              </button>
            )}
            
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors font-medium"
            >
              <Home size={16} />
              홈
            </button>
          </div>
        </div>
      </div>

      {!currentTopicId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            💡 먼저 [분석 & 생성] 탭에서 주제를 선택하고 롱폼 대본을 생성해주세요.
          </p>
        </div>
      )}

      {/* 추천 목록이 있을 때 탭 UI 표시 */}
      {currentTopicId && recommendations.length > 0 && selectedRecommendation && (
        <div className="mb-6">
          <div className="flex gap-2 border-b border-neutral-600">
            <button
              onClick={() => setActiveTab("recommendations")}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === "recommendations"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              AI 추천 목록 ({recommendations.length}개)
            </button>
            <button
              onClick={() => setActiveTab("selected")}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === "selected"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              선택된 대본
            </button>
          </div>
        </div>
      )}

      {currentTopicId && !selectedRecommendation && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 롱폼 대본을 입력하면 AI가 3~5개의 숏폼 대본을 추천해드립니다.
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-lg font-semibold text-white">롱폼 대본 입력</span>
              <span className="text-sm text-gray-500 ml-2">
                (변환할 롱폼 대본을 붙여넣기 하세요)
              </span>
            </label>
            <textarea
              value={longFormInput}
              onChange={(e) => setLongFormInput(e.target.value)}
              placeholder="롱폼 유튜브 대본을 여기에 붙여넣기 하세요...&#10;&#10;예시:&#10;SESSION1: 오프닝&#10;여러분, 오늘은 정말 중요한 이야기를 해보려고 합니다.&#10;많은 분들이 궁금해하시던...&#10;&#10;(전체 대본 내용)"
              className="w-full h-64 p-4 border-2 border-gray-600 bg-neutral-800 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-base leading-relaxed placeholder-gray-500"
              disabled={isConverting}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {longFormInput.length.toLocaleString()}자
              </span>
              {longFormInput && (
                <button
                  onClick={() => setLongFormInput("")}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  입력 초기화
                </button>
              )}
            </div>
          </div>

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={isConverting || !longFormInput.trim()}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {isConverting ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                숏폼으로 변환 중...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                숏폼 대본으로 변환
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* AI 추천 숏폼 대본 */}
          {recommendations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-white">AI 추천 숏폼 대본</h3>
                <span className="text-sm text-gray-400">({recommendations.length}개)</span>
              </div>
              
              <div className="grid gap-4">
                {recommendations.map((rec: any, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectRecommendation(rec)}
                    className="bg-gradient-to-br from-neutral-800 to-neutral-900 border-2 border-neutral-600 hover:border-yellow-500 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg hover:shadow-yellow-500/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-yellow-600 text-white text-xs font-bold rounded-full">
                            추천 {index + 1}
                          </span>
                          <span className="text-xs text-gray-400">{rec.estimatedViews} 예상</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">{rec.title}</h4>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-yellow-400 mt-1">Hook:</span>
                        <p className="text-sm text-gray-300 flex-1">{rec.hook}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-blue-400 mt-1">각도:</span>
                        <p className="text-sm text-gray-300 flex-1">{rec.angle}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end">
                      <button className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition-colors">
                        <Zap className="w-4 h-4" />
                        이 대본 선택
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 추천 목록 탭 표시 (선택된 대본이 있을 때) */}
      {currentTopicId && selectedRecommendation && activeTab === "recommendations" && recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-bold text-white">AI 추천 숏폼 대본</h3>
            <span className="text-sm text-gray-400">({recommendations.length}개)</span>
          </div>
          
          <div className="grid gap-4">
            {recommendations.map((rec: any, index) => {
              const isSelected = selectedRecommendation && 
                selectedRecommendation.title === rec.title && 
                selectedRecommendation.angle === rec.angle;
              
              return (
                <div
                  key={index}
                  onClick={() => handleSelectRecommendation(rec)}
                  className={`bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg hover:shadow-yellow-500/20 ${
                    isSelected 
                      ? 'border-2 border-green-500' 
                      : 'border-2 border-neutral-600 hover:border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${
                          isSelected ? 'bg-green-600' : 'bg-yellow-600'
                        }`}>
                          {isSelected ? '✓ 선택됨' : `추천 ${index + 1}`}
                        </span>
                        <span className="text-xs text-gray-400">{rec.estimatedViews} 예상</span>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{rec.title}</h4>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-yellow-400 mt-1">Hook:</span>
                      <p className="text-sm text-gray-300 flex-1">{rec.hook}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-blue-400 mt-1">각도:</span>
                      <p className="text-sm text-gray-300 flex-1">{rec.angle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <button className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${
                      isSelected 
                        ? 'bg-green-600 hover:bg-green-500' 
                        : 'bg-yellow-600 hover:bg-yellow-500'
                    }`}>
                      <Zap className="w-4 h-4" />
                      {isSelected ? '대본 보기' : '이 대본 선택'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Short Form Output */}
      {currentScript && selectedRecommendation && activeTab === "selected" && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              숏폼 대본 (30~60초)
            </label>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <button
                    onClick={handleDirectEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    직접 수정
                  </button>
                  <button
                    onClick={() => setShowRefineModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    AI 수정
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        복사됨!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        복사하기
                      </>
                    )}
                  </button>
                </>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    저장
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium"
                  >
                    취소
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              className="w-full h-96 p-4 border-2 border-green-500 bg-neutral-800 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-base leading-relaxed"
            />
          ) : (
            <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 border-2 border-yellow-500 rounded-lg p-6 shadow-lg">
              <div 
                className="prose prose-invert max-w-none whitespace-pre-wrap text-white text-base leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: getCurrentScript()
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-300">$1</strong>')
                    .replace(/\n/g, '<br/>')
                }}
              />
            </div>
          )}

          {/* 버전 히스토리 */}
          {versions.length > 1 && (
            <div className="p-4 bg-neutral-900 border border-neutral-600 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-400 font-medium">대본 버전:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {versions.map((version, index) => (
                  <button
                    key={index}
                    onClick={() => handleVersionChange(index)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      currentVersion === index
                        ? 'bg-yellow-600 text-white border-2 border-yellow-400'
                        : 'bg-neutral-800 text-gray-300 border border-neutral-600 hover:bg-neutral-700'
                    }`}
                    title={version.instruction || '원본 대본'}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              {versions[currentVersion]?.instruction && (
                <div className="mt-3 text-xs text-gray-400 bg-neutral-800 rounded p-2 border border-neutral-700">
                  <strong>수정 내용:</strong> {versions[currentVersion].instruction}
                </div>
              )}
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ✨ <strong>숏폼 최적화 완료!</strong> 위 대본은 30~60초 분량으로 압축되어 
              첫 3초에 강력한 Hook이 있고, 핵심 메시지만 빠르게 전달하도록 설계되었습니다.
            </p>
          </div>
        </div>
      )}

      {/* 숏폼 대본 수정 모달 */}
      {showRefineModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRefineModal(false)}>
          <div className="bg-neutral-900 rounded-xl border border-neutral-600 max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Edit2 size={24} className="text-blue-400" />
              숏폼 대본 AI 수정하기
            </h3>
            
            <p className="text-gray-300 mb-4 text-sm">
              어떻게 숏폼 대본을 수정하고 싶으신가요? 구체적으로 설명해주세요.
            </p>
            
            <div className="space-y-3 mb-4">
              <div className="text-xs text-gray-400">
                <strong>예시:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>"더 강렬한 Hook으로 바꿔줘"</li>
                  <li>"템포를 더 빠르게 만들어줘"</li>
                  <li>"친근한 말투로 변경해줘"</li>
                  <li>"첫 문장을 질문 형태로 바꿔줘"</li>
                </ul>
              </div>
            </div>
            
            <textarea
              value={refineInstruction}
              onChange={(e) => setRefineInstruction(e.target.value)}
              placeholder="수정 요청 사항을 입력하세요..."
              className="w-full h-32 bg-neutral-950 border border-neutral-600 rounded-lg p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRefineModal(false)}
                className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-200 rounded-lg font-medium transition-colors"
                disabled={isRefining}
              >
                취소
              </button>
              <button
                onClick={handleRefine}
                disabled={!refineInstruction.trim() || isRefining}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                {isRefining ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    수정 중...
                  </>
                ) : (
                  'AI 수정하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
