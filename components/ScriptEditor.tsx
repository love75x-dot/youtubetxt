import React, { useState } from 'react';
import { GeneratedScript } from '../types';
import { Copy, Check, RefreshCw, ArrowLeft, Edit2, Loader2, Youtube, Hash } from 'lucide-react';
import { refineScript } from '../services/geminiService';

interface Props {
  script: GeneratedScript;
  onReset: () => void;
  onBack?: () => void;
  onUpdate?: (script: GeneratedScript) => void;
}

const ScriptEditor: React.FC<Props> = ({ script, onReset, onBack, onUpdate }) => {
  const [copied, setCopied] = useState(false);
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const handleCopy = () => {
    const fullText = `# ${script.title}\n\n${script.content}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async () => {
    if (!refineInstruction.trim() || !onUpdate) return;
    
    setIsRefining(true);
    try {
      const refinedContent = await refineScript({
        currentScript: script.content,
        instruction: refineInstruction
      });
      
      const updatedScript: GeneratedScript = {
        ...script,
        content: refinedContent
      };
      
      onUpdate(updatedScript);
      setRefineInstruction('');
      setShowRefineModal(false);
    } catch (error) {
      console.error('Script refinement failed:', error);
      alert('대본 수정 중 오류가 발생했습니다.');
    } finally {
      setIsRefining(false);
    }
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
                className="flex items-center gap-2 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-gray-100 rounded-lg text-sm transition-colors border border-neutral-500 font-medium hover:border-neutral-400"
              >
                <ArrowLeft size={16} />
                이전으로
              </button>
            )}
            
            <button
              onClick={() => setShowRefineModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors font-medium"
            >
              <Edit2 size={16} />
              대본 수정
            </button>
            
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-100 rounded-lg text-sm transition-colors border border-neutral-500 font-medium hover:border-neutral-400"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              {copied ? '복사됨' : '복사'}
            </button>

            <button
              onClick={onReset}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors font-bold shadow-md hover:shadow-purple-500/20"
            >
              <RefreshCw size={16} />
              새로 만들기
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
                <label className="text-xs text-gray-400 font-bold block mb-1">영상 제목</label>
                <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-white font-medium">
                  {script.youtubeTitle}
                </div>
              </div>
            )}
            
            {script.youtubeDescription && (
              <div className="mb-4">
                <label className="text-xs text-gray-400 font-bold block mb-1">설명</label>
                <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-gray-200 text-sm leading-relaxed">
                  {script.youtubeDescription}
                </div>
              </div>
            )}
            
            {script.hashtags && script.hashtags.length > 0 && (
              <div>
                <label className="text-xs text-gray-400 font-bold block mb-2 flex items-center gap-1">
                  <Hash size={14} />
                  해시태그
                </label>
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
          <div className="prose prose-invert max-w-none prose-headings:text-purple-300 prose-p:text-gray-100 prose-strong:text-white prose-li:text-gray-200 prose-blockquote:text-gray-300 prose-blockquote:border-purple-500">
            <h1 className="text-3xl font-extrabold mb-8 pb-4 border-b border-neutral-600 leading-tight text-white">{script.title}</h1>
            <div className="whitespace-pre-wrap font-sans text-lg leading-loose text-white">
              {script.content}
            </div>
          </div>
        </div>
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