'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/store';
import { ModalityCanvas } from '@/components/ModalityCanvas';
import { TelemetryConsole } from '@/components/TelemetryConsole';
import { Brain, ArrowRight, Home, CheckCircle, XCircle } from 'lucide-react';

export default function LearnPage() {
  const router = useRouter();
  const { studentId, currentNodeId: storeNodeId } = useSessionStore();
  
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(storeNodeId);
  const [problem, setProblem] = useState<any>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rateLimitError, setRateLimitError] = useState(false);
  
  // 10-Question Quiz Session State
  const [questionCount, setQuestionCount] = useState(1);
  const MAX_QUESTIONS = 10;
  const [sessionResults, setSessionResults] = useState<any[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  // Diagnostic State
  const [submission, setSubmission] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  
  // Telemetry (Simplistic tracking)
  const [telemetry, setTelemetry] = useState({
    timeToFirstAction: 0,
    hesitationPauses: 0,
    answerFlips: 0,
    activeModality: 'TEXT'
  });

  useEffect(() => {
    if (!studentId || !currentNodeId) {
      router.push('/explore');
      return;
    }

    async function fetchProblem() {
      setIsLoading(true);
      setFeedback(null);
      setSubmission('');
      setRateLimitError(false);
      const processOptions = (data: any) => {
          setProblem(data);
          let wrongAnswers: string[] = [];
          if (data.antiPatterns) {
            try {
              const parsed = typeof data.antiPatterns === 'string' ? JSON.parse(data.antiPatterns) : data.antiPatterns;
              wrongAnswers = Object.keys(parsed);
            } catch (e) {
              console.error(e);
            }
          }
          const options = [data.expectedAnswer, ...wrongAnswers];
          // Simple Fisher-Yates shuffle
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
          }
          setShuffledOptions(options);
        };

        try {
          const res = await fetch(`/api/generate-quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodeId: currentNodeId, studentId: studentId }),
          });
          if (res.ok) {
            const data = await res.json();
            processOptions(data);
          } else {
             // fallback to static if dynamic fails
             const fallbackRes = await fetch(`/api/problems/${currentNodeId}`);
             if (fallbackRes.ok) {
                const data = await fallbackRes.json();
                processOptions(data);
             } else {
                setRateLimitError(true);
             }
          }
        } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProblem();
  }, [studentId, currentNodeId, questionCount]); // Refetch on new question count

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission || !problem) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          problemId: problem.id,
          nodeId: currentNodeId,
          submission,
          textPrompt: problem.textPrompt,
          expectedAnswer: problem.expectedAnswer,
          antiPatterns: problem.antiPatterns,
          telemetry
        }),
      });

      const data = await res.json();
      setFeedback(data);
      
      // Save result for the final summary
      setSessionResults(prev => [...prev, {
        question: problem.textPrompt,
        answer: submission,
        expected: problem.expectedAnswer,
        isCorrect: data.correct,
        feedback: data.remediationString
      }]);
      
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextProblem = () => {
    if (questionCount >= MAX_QUESTIONS) {
      setIsSessionComplete(true);
    } else {
      setQuestionCount(prev => prev + 1);
    }
  };

  if (rateLimitError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-400 p-6">
        <Brain className="mb-4" size={48} />
        <h2 className="text-2xl font-bold uppercase tracking-wider mb-2">Neural Link Overloaded</h2>
        <p className="text-slate-400 text-sm text-center max-w-md mb-8">
          The Gemini 3.6 Flash API Free Tier limits requests to 15 per minute. You have clicked through questions too quickly and hit the rate limit! Please wait 30 seconds for the quota to reset.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="glass-btn-primary px-8"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (isLoading && !isSessionComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-cyan-400">
        <Brain className="animate-pulse mb-4" size={48} />
        <p className="uppercase tracking-widest text-sm mb-2">Synthesizing AI Quiz... {questionCount}/{MAX_QUESTIONS}</p>
        <p className="text-slate-500 text-xs italic text-center max-w-sm">
          Please wait. Generating dynamic, cryptographically unique questions via the OpenRouter Free Tier can take up to 30-40 seconds per question.
        </p>
      </div>
    );
  }
  
  if (isSessionComplete) {
    const score = sessionResults.filter(r => r.isCorrect).length;
    return (
      <main className="min-h-screen flex flex-col p-6 items-center py-12">
         <div className="w-full max-w-4xl glass-panel p-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 uppercase tracking-wider mb-2 text-center">Session Complete</h1>
            <p className="text-slate-400 text-center mb-8 uppercase tracking-widest text-sm">You scored {score} out of {MAX_QUESTIONS}</p>
            
            <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
              {sessionResults.map((result, idx) => (
                <div key={idx} className={`p-5 rounded-xl border ${result.isCorrect ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                  <div className="flex items-start gap-3">
                     {result.isCorrect ? <CheckCircle className="text-green-400 mt-1" size={20} /> : <XCircle className="text-red-400 mt-1" size={20} />}
                     <div>
                       <p className="text-white font-medium mb-2">{idx + 1}. {result.question}</p>
                       <p className="text-slate-400 text-sm mb-1">Your Answer: <span className={result.isCorrect ? 'text-green-300' : 'text-red-300'}>{result.answer}</span></p>
                       {!result.isCorrect && (
                         <>
                           <p className="text-slate-400 text-sm mb-3">Correct Answer: <span className="text-cyan-300">{result.expected}</span></p>
                             <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg text-purple-200 text-sm">
                               <span className="font-bold uppercase tracking-wider text-xs block mb-2">AI Remediation & Materials:</span>
                               <div className="space-y-1">
                                 {result.feedback?.split('\n').map((line: string, i: number) => (
                                   <p key={i} className={`${line.trim().startsWith('-') ? 'ml-4 flex gap-2 items-start' : ''}`}>
                                     {line.trim().startsWith('-') && <span className="text-purple-400 mt-[2px]">•</span>}
                                     <span>{line.replace(/^-/, '').trim()}</span>
                                   </p>
                                 ))}
                               </div>
                             </div>
                         </>
                       )}
                     </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-center gap-4">
              <button onClick={() => router.push('/profile')} className="glass-btn-primary px-8">View Mastery Profile</button>
              <button onClick={() => router.push('/explore')} className="glass-btn-secondary px-8">Explore New Topic</button>
            </div>
         </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Left Column: Learning Interface */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="glass-panel p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain className="text-purple-400" size={28} />
            <div>
              <h1 className="text-xl font-bold uppercase tracking-widest text-slate-200">Adaptive Diagnosis</h1>
              <p className="text-xs text-cyan-400 tracking-widest">Question {questionCount} of {MAX_QUESTIONS}</p>
            </div>
          </div>
          <button onClick={() => router.push('/explore')} className="glass-btn-secondary">
            <Home size={16} className="mr-2" /> Exit
          </button>
        </div>

        {problem && (
          <div className="glass-panel p-8 flex-1 flex flex-col">
            <div className="mb-8">
              <h2 className="text-xl text-white mb-6 leading-relaxed">{problem.textPrompt}</h2>
              <ModalityCanvas problem={problem} currentModality={telemetry.activeModality} />
            </div>

            <form onSubmit={handleSubmit} className="mt-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {shuffledOptions.map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSubmission(option)}
                    disabled={isSubmitting || !!feedback}
                    className={`p-4 text-left rounded-xl border transition-all ${
                      submission === option 
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !!feedback || !submission}
                  className="glass-btn-primary flex-1 py-4"
                >
                  {isSubmitting ? 'Evaluating Neural Patterns...' : 'Submit Final Answer'}
                </button>
              </div>
            </form>

            {feedback && (
              <div className={`mt-6 p-6 rounded-xl border ${feedback.correct ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                <h3 className={`text-lg font-bold uppercase tracking-wider mb-4 ${feedback.correct ? 'text-green-400' : 'text-red-400'}`}>
                  {feedback.correct ? 'Match Confirmed' : 'Friction Detected'}
                </h3>
                <div className="text-slate-300 text-sm leading-relaxed space-y-2">
                  {feedback.remediationString?.split('\n').map((line: string, i: number) => (
                    <p key={i} className={`${line.trim().startsWith('-') ? 'ml-4 flex gap-2 items-start text-cyan-200' : ''}`}>
                      {line.trim().startsWith('-') && <span className="text-cyan-400 mt-[2px]">•</span>}
                      <span>{line.replace(/^-/, '').trim()}</span>
                    </p>
                  ))}
                </div>
                
                <button
                  onClick={handleNextProblem}
                  className="mt-4 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest text-sm font-bold"
                >
                  {questionCount >= MAX_QUESTIONS ? 'Complete Session' : 'Next Diagnostic Node'} <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: HUD */}
      <div className="hidden lg:block h-[calc(100vh-3rem)]">
         {/* Since HUD renders React Flow, we just wrap it in a glass panel */}
         <div className="h-full w-full glass-panel overflow-hidden border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)] relative">
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1 rounded border border-white/10 uppercase tracking-widest text-[10px] text-cyan-400">
               Live Mastery Telemetry
            </div>
            {studentId && <TelemetryConsole 
              activeNodeId={currentNodeId}
              diagnosedGapNodeId={feedback?.diagnosedGapNodeId || null}
              cfs={feedback?.cfs || 0}
            />}
         </div>
      </div>
    </main>
  );
}
