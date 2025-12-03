import React, { useState } from 'react';
import { GeneratedScript, ScriptVersion } from '../types';
import { Copy, Check, RefreshCw, ArrowLeft, Edit2, Loader2, Youtube, Hash, Home } from 'lucide-react';
import { refineScript } from '../services/geminiService';

interface Props {
  script: GeneratedScript;
  onReset: () => void;
  onBack?: () => void;
  onUpdate?: (script: GeneratedScript) => void;
}

const ScriptEditor: React.FC<Props> = ({ script, onReset, onBack, onUpdate }) => {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDescription, setCopiedDescription] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(script.currentVersion || 0);

  const handleCopyTitle = () => {
    if (script.youtubeTitle) {
      navigator.clipboard.writeText(script.youtubeTitle);
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 2000);
    }
  };

  const handleCopyDescription = () => {
    if (script.youtubeDescription) {
      navigator.clipboard.writeText(script.youtubeDescription);
      setCopiedDescription(true);
      setTimeout(() => setCopiedDescription(false), 2000);
    }
  };

  const handleCopyHashtags = () => {
    if (script.hashtags && script.hashtags.length > 0) {
      navigator.clipboard.writeText(script.hashtags.join(' '));
      setCopiedHashtags(true);
      setTimeout(() => setCopiedHashtags(false), 2000);
    }
  };

  const handleCopyScript = () => {
    const content = getCurrentContent();
    const fullText = `# ${script.title}\n\n${content}`;
    navigator.clipboard.writeText(fullText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleRefine = async () => {
    if (!refineInstruction.trim() || !onUpdate) return;
    
    setIsRefining(true);
    try {
      const refinedContent = await refineScript({
        currentScript: script.content,
        instruction: refineInstruction
      });
      
      // 버전 히스토리 생성
      const versions = script.versions || [{
        version: 0,
        content: script.content,
        timestamp: Date.now(),
        instruction: '원본 대본'
      }];
      
      const newVersion: ScriptVersion = {
        version: versions.length,
        content: refinedContent,
        timestamp: Date.now(),
        instruction: refineInstruction
      };
      
      const updatedScript: GeneratedScript = {
        ...script,
        content: refinedContent,
        versions: [...versions, newVersion],
        currentVersion: newVersion.version
      };
      
      onUpdate(updatedScript);
      setCurrentVersion(newVersion.version);
      setRefineInstruction('');
      setShowRefineModal(false);
    } catch (error) {
      console.error('Script refinement failed:', error);
      alert('대본 수정 중 오류가 발생했습니다.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleVersionChange = (version: number) => {
    if (!script.versions || !onUpdate) return;
    
    const selectedVersion = script.versions[version];
    if (selectedVersion) {
      const updatedScript: GeneratedScript = {
        ...script,
        content: selectedVersion.content,
        currentVersion: version
      };
      onUpdate(updatedScript);
      setCurrentVersion(version);
    }
  };

  const getCurrentContent = () => {
    if (script.versions && script.versions[currentVersion]) {
      return script.versions[currentVersion].content;
    }
    return script.content;
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-neutral-800 rounded-xl border border-neutral-600 shadow-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="bg-neutral-900 border-b border-neutral-600 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-purple-900/40 rounded-lg text-purple-300 shrink-0 border border-purple-700/30">
               <Youtube size={20} />
            </div>
            <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{script.title}</h2>
                <p className="text-xs text-gray-300 font-medium">AI 생성 대본</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors font-medium"
              >
                <ArrowLeft size={16} />
                이전
              </button>
            )}
            
            <button
              onClick={() => setShowRefineModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors font-medium"
            >
              <Edit2 size={16} />
              수정
            </button>

            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors font-medium"
            >
              <Home size={16} />
              홈
            </button>
          </div>
        </div>

        {/* YouTube 메타데이터 */}
        {(script.youtubeTitle || script.youtubeDescription || script.hashtags) && (
          <div className="p-6 bg-neutral-900 border-b border-neutral-600">
            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
              <Youtube size={18} className="text-red-500" />
              YouTube 업로드 정보
            </h3>
            
            {script.youtubeTitle && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-400 font-bold">영상 제목</label>
                  <button
                    onClick={handleCopyTitle}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs transition-colors font-medium"
                  >
                    {copiedTitle ? <Check size={12} /> : <Copy size={12} />}
                    {copiedTitle ? '복사됨' : '복사'}
                  </button>
                </div>
                <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-white font-medium">
                  {script.youtubeTitle}
                </div>
              </div>
            )}
            
            {script.youtubeDescription && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-400 font-bold">설명</label>
                  <button
                    onClick={handleCopyDescription}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs transition-colors font-medium"
                  >
                    {copiedDescription ? <Check size={12} /> : <Copy size={12} />}
                    {copiedDescription ? '복사됨' : '복사'}
                  </button>
                </div>
                <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-gray-200 text-sm leading-relaxed">
                  {script.youtubeDescription}
                </div>
              </div>
            )}
            
            {script.hashtags && script.hashtags.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400 font-bold flex items-center gap-1">
                    <Hash size={14} />
                    해시태그
                  </label>
                  <button
                    onClick={handleCopyHashtags}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs transition-colors font-medium"
                  >
                    {copiedHashtags ? <Check size={12} /> : <Copy size={12} />}
                    {copiedHashtags ? '복사됨' : '복사'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {script.hashtags.map((tag, index) => (
                    <span key={index} className="bg-blue-900/30 border border-blue-700 text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Editor Area */}
        <div className="p-8 bg-neutral-800 min-h-[60vh]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-300">대본 본문</h3>
            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs transition-colors font-medium"
            >
              {copiedScript ? <Check size={12} /> : <Copy size={12} />}
              {copiedScript ? '복사됨' : '복사'}
            </button>
          </div>
          <div className="prose prose-invert max-w-none prose-headings:text-purple-300 prose-p:text-gray-100 prose-strong:text-white prose-li:text-gray-200 prose-blockquote:text-gray-300 prose-blockquote:border-purple-500">
            <h1 className="text-3xl font-extrabold mb-8 pb-4 border-b border-neutral-600 leading-tight text-white">{script.title}</h1>
            <div className="whitespace-pre-wrap font-sans text-lg leading-loose text-white">
              {getCurrentContent()}
            </div>
          </div>
        </div>

        {/* 버전 히스토리 */}
        {script.versions && script.versions.length > 1 && (
          <div className="p-4 bg-neutral-900 border-t border-neutral-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-400 font-medium">대본 버전:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {script.versions.map((version, index) => (
                <button
                  key={index}
                  onClick={() => handleVersionChange(index)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentVersion === index
                      ? 'bg-purple-600 text-white border-2 border-purple-400'
                      : 'bg-neutral-800 text-gray-300 border border-neutral-600 hover:bg-neutral-700'
                  }`}
                  title={version.instruction || '원본 대본'}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            {script.versions[currentVersion]?.instruction && (
              <div className="mt-3 text-xs text-gray-400 bg-neutral-800 rounded p-2 border border-neutral-700">
                <strong>수정 내용:</strong> {script.versions[currentVersion].instruction}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 대본 수정 모달 */}
      {showRefineModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRefineModal(false)}>
          <div className="bg-neutral-900 rounded-xl border border-neutral-600 max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Edit2 size={24} className="text-blue-400" />
              대본 수정하기
            </h3>
            
            <p className="text-gray-300 mb-4 text-sm">
              어떻게 대본을 수정하고 싶으신가요? 구체적으로 설명해주세요.
            </p>
            
            <div className="space-y-3 mb-4">
              <div className="text-xs text-gray-400">
                <strong>예시:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>"더 친근한 말투로 바꿔줘"</li>
                  <li>"대본 분량을 50% 줄여줘"</li>
                  <li>"전문적인 톤으로 변경하고 데이터를 더 추가해줘"</li>
                  <li>"후크 부분을 더 강렬하게 만들어줘"</li>
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
                className="flex-1 px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                {isRefining ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    수정 중...
                  </>
                ) : (
                  '대본 수정하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptEditor;