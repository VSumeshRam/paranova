'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/store';
import { GraphHUD } from '@/components/GraphHUD';
import { Network, ArrowLeft } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { studentId, currentNodeId, setSession } = useSessionStore();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      router.push('/');
      return;
    }

    async function fetchDashboard() {
      try {
        const res = await fetch(`/api/dashboard/${studentId}`);
        if (res.ok) {
          const dashboardData = await res.json();
          setData(dashboardData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, [studentId]);

  const handleNextProblem = () => {
    if (data?.diagnosedGapNodeId) {
      // Step backward to remediate
      setSession(studentId!, data.diagnosedGapNodeId);
      router.push('/learn');
    } else {
      // Continue or advance
      // For this prototype, we'll just go back to learn on the same node 
      // or advance if mastered (advanced logic would pick next node)
      router.push('/learn');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading Diagnostics...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center">Failed to load diagnostics.</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col p-6">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Network className="text-blue-600" size={32} />
          Cognitive Diagnostic Graph
        </h1>
        
        <button
          onClick={handleNextProblem}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          {data.diagnosedGapNodeId ? 'Start Remediation Sequence' : 'Continue Assessment'}
        </button>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden shadow-xl border border-gray-200">
        <GraphHUD 
          nodesData={data.nodes}
          edgesData={data.edges}
          masteryStates={data.masteryStates}
          activeNodeId={data.activeNodeId}
          diagnosedGapNodeId={data.diagnosedGapNodeId}
          activeAntiPatternNodeId={data.activeAntiPatternNodeId}
        />
      </div>
      
    </main>
  );
}
