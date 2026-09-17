'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/store';
import { Network, ChevronRight, BookOpen, Search } from 'lucide-react';

export default function ExplorePage() {
  const router = useRouter();
  const { studentId, setSession } = useSessionStore();
  const [nodes, setNodes] = useState<any[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!studentId) {
      router.push('/');
      return;
    }
    fetch('/api/explore')
      .then(res => res.json())
      .then(data => {
        setNodes(data);
        setIsLoading(false);
      });
  }, [studentId, router]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    try {
      const res = await fetch('/api/custom-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: searchQuery })
      });
      const data = await res.json();
      
      // Launch directly into the quiz for the custom topic
      setSession(studentId!, data.nodeId);
      router.push('/learn');
    } catch (e) {
      console.error(e);
      setIsSearching(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-cyan-400">Loading Knowledge Matrix...</div>;

  const currentChildren = nodes.filter(n => n.parentDomainId === currentNodeId);

  const handleNodeClick = (node: any) => {
    if (node.isAtomic) {
      setSession(studentId!, node.id);
      router.push('/learn');
    } else {
      setCurrentNodeId(node.id);
    }
  };

  const handleGoBack = () => {
    if (!currentNodeId) return;
    const current = nodes.find(n => n.id === currentNodeId);
    setCurrentNodeId(current?.parentDomainId || null);
  };

  const currentParentNode = nodes.find(n => n.id === currentNodeId);

  return (
    <main className="min-h-screen flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 border border-white/20 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] text-cyan-400">
              <Network size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 uppercase tracking-wider">Tree of Knowledge</h1>
              <p className="text-slate-400 text-sm tracking-widest uppercase">Navigate the Matrix</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="glass-btn-secondary"
          >
            View Profile
          </button>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-8 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ANY topic to generate a dynamic AI Quiz on the fly..." 
              className="glass-input w-full pl-12 py-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
            />
          </div>
          <button 
            type="submit" 
            disabled={isSearching || !searchQuery.trim()}
            className="glass-btn-primary px-8 whitespace-nowrap"
          >
            {isSearching ? 'Generating...' : 'Generate AI Quiz'}
          </button>
        </form>

        <div className="glass-panel overflow-hidden">
          {/* Breadcrumbs */}
          <div className="bg-black/30 px-6 py-4 border-b border-white/10 flex items-center gap-2">
            <button 
              onClick={() => setCurrentNodeId(null)}
              className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-wider"
            >
              Root Domains
            </button>
            {currentNodeId && (
              <>
                <ChevronRight size={16} className="text-slate-600" />
                <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider">{currentParentNode?.label}</span>
                <button 
                  onClick={handleGoBack}
                  className="ml-auto text-xs bg-white/5 border border-white/10 px-3 py-1 rounded hover:bg-white/10 text-slate-300 transition-colors uppercase tracking-widest"
                >
                  Go Back Up
                </button>
              </>
            )}
          </div>

          {/* Branches */}
          <div className="p-6 grid gap-4">
            {currentChildren.length === 0 ? (
              <div className="text-center py-8 text-slate-500 uppercase tracking-widest text-sm">No further branches found.</div>
            ) : (
              currentChildren.map(node => (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`flex items-center justify-between p-6 rounded-xl border-2 text-left transition-all ${
                    node.isAtomic 
                      ? 'border-cyan-500/50 bg-cyan-900/20 hover:bg-cyan-900/40 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]' 
                      : 'border-white/10 bg-black/20 hover:bg-white/5 hover:border-white/30'
                  }`}
                >
                  <div>
                    <h3 className={`text-xl font-bold flex items-center gap-3 tracking-wide ${node.isAtomic ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {node.isAtomic && <BookOpen size={20} className="text-cyan-400" />}
                      {node.label}
                    </h3>
                    <p className="text-sm text-slate-400 mt-2">{node.description}</p>
                  </div>
                  {!node.isAtomic && <ChevronRight className="text-slate-500" />}
                  {node.isAtomic && <span className="text-xs font-bold text-cyan-950 bg-cyan-400 px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.8)]">Engage Quiz</span>}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
