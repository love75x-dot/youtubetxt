import { useState } from "react";
import { Zap, Copy, CheckCircle2, Sparkles, ArrowLeft, Edit2, Home } from "lucide-react";
import { convertToShortForm } from "../services/geminiService";

interface ShortFormConverterProps {
  onBack: () => void;
  onReset: () => void;
  longFormInput: string;
  setLongFormInput: (value: string) => void;
  shortFormOutput: string;
  setShortFormOutput: (value: string) => void;
}

export default function ShortFormConverter({ 
  onBack, 
  onReset,
  longFormInput,
  setLongFormInput,
  shortFormOutput,
  setShortFormOutput
}: ShortFormConverterProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleConvert = async () => {
    if (!longFormInput.trim()) {
      setError("롱폼 대본을 입력해주세요.");
      return;
    }

    setIsConverting(true);
    setError("");
    setShortFormOutput("");

    try {
      const result = await convertToShortForm(longFormInput);
      setShortFormOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "변환 중 오류가 발생했습니다.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortFormOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-800 rounded-xl border border-neutral-600 shadow-2xl overflow-hidden mb-6">
        <div className="bg-neutral-900 border-b border-neutral-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-white">숏폼 대본 변환</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors font-medium"
            >
              <ArrowLeft size={16} />
              이전
            </button>
            
            {shortFormOutput && (
              <button
                onClick={() => {
                  setShortFormOutput('');
                  setLongFormInput('');
                  setError('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors font-medium"
              >
                <Edit2 size={16} />
                수정
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 롱폼 대본을 입력하면 30~60초 숏폼(Shorts/릴스)용 대본으로 자동 변환됩니다.
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-3">
        <label className="block">
          <span className="text-lg font-semibold text-gray-700">롱폼 대본 입력</span>
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

      {/* Short Form Output */}
      {shortFormOutput && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              숏폼 대본 (30~60초)
            </label>
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
          </div>

          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 border-2 border-yellow-500 rounded-lg p-6 shadow-lg">
            <div 
              className="prose prose-invert max-w-none whitespace-pre-wrap text-white text-base leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: shortFormOutput
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-300">$1</strong>')
                  .replace(/\n/g, '<br/>')
              }}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ✨ <strong>숏폼 최적화 완료!</strong> 위 대본은 30~60초 분량으로 압축되어 
              첫 3초에 강력한 Hook이 있고, 핵심 메시지만 빠르게 전달하도록 설계되었습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
