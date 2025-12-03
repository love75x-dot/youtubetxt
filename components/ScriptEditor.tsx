import React, { useState } from 'react';
import { GeneratedScript } from '../types';
import { Copy, Check, RefreshCw, Download, FileText } from 'lucide-react';

interface Props {
  script: GeneratedScript;
  onReset: () => void;
}

const ScriptEditor: React.FC<Props> = ({ script, onReset }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`# ${script.title}\n\n${script.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([`# ${script.title}\n\n${script.content}`], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = "script.md";
    document.body.appendChild(element); 
    element.click();
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-neutral-800 rounded-xl border border-neutral-600 shadow-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="bg-neutral-900 border-b border-neutral-600 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-purple-900/40 rounded-lg text-purple-300 shrink-0 border border-purple-700/30">
               <FileText size={20} />
            </div>
            <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{script.title}</h2>
                <p className="text-xs text-gray-300 font-medium">AI 생성 대본</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-100 rounded-lg text-sm transition-colors border border-neutral-500 font-medium hover:border-neutral-400"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              {copied ? '복사됨' : '복사'}
            </button>
            
            <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-100 rounded-lg text-sm transition-colors border border-neutral-500 font-medium hover:border-neutral-400"
            >
                <Download size={16} />
                저장
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
    </div>
  );
};

export default ScriptEditor;