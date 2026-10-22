import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { TOOLS, CONSTELLATIONS } from '../catalog';
import { type Tool } from '../types';

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
      <div className="border-b border-[#E0FFC2]/15 pb-6">
        <div className="text-[10px] font-mono tracking-widest uppercase text-[#E0FFC2] font-bold mb-1">
          MCP TOOL DIRECTORY
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#F2FDF0] tracking-wide">
          Index of 240 Stars
        </h1>
        <p className="text-sm font-body text-[#C2E2BE] max-w-xl mt-2 leading-relaxed">
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
                ? 'bg-[#E0FFC2] text-[#04241B] shadow-[0_0_14px_rgba(224,255,194,0.35)]'
                : 'border border-[#E0FFC2]/15 text-[#C2E2BE] hover:text-[#F2FDF0] hover:bg-[#064734]/30'
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
                  ? 'bg-[#E0FFC2] text-[#04241B] font-bold shadow-[0_0_14px_rgba(224,255,194,0.35)]'
                  : 'border border-[#E0FFC2]/15 text-[#C2E2BE] hover:text-[#F2FDF0] hover:bg-[#064734]/30'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search Box */}
        {/* Search Box */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-[#82A98B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 240 tools..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E0FFC2]/20 bg-[#02120e] text-xs font-mono text-[#F2FDF0] placeholder:text-[#82A98B]/70 focus:outline-none focus:border-[#E0FFC2] transition-colors"
          />
        </div>

      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => setActiveTool(tool)}
            className="p-4 rounded-xl border border-[#E0FFC2]/15 bg-[#041c14]/80 hover:border-[#E0FFC2]/60 hover:bg-[#064734]/35 hover:shadow-[0_0_18px_rgba(224,255,194,0.18)] cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#E0FFC2] uppercase mb-1 font-semibold">
                <span>{tool.category}</span>
                <span className="text-[#82A98B] group-hover:text-[#E0FFC2]">
                  ({tool.x}, {tool.y})
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-[#F2FDF0] group-hover:text-[#E0FFC2] transition-colors mb-1">
                {tool.name.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs text-[#C2E2BE] leading-relaxed mb-3 font-body">
                {tool.descriptor}
              </p>
            </div>

            <div className="text-[11px] font-mono text-[#82A98B] border-t border-[#E0FFC2]/10 pt-2 flex items-center justify-between">
              <span>{tool.id}</span>
              <span className="text-[#E0FFC2] text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#064734] border border-[#E0FFC2]/30">Inspect</span>
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
            className="max-w-xl w-full rounded-xl border border-[#E0FFC2]/50 bg-[#041c14] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E0FFC2]/15 pb-3">
              <div>
                <span className="font-mono text-xs text-[#E0FFC2] uppercase tracking-wider">{activeTool.category} SUBSYSTEM</span>
                <h2 className="font-display text-2xl font-bold text-[#F2FDF0]">
                  {activeTool.name.replace(/_/g, ' ')}
                </h2>
              </div>
              <button 
                onClick={() => setActiveTool(null)}
                className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border border-[#E0FFC2]/30 hover:border-[#E0FFC2] text-[#C2E2BE] hover:text-[#E0FFC2] bg-[#064734]/40 transition-all"
              >
                <X className="w-3.5 h-3.5 text-[#E0FFC2]" />
                <span>Close</span>
              </button>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-[#E0FFC2] mb-1 font-semibold">Decider Option Descriptor (≤ 12 words)</div>
              <div className="p-3 rounded-lg bg-[#02120e] border border-[#E0FFC2]/20 text-xs font-mono text-[#E0FFC2]">
                "{activeTool.descriptor}"
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-[#82A98B] mb-1 font-semibold">Full Tool Description</div>
              <p className="text-xs text-[#C2E2BE] leading-relaxed font-body">
                {activeTool.description}
              </p>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-[#82A98B] mb-1 font-semibold">Catalog Identifier & Coordinates</div>
              <div className="text-xs font-mono text-[#82A98B]">
                <code className="text-[#E0FFC2]">id: "{activeTool.id}"</code> · <code>coordinates: ({activeTool.x}, {activeTool.y})</code>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
