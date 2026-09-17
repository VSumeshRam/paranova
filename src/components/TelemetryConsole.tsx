'use client';

import { useEffect, useState, useRef } from 'react';

interface TelemetryConsoleProps {
  activeNodeId: string | null;
  diagnosedGapNodeId: string | null;
  cfs: number;
}

export function TelemetryConsole({ activeNodeId, diagnosedGapNodeId, cfs }: TelemetryConsoleProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const time = new Date().toLocaleTimeString();
    if (activeNodeId) {
      setLogs(prev => [...prev, `[${time}] SYSTEM: Locking onto neural pathway ${activeNodeId}...`]);
    }
  }, [activeNodeId]);

  useEffect(() => {
    if (diagnosedGapNodeId) {
      const time = new Date().toLocaleTimeString();
      setLogs(prev => [...prev, `[${time}] WARNING: Diagnostic gap isolated at ${diagnosedGapNodeId}. Re-routing telemetry.`]);
    }
  }, [diagnosedGapNodeId]);

  useEffect(() => {
    if (cfs > 0) {
      const time = new Date().toLocaleTimeString();
      setLogs(prev => [...prev, `[${time}] TELEMETRY: Cognitive friction calculated at ${cfs.toFixed(2)}.`]);
    }
  }, [cfs]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-full relative border border-cyan-500/20 rounded-xl overflow-hidden bg-black/40 shadow-inner flex flex-col font-mono">
      <div className="bg-cyan-900/40 border-b border-cyan-500/20 p-3 text-cyan-400 font-bold uppercase tracking-widest text-xs flex justify-between">
        <span>BKT Telemetry Stream</span>
        <span className="animate-pulse flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400"></div> Live
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-2">
        {logs.map((log, i) => (
          <div key={i} className="text-cyan-500/70 text-xs">
            {log}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-slate-600 text-xs italic">Awaiting neural input...</div>
        )}
      </div>
    </div>
  );
}
