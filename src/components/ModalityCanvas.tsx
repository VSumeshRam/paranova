'use client';

import { useTelemetryStore } from '@/lib/store';
import { Volume2, FileText, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface ModalityCanvasProps {
  problem: any;
  onSubmit: (submission: string) => void;
}

export function ModalityCanvas({ problem, onSubmit }: ModalityCanvasProps) {
  const { activeModality, setModality, incrementAnswerFlip } = useTelemetryStore();
  const [submission, setSubmission] = useState('');
  const [prevSubmission, setPrevSubmission] = useState('');

  const handleAudioPlay = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(problem.audioPromptText);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleChange = (val: string) => {
    if (prevSubmission !== '' && prevSubmission !== val) {
      incrementAnswerFlip();
    }
    setPrevSubmission(submission);
    setSubmission(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submission.trim()) {
      onSubmit(submission);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100 transition-all duration-500">
      
      {/* Modality Switcher */}
      <div className="flex gap-4 mb-8 justify-center">
        <button
          onClick={() => setModality('TEXT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${activeModality === 'TEXT' ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          <FileText size={18} /> Text
        </button>
        <button
          onClick={() => setModality('VISUAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${activeModality === 'VISUAL' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          <ImageIcon size={18} /> Visual
        </button>
        <button
          onClick={() => setModality('AUDIO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${activeModality === 'AUDIO' ? 'bg-purple-100 text-purple-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
          <Volume2 size={18} /> Audio
        </button>
      </div>

      {/* Canvas Content */}
      <div className="min-h-[200px] flex flex-col items-center justify-center mb-8">
        {activeModality === 'TEXT' && (
          <p className="text-2xl font-serif text-gray-800 text-center leading-relaxed">
            {problem.textPrompt}
          </p>
        )}

        {activeModality === 'VISUAL' && (
          <div className="flex flex-col items-center w-full">
            <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 w-full flex items-center justify-center min-h-[150px]">
              <span className="text-gray-400 font-medium">
                [ Interactive Visual Placeholder ]
                <br />
                <span className="text-xs">{problem.visualDataJson}</span>
              </span>
            </div>
          </div>
        )}

        {activeModality === 'AUDIO' && (
          <div className="flex flex-col items-center gap-6 w-full">
            <button 
              onClick={handleAudioPlay}
              className="p-8 bg-purple-50 hover:bg-purple-100 rounded-full text-purple-600 transition-colors"
            >
              <Volume2 size={48} />
            </button>
            <p className="text-gray-500 italic">Tap to listen to the prompt</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          value={submission}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter your answer..."
          className="flex-1 px-6 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
        />
        <button 
          type="submit"
          className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
