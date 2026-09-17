'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/store';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { User, Activity } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { studentId } = useSessionStore();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      router.push('/');
      return;
    }

    async function fetchProfile() {
      try {
        const res = await fetch(`/api/dashboard/${studentId}`);
        if (res.ok) {
          const profileData = await res.json();
          setData(profileData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [studentId, router]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-cyan-400">Loading Profile...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-red-400">Failed to load profile.</div>;

  const domainScores: Record<string, { total: number, count: number }> = {};
  
  data.nodes.forEach((node: any) => {
    if (node.isAtomic && node.parentDomainId) {
      // Traverse up the tree to find the macro root domain (tier 0 or 1)
      let current = data.nodes.find((n: any) => n.id === node.parentDomainId);
      while (current && current.tier > 1) {
        current = data.nodes.find((n: any) => n.id === current.parentDomainId);
      }
      
      if (current) {
        // Shorten long domain names to prevent UI clutter
        let domainName = current.label;
        if (domainName.length > 15) {
           domainName = domainName.split(' ')[0]; // E.g., "Applied Sciences..." -> "Applied"
        }

        const state = data.masteryStates[node.id] || { pMastery: 0.1 };
        
        if (!domainScores[domainName]) {
          domainScores[domainName] = { total: 0, count: 0 };
        }
        domainScores[domainName].total += state.pMastery;
        domainScores[domainName].count += 1;
      }
    }
  });

  const chartData = Object.keys(domainScores).map(domain => ({
    subject: domain,
    A: Math.round((domainScores[domain].total / domainScores[domain].count) * 100),
    fullMark: 100,
  }));

  while (chartData.length > 0 && chartData.length < 3) {
      chartData.push({ subject: 'Pending', A: 0, fullMark: 100 });
  }

  // Custom styling for Tooltip in Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 border border-cyan-500/50 p-3 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-md">
          <p className="text-cyan-400 font-bold tracking-wider uppercase text-xs mb-1">{payload[0].payload.subject}</p>
          <p className="text-white text-sm">Mastery: <span className="text-purple-400 font-bold">{payload[0].value}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="min-h-screen flex flex-col p-6 items-center py-12">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 border border-white/20 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] text-purple-400">
              <User size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 uppercase tracking-wider">Cognitive Profile</h1>
              <p className="text-slate-400 text-sm tracking-widest uppercase">Mastery Telemetry</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/explore')}
            className="glass-btn-secondary"
          >
            Back to Matrix
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Radar Chart Card */}
          <div className="glass-panel p-6 flex flex-col">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-3 uppercase tracking-wider text-slate-200 border-b border-white/10 pb-4">
              <Activity className="text-purple-400" size={20} /> Domain Analysis
            </h2>
            <div className="h-80 w-full flex-1">
              {chartData.length >= 3 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} />
                    <Radar
                      name="Mastery (%)"
                      dataKey="A"
                      stroke="#a855f7"
                      strokeWidth={2}
                      fill="url(#colorUv)"
                      fillOpacity={0.5}
                    />
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 uppercase tracking-widest text-sm text-center px-8">
                  Insufficient telemetry data. Engage quizzes to populate matrix.
                </div>
              )}
            </div>
          </div>

          {/* Weak Points & Recommendations */}
          <div className="glass-panel p-6 flex flex-col">
             <h2 className="text-lg font-bold mb-6 uppercase tracking-wider text-slate-200 border-b border-white/10 pb-4">
               Critical Weak Points
             </h2>
             <div className="space-y-4 text-sm flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(data.masteryStates).filter(([_, state]: any) => state.pMastery < 0.7).length === 0 ? (
                  <p className="text-slate-500 italic">No critical weak points detected. Keep exploring new domains.</p>
                ) : (
                  Object.entries(data.masteryStates)
                    .filter(([_, state]: any) => state.pMastery < 0.7)
                    .sort(([,a]: any, [,b]: any) => a.pMastery - b.pMastery)
                    .slice(0, 5)
                    .map(([nodeId, state]: any) => {
                      const node = data.nodes.find((n: any) => n.id === nodeId);
                      const masteryPercent = Math.round(state.pMastery * 100);
                      return (
                        <div key={nodeId} className="p-4 bg-red-900/10 border border-red-500/20 rounded-xl flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-red-400">{node?.label || 'Custom Topic'}</span>
                            <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                              {masteryPercent}% Mastery
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed">
                            {state.misconceptionLabel ? `Recurring friction detected: "${state.misconceptionLabel}"` : 'Algorithmic friction detected. Target this node for immediate remediation.'}
                          </p>
                          <button 
                            onClick={() => {
                              useSessionStore.getState().setSession(studentId, nodeId);
                              router.push('/learn');
                            }}
                            className="mt-2 text-cyan-400 text-xs font-bold uppercase tracking-wider text-left hover:text-cyan-300"
                          >
                            Generate Remediation Quiz →
                          </button>
                        </div>
                      );
                    })
                )}
             </div>
          </div>
        </div>

        {/* Historical AI Study Reports */}
        <div className="mt-8 glass-panel p-6">
           <h2 className="text-lg font-bold mb-6 flex items-center gap-3 uppercase tracking-wider text-slate-200 border-b border-white/10 pb-4">
             <BookOpen className="text-purple-400" size={20} /> Historical AI Study Reports
           </h2>
           <div className="space-y-6">
              {!data.sessionReports || data.sessionReports.length === 0 ? (
                <div className="text-center py-12 text-slate-500 uppercase tracking-widest text-sm">
                  No exam reports generated yet. Complete a batch exam to generate learning materials.
                </div>
              ) : (
                data.sessionReports.map((report: any) => (
                  <div key={report.id} className="p-6 bg-black/40 border border-white/10 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-purple-500"></div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-cyan-300">{report.node?.label || 'Custom Topic'}</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                          {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-black ${report.score === report.totalQuestions ? 'text-green-400' : 'text-purple-400'}`}>
                          {report.score} / {report.totalQuestions}
                        </div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Score</p>
                      </div>
                    </div>
                    {report.score < report.totalQuestions && (
                      <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg text-purple-200 text-sm leading-relaxed space-y-2">
                        {report.remediationText.split('\n').map((line: string, i: number) => (
                          <p key={i} className={`${line.trim().startsWith('-') ? 'ml-4 flex gap-2 items-start text-cyan-200' : ''}`}>
                            {line.trim().startsWith('-') && <span className="text-cyan-400 mt-[2px]">•</span>}
                            <span>{line.replace(/^-/, '').trim()}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
           </div>
        </div>

      </div>
    </main>
  );
}
