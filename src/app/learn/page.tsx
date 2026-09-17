'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/store';
import { TelemetryConsole } from '@/components/TelemetryConsole';
import { Brain, ArrowRight, Home, CheckCircle, XCircle } from 'lucide-react';

export default function LearnPage() {
  const router = useRouter();
  const { studentId, currentNodeId: storeNodeId } = useSessionStore();
  
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(storeNodeId);
  const [problems, setProblems] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [rateLimitError, setRateLimitError] = useState(false);
  
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [batchReport, setBatchReport] = useState<any>(null);

  const [telemetry, setTelemetry] = useState({
    timeToFirstAction: 0,
    hesitationPauses: 0,
    answerFlips: 0,
    activeModality: 'TEXT' as 'TEXT' | 'VISUAL' | 'AUDIO'
  });

  useEffect(() => {
    if (!studentId || !currentNodeId) {
      router.push('/explore');
      return;
    }

    async function fetchProblems() {
      setIsLoading(true);
      setRateLimitError(false);
      
      try {
        const res = await fetch(`/api/generate-quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeId: currentNodeId, studentId: studentId }),
        });
        
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProblems(data);
            shuffleOptionsForProblem(data[0]);
          }
        } else {
           setRateLimitError(true);
        }
      } catch (e) {
        console.error(e);
        setRateLimitError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProblems();
  }, [studentId, currentNodeId]);

  const shuffleOptionsForProblem = (problem: any) => {
    let wrongAnswers: string[] = [];
    if (problem.antiPatterns) {
      try {
        const parsed = typeof problem.antiPatterns === 'string' ? JSON.parse(problem.antiPatterns) : problem.antiPatterns;
        wrongAnswers = Object.keys(parsed);
      } catch (e) {
        console.error(e);
      }
    }
    const options = [problem.expectedAnswer, ...wrongAnswers];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    setShuffledOptions(options);
  };

  const handleOptionClick = async (selectedOption: string) => {
    const newAnswers = [...userAnswers, selectedOption];
    setUserAnswers(newAnswers);

    if (currentIdx + 1 >= problems.length) {
      // Finished all questions
      setIsSessionComplete(true);
      submitBatchForGrading(newAnswers);
    } else {
      // Go to next question instantly
      setCurrentIdx(currentIdx + 1);
      shuffleOptionsForProblem(problems[currentIdx + 1]);
    }
  };

  const submitBatchForGrading = async (finalAnswers: string[]) => {
    setIsGrading(true);
    try {
      const results = problems.map((p, i) => ({
        isCorrect: finalAnswers[i] === p.expectedAnswer,
        expectedAnswer: p.expectedAnswer,
        submission: finalAnswers[i],
        textPrompt: p.textPrompt,
      }));

      const res = await fetch('/api/diagnose-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          nodeId: currentNodeId,
          results,
          telemetry
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBatchReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGrading(false);
    }
  };

  if (rateLimitError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-400 p-6">
        <Brain className="mb-4" size={48} />
        <h2 className="text-2xl font-bold uppercase tracking-wider mb-2">Neural Link Overloaded</h2>
        <p className="text-slate-400 text-sm text-center max-w-md mb-8">
          The Gemini API limits request rates on this free tier. Please wait 30 seconds for the quota to reset.
        </p>
        <button onClick={() => window.location.reload()} className="glass-btn-primary px-8">
          Retry Connection
        </button>
      </div>
    );
  }

  if (isLoading && !isSessionComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-cyan-400">
        <Brain className="animate-pulse mb-4" size={48} />
        <p className="uppercase tracking-widest text-sm mb-2">Synthesizing 10-Question Batch Exam...</p>
        <p className="text-slate-500 text-xs italic text-center max-w-sm">
          Please wait. Generating 10 cryptographically unique questions simultaneously via Gemini can take ~15 seconds.
        </p>
      </div>
    );
  }
  
  if (isSessionComplete) {
    if (isGrading || !batchReport) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-purple-400">
          <Brain className="animate-pulse mb-4" size={48} />
          <p className="uppercase tracking-widest text-sm mb-2">Grading Neural Pathways...</p>
          <p className="text-slate-500 text-xs italic text-center max-w-sm">
            Evaluating your cognitive friction and compiling targeted learning materials.
          </p>
        </div>
      );
    }

    const score = batchReport.score;
    const MAX_QUESTIONS = problems.length;

    return (
      <main className="min-h-screen flex flex-col p-6 items-center py-12">
          <div className="w-full max-w-4xl glass-panel p-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 uppercase tracking-wider mb-2 text-center">Exam Complete</h1>
            <p className="text-slate-400 text-center mb-8 uppercase tracking-widest text-sm">You scored {score} out of {MAX_QUESTIONS}</p>
            
            {/* Unified Remediation Report */}
            {score < MAX_QUESTIONS && (
              <div className="mb-8">
                <div className="p-6 bg-purple-900/20 border border-purple-500/30 rounded-xl mb-6">
                  <h3 className="text-xl font-bold uppercase tracking-wider mb-4 text-purple-400">Comprehensive Remediation Report</h3>
                  <div className="text-purple-200 text-sm leading-relaxed space-y-2">
                    {batchReport.remediationReport?.split('\n').map((line: string, i: number) => (
                      <p key={i} className={`${line.trim().startsWith('-') ? 'ml-4 flex gap-2 items-start text-cyan-200' : ''}`}>
                        {line.trim().startsWith('-') && <span className="text-cyan-400 mt-[2px]">•</span>}
                        <span>{line.replace(/^-/, '').trim()}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* Prerequisite Visual Graph */}
                {batchReport.prerequisiteGraph?.sources?.length > 0 && (
                  <div className="p-8 bg-black/40 border border-white/10 rounded-xl flex flex-col items-center">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                      <Brain size={16} /> Prerequisite Skill Tree
                    </h4>
                    <div className="flex flex-col items-center w-full">
                      <div className="flex flex-wrap justify-center gap-6 mb-6 w-full relative">
                        {batchReport.prerequisiteGraph.sources.map((src: any) => (
                          <div key={src.id} className="relative z-10 px-6 py-3 bg-cyan-900/40 border border-cyan-500/50 rounded-lg text-cyan-200 text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                            {src.label}
                            {/* Down arrow connector */}
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-px h-6 bg-cyan-500/50"></div>
                          </div>
                        ))}
                      </div>
                      <div className="w-px h-6 bg-gradient-to-b from-cyan-500/50 to-red-500/50 mb-2"></div>
                      <div className="px-8 py-4 bg-red-900/40 border border-red-500/50 rounded-lg text-red-200 font-bold text-lg shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        {batchReport.prerequisiteGraph.target.label} (Target)
                      </div>
                      <p className="text-xs text-slate-500 mt-6 max-w-md text-center uppercase tracking-widest">
                        Master the cyan foundational nodes above before attempting to clear the target node again.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-6 max-h-[50vh] overflow-y-auto custom-scrollbar pr-4">
              {problems.map((prob, idx) => {
                const isCorrect = userAnswers[idx] === prob.expectedAnswer;
                return (
                  <div key={idx} className={`p-5 rounded-xl border ${isCorrect ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                    <div className="flex items-start gap-3">
                       {isCorrect ? <CheckCircle className="text-green-400 mt-1" size={20} /> : <XCircle className="text-red-400 mt-1" size={20} />}
                       <div>
                         <p className="text-white font-medium mb-2">{idx + 1}. {prob.textPrompt}</p>
                         <p className="text-slate-400 text-sm mb-1">Your Answer: <span className={isCorrect ? 'text-green-300' : 'text-red-300'}>{userAnswers[idx]}</span></p>
                         {!isCorrect && (
                           <p className="text-slate-400 text-sm">Correct Answer: <span className="text-cyan-300">{prob.expectedAnswer}</span></p>
                         )}
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 flex justify-center gap-4">
              <button onClick={() => router.push('/profile')} className="glass-btn-primary px-8">View Mastery Profile</button>
              <button onClick={() => router.push('/explore')} className="glass-btn-secondary px-8">Explore New Topic</button>
            </div>
         </div>
      </main>
    );
  }

  const currentProblem = problems[currentIdx];

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="glass-panel p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain className="text-purple-400" size={28} />
            <div>
              <h1 className="text-xl font-bold uppercase tracking-widest text-slate-200">Adaptive Exam</h1>
              <p className="text-xs text-cyan-400 tracking-widest">Question {currentIdx + 1} of {problems.length}</p>
            </div>
          </div>
          <button onClick={() => router.push('/explore')} className="glass-btn-secondary">
            <Home size={16} className="mr-2" /> Exit
          </button>
        </div>

        {currentProblem && (
          <div className="glass-panel p-8 flex-1 flex flex-col">
            <div className="mb-8">
              <h2 className="text-xl text-white mb-6 leading-relaxed">{currentProblem.textPrompt}</h2>
            </div>

            <div className="mt-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {shuffledOptions.map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOptionClick(option)}
                    className="p-4 text-left rounded-xl border transition-all bg-white/5 border-white/10 text-slate-300 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-cyan-300"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hidden lg:block h-[calc(100vh-3rem)]">
         <div className="h-full w-full glass-panel overflow-hidden border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)] relative">
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1 rounded border border-white/10 uppercase tracking-widest text-[10px] text-cyan-400">
               Live Mastery Telemetry
            </div>
            {studentId && <TelemetryConsole 
              activeNodeId={currentNodeId}
              diagnosedGapNodeId={null}
              cfs={0}
            />}
         </div>
      </div>
    </main>
  );
}
