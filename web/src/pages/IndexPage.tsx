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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Title */}
      <div className="border-b border-[var(--line)] pb-5">
        <div className="text-[10px] font-mono tracking-widest uppercase text-[var(--brass)]">
          CATALOG REPOSITORY
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--parchment)] tracking-wide">
          Index of Stars
        </h1>
        <p className="text-sm font-body text-[var(--parchment-dim)] max-w-xl mt-2">
          Directory of all 240 simulated tools organized across 12 celestial constellations. Each instrument features precomputed coordinates and calibrated 12-word decider descriptors.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Constellation Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none text-xs font-mono">
          <button
            onClick={() => setSelectedConstellation('all')}
            className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
              selectedConstellation === 'all'
                ? 'bg-[var(--brass)] text-[var(--ink-900)] font-bold'
                : 'border border-[var(--line)] text-[var(--parchment-dim)] hover:text-[var(--parchment)]'
            }`}
          >
            All 240
          </button>
          {CONSTELLATIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedConstellation(c.id)}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                selectedConstellation === c.id
                  ? 'bg-[var(--brass)] text-[var(--ink-900)] font-bold'
                  : 'border border-[var(--line)] text-[var(--parchment-dim)] hover:text-[var(--parchment)]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-[var(--parchment-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 240 tools..."
            className="w-full pl-9 pr-4 py-1.5 rounded border border-[var(--line)] bg-[var(--ink-900)] text-xs font-mono text-[var(--parchment)] placeholder:text-[var(--parchment-muted)] focus:outline-none focus:border-[var(--brass)]"
          />
        </div>

      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => setActiveTool(tool)}
            className="p-4 rounded border border-[var(--line)] bg-[var(--ink-800)]/70 hover:border-[var(--brass)] cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[var(--brass)] uppercase mb-1">
                <span>{tool.category}</span>
                <span className="text-[var(--parchment-muted)] group-hover:text-[var(--brass-bright)]">
                  ({tool.x}, {tool.y})
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg text-[var(--parchment)] group-hover:text-[var(--brass-bright)] transition-colors mb-1">
                {tool.name.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs text-[var(--parchment-dim)] leading-relaxed mb-3">
                {tool.descriptor}
              </p>
            </div>

            <div className="text-[11px] font-mono text-[var(--parchment-muted)] border-t border-[var(--line)]/50 pt-2 flex items-center justify-between">
              <span>{tool.id}</span>
              <span className="text-[var(--brass)] text-[10px] uppercase">Inspect</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tool Detail Modal */}
      {activeTool && (
        <div 
          onClick={() => setActiveTool(null)}
          className="fixed inset-0 z-50 bg-[var(--ink-900)]/80 backdrop-blur flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full plate border-[var(--brass)] bg-[var(--ink-800)] p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <span className="plate-tag">{activeTool.category} SUBSYSTEM</span>
                <h2 className="font-display text-2xl font-bold text-[var(--parchment)]">
                  {activeTool.name.replace(/_/g, ' ')}
                </h2>
              </div>
              <button 
                onClick={() => setActiveTool(null)}
                className="text-xs font-mono px-2 py-1 rounded border border-[var(--line)] hover:border-[var(--parchment)]"
              >
                ✕ Close
              </button>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-[var(--brass)] mb-1">Decider Option Descriptor (≤ 12 words)</div>
              <div className="p-2.5 rounded bg-[var(--ink-900)] border border-[var(--line)] text-xs font-mono text-[var(--brass-bright)]">
                "{activeTool.descriptor}"
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-[var(--parchment-muted)] mb-1">Full Tool Description</div>
              <p className="text-xs text-[var(--parchment-dim)] leading-relaxed">
                {activeTool.description}
              </p>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-[var(--parchment-muted)] mb-1">Catalog Identifier & Coordinates</div>
              <div className="text-xs font-mono text-[var(--parchment-dim)]">
                <code>id: "{activeTool.id}"</code> · <code>coordinates: ({activeTool.x}, {activeTool.y})</code>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
