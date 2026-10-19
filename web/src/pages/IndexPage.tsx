import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { TOOLS, CONSTELLATIONS } from '../catalog';
import { Tool } from '../types';

export const IndexPage: React.FC = () => {
  const [selectedConstellation, setSelectedConstellation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTool, setActiveTool] = useState<Tool | null>(null);

  const filteredTools = TOOLS.filter((t) => {
    const matchesCategory = selectedConstellation === 'all' || t.category === selectedConstellation;
    const matchesSearch = searchQuery === '' || 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.descriptor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      
      {/* Title */}
      <div className="border-b border-white/10 pb-6">
        <div className="text-[10px] font-mono tracking-widest uppercase text-amber-300 font-bold mb-1">
          MCP TOOL DIRECTORY
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-slate-100 tracking-wide">
          Index of 240 Stars
        </h1>
        <p className="text-sm font-body text-slate-300 max-w-xl mt-2 leading-relaxed">
          Searchable catalog of 240 instruments across 12 celestial constellations, each with precomputed SVG sky coordinates and calibrated 12-word Decider descriptors.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Constellation Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none text-xs font-mono">
          <button
            onClick={() => setSelectedConstellation('all')}
            className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap font-bold ${
              selectedConstellation === 'all'
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,208,97,0.3)]'
                : 'border border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            All 240
          </button>
          {CONSTELLATIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedConstellation(c.id)}
              className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                selectedConstellation === c.id
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,208,97,0.3)]'
                  : 'border border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 240 tools..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/10 bg-[#02040A] text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => setActiveTool(tool)}
            className="p-4 rounded-xl border border-white/10 bg-[#050A15]/80 hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(245,208,97,0.1)] cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 uppercase mb-1">
                <span>{tool.category}</span>
                <span className="text-slate-500 group-hover:text-amber-200">
                  ({tool.x}, {tool.y})
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-slate-100 group-hover:text-amber-300 transition-colors mb-1">
                {tool.name.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {tool.descriptor}
              </p>
            </div>

            <div className="text-[11px] font-mono text-slate-400 border-t border-white/5 pt-2 flex items-center justify-between">
              <span>{tool.id}</span>
              <span className="text-amber-300 text-[10px] uppercase font-bold">Inspect</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tool Modal */}
      {activeTool && (
        <div 
          onClick={() => setActiveTool(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full rounded-xl border border-amber-400/50 bg-[#050A15] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="font-mono text-xs text-amber-300 uppercase tracking-wider">{activeTool.category} SUBSYSTEM</span>
                <h2 className="font-display text-2xl font-bold text-slate-100">
                  {activeTool.name.replace(/_/g, ' ')}
                </h2>
              </div>
              <button 
                onClick={() => setActiveTool(null)}
                className="text-xs font-mono px-3 py-1 rounded border border-white/10 hover:border-white text-slate-300"
              >
                ✕ Close
              </button>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-amber-300 mb-1">Decider Option Descriptor (≤ 12 words)</div>
              <div className="p-3 rounded-lg bg-[#02040A] border border-white/10 text-xs font-mono text-cyan-300">
                "{activeTool.descriptor}"
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">Full Tool Description</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeTool.description}
              </p>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">Catalog Identifier & Coordinates</div>
              <div className="text-xs font-mono text-slate-300">
                <code>id: "{activeTool.id}"</code> · <code>coordinates: ({activeTool.x}, {activeTool.y})</code>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
