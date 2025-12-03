import React from 'react';
import { ScriptAnalysis } from '../types';
import { Target, Zap, Lightbulb, Users, PenTool } from 'lucide-react';

interface Props {
  analysis: ScriptAnalysis;
}

const AnalysisDisplay: React.FC<Props> = ({ analysis }) => {
  return (
    <div className="bg-neutral-800 rounded-xl p-6 shadow-xl border border-neutral-600 animate-fade-in">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white border-b border-neutral-600 pb-4">
        <Zap className="text-yellow-400" />
        스타일 분석 결과
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tone & Pacing */}
        <div className="space-y-4">
          <div className="bg-neutral-900 p-5 rounded-lg border border-neutral-600">
            <div className="text-sm text-gray-300 mb-2 flex items-center gap-2 font-bold">
               <PenTool size={16} className="text-purple-400" /> 어조 (Tone)
            </div>
            <div className="text-lg font-bold text-white tracking-wide">{analysis.tone}</div>
          </div>
          
          <div className="bg-neutral-900 p-5 rounded-lg border border-neutral-600">
            <div className="text-sm text-gray-300 mb-2 flex items-center gap-2 font-bold">
               <Zap size={16} className="text-yellow-400" /> 속도감 (Pacing)
            </div>
            <div className="text-lg font-bold text-white tracking-wide">{analysis.pacing}</div>
          </div>
        </div>

        {/* Audience */}
        <div className="bg-neutral-900 p-5 rounded-lg border border-neutral-600 flex flex-col">
           <div className="text-sm text-gray-300 mb-2 flex items-center gap-2 font-bold">
               <Users size={16} className="text-green-400" /> 타겟 시청자
            </div>
            <p className="text-white leading-relaxed text-lg mb-4 font-medium">{analysis.targetAudience}</p>
             <div className="mt-auto pt-4 border-t border-neutral-700">
               <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold">집필 스타일</div>
               <p className="text-sm text-gray-200">{analysis.writingStyle}</p>
             </div>
        </div>
      </div>

      {/* Themes & Strengths */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div>
          <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-blue-400" /> 주요 테마
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.keyThemes.map((theme, i) => (
              <span key={i} className="px-3 py-1.5 bg-blue-900/50 text-blue-100 rounded-full text-sm border border-blue-700 font-medium shadow-sm">
                {theme}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
            <Target size={16} className="text-red-400" /> 강점
          </h3>
          <ul className="space-y-2">
            {analysis.strengths.map((str, i) => (
              <li key={i} className="text-sm text-gray-100 flex items-start gap-2 font-medium">
                <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                {str}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDisplay;