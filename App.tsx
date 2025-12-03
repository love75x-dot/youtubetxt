import React, { useState } from 'react';
import { Wand2, Youtube, FileText, Loader2, AlertCircle } from 'lucide-react';
import { analyzeScript, generateTopics, writeNewScript } from './services/geminiService';
import { AppStep, ScriptAnalysis, TopicRecommendation, GeneratedScript } from './types';
import AnalysisDisplay from './components/AnalysisDisplay';
import TopicSelector from './components/TopicSelector';
import ScriptEditor from './components/ScriptEditor';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null);
  const [topics, setTopics] = useState<TopicRecommendation[]>([]);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for API key on mount
  React.useEffect(() => {
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const savedApiKey = localStorage.getItem('gemini_api_key');
    
    if (envApiKey && envApiKey !== 'your_api_key_here') {
      setApiKey(envApiKey);
      setShowApiKeyInput(false);
    } else if (savedApiKey) {
      setApiKey(savedApiKey);
      setShowApiKeyInput(false);
    }
  }, []);

  // Handlers
  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setStep(AppStep.ANALYZING);
    setError(null);

    try {
      // 1. Analyze
      const analysisResult = await analyzeScript(inputText);
      setAnalysis(analysisResult);
      
      // 2. Generate Topics immediately after analysis to smooth UX
      const topicsResult = await generateTopics(analysisResult);
      setTopics(topicsResult);
      
      setStep(AppStep.TOPICS);
    } catch (err: any) {
      console.error(err);
      setError("분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setStep(AppStep.INPUT);
    }
  };

  const handleGenerateScript = async (topic: TopicRecommendation) => {
    if (!analysis) return;
    
    setStep(AppStep.GENERATING);
    setError(null);

    try {
      const content = await writeNewScript(topic, analysis);
      setGeneratedScript({
        title: topic.title,
        content: content
      });
      setStep(AppStep.RESULT);
    } catch (err: any) {
      console.error(err);
      setError("대본 작성 중 오류가 발생했습니다.");
      setStep(AppStep.TOPICS);
    }
  };

  const handleReset = () => {
    setStep(AppStep.INPUT);
    setInputText('');
    setAnalysis(null);
    setTopics([]);
    setGeneratedScript(null);
    setError(null);
  };

  // Render Helpers
  const renderHeader = () => (
    <header className="bg-neutral-900 border-b border-neutral-700 py-4 px-6 sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => step !== AppStep.GENERATING && handleReset()}>
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20">
            <Youtube className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            유튜브 대본 AI
          </h1>
        </div>
        
        {step !== AppStep.INPUT && step !== AppStep.RESULT && (
           <div className="text-sm text-gray-300 hidden md:block font-medium">
              Gemini 2.5 Flash 기반
           </div>
        )}
      </div>
    </header>
  );

  const renderInputScreen = () => (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {showApiKeyInput && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-yellow-100 mb-3 flex items-center gap-2">
            <AlertCircle size={24} />
            API 키 설정 필요
          </h3>
          <p className="text-yellow-200 mb-4 leading-relaxed">
            Google Gemini API 키를 입력하거나 .env 파일에 VITE_GEMINI_API_KEY를 설정하세요.
            <br />
            API 키는 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">여기</a>에서 발급받을 수 있습니다.
          </p>
          <div className="flex gap-3">
            <input
              type="password"
              className="flex-1 bg-neutral-950 text-white border border-neutral-500 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 outline-none"
              placeholder="API 키를 입력하세요..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              onClick={() => {
                if (apiKey.trim()) {
                  setShowApiKeyInput(false);
                  localStorage.setItem('gemini_api_key', apiKey);
                }
              }}
              disabled={!apiKey.trim()}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              저장
            </button>
          </div>
        </div>
      )}
      
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 text-white tracking-tight">
          유튜브 대본 분석 및 생성
        </h2>
        <p className="text-gray-200 text-lg font-medium leading-relaxed">
          기존 대본을 붙여넣으세요. AI가 스타일을 분석하고 <br/>
          새로운 주제를 추천하여 완벽한 대본을 작성해드립니다.
        </p>
      </div>

      <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-600 shadow-2xl">
        <label className="block text-base font-bold text-white mb-3 flex items-center gap-2">
          <FileText size={20} className="text-purple-400" />
          기존 대본 입력 (스타일 분석용)
        </label>
        <textarea
          className="w-full h-64 bg-neutral-950 text-white border border-neutral-500 rounded-xl p-5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none text-base leading-relaxed placeholder-gray-400 shadow-inner"
          placeholder="여기에 이전 영상의 대본을 붙여넣으세요..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={!inputText.trim() || step === AppStep.ANALYZING || showApiKeyInput}
            className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
          >
            {step === AppStep.ANALYZING ? (
              <>
                <Loader2 className="animate-spin" /> 분석 중...
              </>
            ) : (
              <>
                <Wand2 size={20} /> 분석 및 주제 추천받기
              </>
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-900/40 border border-red-500 rounded-lg text-red-100 flex items-center gap-2 font-medium">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
    </div>
  );

  const renderLoadingOverlay = (message: string) => (
    <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
      <Loader2 className="w-16 h-16 text-purple-400 animate-spin mb-6" />
      <h3 className="text-2xl font-bold text-white tracking-wide">{message}</h3>
      <p className="text-gray-300 mt-2 font-medium">잠시만 기다려주세요...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 pb-20 text-white">
      {renderHeader()}

      <main className="container mx-auto px-4 py-12">
        {step === AppStep.INPUT && renderInputScreen()}

        {step === AppStep.ANALYZING && renderLoadingOverlay("스타일 및 패턴 분석 중...")}

        {step === AppStep.TOPICS && analysis && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between border-b border-neutral-700 pb-4">
               <h2 className="text-2xl font-bold text-white">분석 결과 및 추천 주제</h2>
               <button onClick={handleReset} className="text-sm text-gray-300 hover:text-white transition-colors underline decoration-dotted font-medium">
                 처음으로 돌아가기
               </button>
            </div>
            
            <AnalysisDisplay analysis={analysis} />
            <TopicSelector 
              topics={topics} 
              onSelect={handleGenerateScript} 
            />
          </div>
        )}

        {step === AppStep.GENERATING && renderLoadingOverlay("AI가 맞춤형 대본을 작성하고 있습니다...")}

        {step === AppStep.RESULT && generatedScript && (
          <ScriptEditor script={generatedScript} onReset={handleReset} />
        )}
      </main>
    </div>
  );
};

export default App;