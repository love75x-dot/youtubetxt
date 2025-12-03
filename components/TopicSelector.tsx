import React from 'react';
import { TopicRecommendation } from '../types';
import { TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  topics: TopicRecommendation[];
  onSelect: (topic: TopicRecommendation) => void;
}

const TopicSelector: React.FC<Props> = ({ topics, onSelect }) => {
  return (
    <div className="mt-8 animate-slide-up">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
        <Sparkles className="text-purple-400" />
        AI 추천 주제
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic, index) => (
          <button
            key={index}
            onClick={() => onSelect(topic)}
            className="group relative flex flex-col items-start text-left p-6 bg-neutral-800 hover:bg-neutral-750 border border-neutral-600 hover:border-purple-400 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/30 w-full"
          >
            <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold text-purple-200 bg-purple-900/60 px-2 py-1 rounded border border-purple-500/50">
              <TrendingUp size={12} />
              {topic.viralityScore}%
            </div>

            <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-300 transition-colors pr-16 leading-snug">
              {topic.title}
            </h3>
            
            <p className="text-sm text-gray-200 mb-5 line-clamp-2 leading-relaxed font-medium">
              {topic.premise}
            </p>

            <div className="mt-auto w-full pt-4 border-t border-neutral-600 flex items-center justify-between">
              <span className="text-xs text-gray-300">
                <span className="font-bold text-gray-400 mr-1">추천 이유:</span>
                {topic.reason}
              </span>
              <div className="w-8 h-8 rounded-full bg-neutral-700 group-hover:bg-purple-600 flex items-center justify-center transition-colors shrink-0 ml-4 border border-neutral-600 group-hover:border-purple-500">
                <ArrowRight size={16} className="text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicSelector;