import React, { useState } from 'react';
import { Search, Download, FileText, Save, BrainCircuit, AlertCircle, Map, Sparkles, BookOpen, Lightbulb, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AgentStatusTimeline from '../components/AgentStatusTimeline';
import PaperCard from '../components/PaperCard';
import { TrendChart, KeywordChart } from '../components/Charts';
import { searchPapers, synthesizePapers, citePapers, generateRoadmap } from '../services/api';

const Home = () => {
  const [query, setQuery] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [results, setResults] = useState(null); // { papers: [], analysis: {}, trace: [], session_id: '...' }
  const [selectedPapers, setSelectedPapers] = useState([]);
  
  const [synthesisState, setSynthesisState] = useState({ loading: false, data: null });
  const [citationState, setCitationState] = useState({ loading: false, data: null, format: 'txt', style: 'APA' });
  const [roadmapState, setRoadmapState] = useState({ loading: false, data: null });
  const [error, setError] = useState(null);


  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setResults(null);
    setSelectedPapers([]);
    setSynthesisState({ loading: false, data: null });
    setCitationState({ loading: false, data: null, ...citationState });
    setRoadmapState({ loading: false, data: null });


    try {
      const data = await searchPapers(query, sessionName || undefined);
      setResults(data);
    } catch (err) {
      setError(err.message || 'An error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  };

  const togglePaperSelection = (paper, isSelected) => {
    if (isSelected) {
      setSelectedPapers(prev => [...prev, paper]);
    } else {
      setSelectedPapers(prev => prev.filter(p => p.id !== paper.id));
    }
  };

  const handleSynthesize = async () => {
    if (selectedPapers.length === 0) return;
    setSynthesisState({ ...synthesisState, loading: true, data: null });
    
    // Update local trace to show synthesis running
    if (results && results.trace) {
      const newTrace = [...results.trace, { agent: 'Synthesis', status: 'running' }];
      setResults({ ...results, trace: newTrace });
    }

    try {
      const response = await synthesizePapers(selectedPapers);
      setSynthesisState({ loading: false, data: response.synthesis });
      
      // Update local trace to show synthesis completed
      if (results && results.trace) {
        setResults({ ...results, trace: [...results.trace.filter(t => t.agent !== 'Synthesis'), { agent: 'Synthesis', status: 'completed' }]});
      }
    } catch (err) {
      setSynthesisState({ loading: false, data: { error: err.message } });
    }
  };

  const handleCite = async () => {
    if (selectedPapers.length === 0) return;
    setCitationState({ ...citationState, loading: true });
    
     // Update local trace
     if (results && results.trace) {
      setResults({ ...results, trace: [...results.trace.filter(t => t.agent !== 'Citation'), { agent: 'Citation', status: 'running' }] });
    }

    try {
      const response = await citePapers(selectedPapers, citationState.format, citationState.style);
      setCitationState({ ...citationState, loading: false, data: response.citations });
      
      if (results && results.trace) {
        setResults({ ...results, trace: [...results.trace.filter(t => t.agent !== 'Citation'), { agent: 'Citation', status: 'completed' }]});
      }
    } catch (err) {
      setCitationState({ ...citationState, loading: false, data: err.message });
    }
  };

  const downloadCitations = () => {
    if (!citationState.data) return;
    const blob = new Blob([citationState.data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citations.${citationState.format === 'bib' ? 'bib' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateRoadmap = async () => {
    if (!results || !results.papers) return;
    setRoadmapState({ ...roadmapState, loading: true });
    
    // Update local trace to show roadmap agent running
    const newTrace = [...results.trace, { agent: 'Roadmap Agent', status: 'Generating AI Strategy...' }];
    setResults({ ...results, trace: newTrace });

    try {
      const roadmapData = {
        session_id: results.session_id,
        papers: results.papers,
        trend_data: results.analysis?.publication_trend || [],
        keyword_distribution: results.analysis?.keyword_frequency || [],
        query: results.query
      };
      
      const data = await generateRoadmap(roadmapData);
      setRoadmapState({ loading: false, data });
      
      setResults({ 
        ...results, 
        trace: [...results.trace.filter(t => t.agent !== 'Roadmap Agent'), { agent: 'Roadmap Agent', status: 'Completed' }]
      });
    } catch (err) {
      console.error("Roadmap error: ", err);
      setRoadmapState({ loading: false, data: null });
      setError("Failed to generate roadmap.");
    }
  };

  const triggerNextSearch = (nextQuery) => {
    setQuery(nextQuery);
    // Submit the form programmatically or just call handleSearch
    setTimeout(() => {
      document.getElementById('search-form').requestSubmit();
    }, 100);
  };


  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8, ease: "easeOut" }} 
      className="container mx-auto px-4 py-8"
    >
      
      {/* Search Header section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 tracking-tight"><span className="gradient-text">Orchestrix</span> Intelligence</h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">Multi-agent architecture for automated academic discovery, analysis, and synthesis.</p>
        
        <form id="search-form" onSubmit={handleSearch} className="mt-8 max-w-3xl mx-auto relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative glass-panel rounded-full flex items-center p-2 pl-6 transition-all duration-300 focus-within:glow-shadow focus-within:border-secondary/50">
            <Search className="w-6 h-6 text-gray-400" />
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter research topic (e.g., Quantum Machine Learning)"
              className="flex-1 bg-transparent border-none outline-none text-white px-4 text-lg placeholder-gray-500"
            />
            <input 
              type="text" 
              placeholder="Session Name (opt)" 
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-40 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none hidden md:block mr-2"
            />
            <button 
              type="submit" 
              disabled={isSearching}
              className="shiny-btn bg-primary hover:bg-primary/90 transition-all duration-300 text-white rounded-full px-8 py-3 font-medium flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(107,70,193,0.5)] border border-white/10"
            >
              {isSearching ? <span className="flex gap-1 items-center"><span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span><span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span></span> : 'Research'}
            </button>
          </div>
        </form>
      </div>

      {/* Loading Skeleton */}
      {isSearching && !results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto mb-12">
           <div className="glass-panel p-8 border-t border-primary/30 flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
             <div className="absolute inset-0 shimmer-bg opacity-20"></div>
             <Sparkles className="w-8 h-8 text-secondary animate-pulse relative z-10" />
             <div className="text-white text-lg font-bold tracking-wide flex items-center gap-2 relative z-10">
               Orchestrating Discovery Agents
               <span className="flex gap-1 ml-2">
                 <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-ping"></span>
                 <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-ping" style={{animationDelay: '0.2s'}}></span>
                 <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-ping" style={{animationDelay: '0.4s'}}></span>
               </span>
             </div>
             <p className="text-gray-400 text-sm relative z-10">Initializing research knowledge graph synthesis...</p>
           </div>
        </motion.div>
      )}

      {/* Query Expansion Section (New) */}
      {results && results.expansion_data && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="max-w-4xl mx-auto mb-12 overflow-hidden"
        >
          <div className="glass-panel p-6 border-t border-primary/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-16 h-16 text-primary" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="text-secondary w-5 h-5" /> 
              Query Expansion Performed
            </h2>
            
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
              {/* Original Query Card */}
              <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-1 font-bold">Original Query</div>
                <div className="text-lg text-primary font-medium italic break-words">
                  "{results.expansion_data.original_query}"
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="h-px w-8 bg-white/10 hidden md:block"></div>
                <div className="w-px h-8 bg-white/10 md:hidden"></div>
              </div>

              {/* Expanded Queries */}
              <div className="flex-[2] grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.expansion_data.expanded_queries?.map((exp, idx) => (
                  <div key={idx} className="bg-primary/5 rounded-xl p-4 border border-primary/20 hover:border-primary/40 transition-all cursor-default group/card">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <div className="text-white font-semibold group-hover/card:text-primary transition-colors line-clamp-1">
                        {exp.query}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed italic border-l-2 border-primary/20 pl-2">
                      {exp.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-tighter">
              <div className="w-1 h-1 rounded-full bg-secondary animate-pulse"></div>
              Multi-query orchestration active for increased discovery depth
            </div>
          </div>
        </motion.div>
      )}

      {error && (

        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center justify-center gap-3 mb-8">
          <AlertCircle /> {error}
        </div>
      )}

      {/* Results View */}
      {results && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
          
          <div className="mb-4 hover:glow-shadow transition-shadow duration-500 rounded-xl">
            <AgentStatusTimeline trace={results.trace} />
          </div>

          {/* SECTION 2 — ANALYTICS ROW */}
          {results.analysis && Object.keys(results.analysis).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TrendChart data={results.analysis.publication_trend} />
              <KeywordChart data={results.analysis.keyword_frequency} />
            </div>
          )}

          {/* SECTION 3 — DISCOVERED PAPERS */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <BookOpen className="text-primary w-6 h-6" />
              Discovered Papers
              <span className="text-sm font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
                {results.papers?.length || 0}
              </span>
            </h3>
            
            <div className="flex flex-col gap-5">
              {results.papers && results.papers.map((paper, idx) => (
                <PaperCard 
                  key={paper.id || idx}
                  index={idx}
                  paper={paper} 
                  selected={selectedPapers.some(p => p.id === paper.id)}
                  onSelect={togglePaperSelection}
                />
              ))}
              {results.papers?.length === 0 && (
                <div className="text-center p-12 glass-panel">
                  <p className="text-gray-400">No papers found for this query.</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4 — AGENT STATUS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Side: Citation & Roadmap stacked */}
            <div className="flex flex-col gap-6">
              
              {/* Citation Panel */}
              <div className="glass-panel p-6 flex flex-col justify-between h-full">
                <div className="mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-3 mb-2">
                    <FileText className="text-amber-400 w-6 h-6" />
                    Citation Agent
                  </h3>
                  <p className="text-sm text-gray-400">Generate formatted citations for your selected papers.</p>
                </div>
                
                <div className="flex gap-3 mb-5">
                  <select 
                    className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none flex-1 focus:border-amber-400/50 transition-colors"
                    value={citationState.style}
                    onChange={(e) => setCitationState({...citationState, style: e.target.value})}
                  >
                    <option value="APA">APA Format</option>
                    <option value="IEEE">IEEE Format</option>
                    <option value="MLA">MLA Format</option>
                  </select>
                  <select 
                    className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none flex-1 focus:border-amber-400/50 transition-colors"
                    value={citationState.format}
                    onChange={(e) => setCitationState({...citationState, format: e.target.value})}
                  >
                    <option value="txt">Plain Text (.txt)</option>
                    <option value="bib">BibTeX (.bib)</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleCite}
                    disabled={selectedPapers.length === 0 || citationState.loading}
                    className="flex-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 rounded-lg py-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {citationState.loading ? 'Generating...' : 'Generate Citations'}
                  </button>
                  <button 
                    onClick={downloadCitations}
                    disabled={!citationState.data}
                    className="glass-button px-4 disabled:opacity-50"
                    title="Download Citations"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
                
                {citationState.data && typeof citationState.data === 'string' && (
                  <div className="mt-6 bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-gray-400 h-32 overflow-y-auto whitespace-pre-wrap font-mono shadow-inner">
                    {citationState.data}
                  </div>
                )}
              </div>

              {/* Roadmap Agent Panel */}
              <div className="glass-panel p-8 flex flex-col justify-center min-h-[300px] hover:glow-shadow transition-shadow duration-500">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4 border border-primary/20 shadow-[0_0_30px_rgba(107,70,193,0.2)] animate-pulse-glow">
                    <Map className="text-primary w-7 h-7 animate-float-mild" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-white">Roadmap Agent</h3>
                  <p className="text-gray-400 text-sm max-w-sm mx-auto">
                    Automatically generate an adaptive research strategy based on current findings, identifying key gaps and suggesting next exploratory horizons.
                  </p>
                </div>
                
                <button 
                  onClick={handleGenerateRoadmap}
                  disabled={!results || roadmapState.loading}
                  className="w-full shiny-btn bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl py-3 font-semibold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 hover:shadow-cyan-500/20"
                >
                  {roadmapState.loading ? <><Sparkles className="w-5 h-5 animate-spin-slow" /> Analyzing Strategy...</> : <><Zap className="w-5 h-5 text-white animate-pulse" /> Generate Research Roadmap</>}
                </button>
              </div>

            </div>

            {/* Right Side: Synthesis Agent */}
            <div className="glass-panel p-6 flex flex-col h-full border-t border-t-secondary/30 lg:border-t-0 lg:border-l lg:border-l-secondary/30">
              <div className="mb-6">
                <h3 className="text-xl font-bold flex items-center gap-3 mb-2">
                  <BrainCircuit className="text-secondary w-6 h-6" />
                  Synthesis Agent
                </h3>
                <p className="text-sm text-gray-400">Select papers above to synthesize their findings and identify research gaps.</p>
              </div>
              
              <button 
                onClick={handleSynthesize}
                disabled={selectedPapers.length === 0 || synthesisState.loading}
                className="w-full shiny-btn bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 rounded-lg py-3 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-6 shrink-0 hover:glow-shadow"
              >
                {synthesisState.loading ? <span className="flex items-center justify-center gap-2"><Sparkles className="w-4 h-4 animate-spin-slow"/> Synthesizing Data...</span> : `Run Synthesis (${selectedPapers.length} Selected)`}
              </button>

              <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
                {(!synthesisState.data || (typeof synthesisState.data === 'string' && !synthesisState.data)) && !synthesisState.loading && (
                   <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-xl p-8 bg-black/20 m-1">
                     <p className="text-gray-500 text-sm text-center">Run synthesis to generate comparative research analysis, common themes, and contradictions.</p>
                   </div>
                )}

                {synthesisState.data && typeof synthesisState.data === 'string' && (
                  <div className="flex-1 p-5 bg-white/5 border border-white/10 rounded-xl overflow-y-auto m-1 h-64 lg:h-auto">
                    <div className="prose prose-invert prose-sm">
                      <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                        {synthesisState.data}
                      </div>
                    </div>
                  </div>
                )}

                {synthesisState.data && typeof synthesisState.data === 'object' && !synthesisState.data.error && (
                  <div className="flex-1 space-y-4 text-sm overflow-y-auto pr-2 m-1 h-64 lg:h-auto">
                    {synthesisState.data.common_themes && (
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                        <strong className="text-secondary block mb-2 uppercase tracking-wider text-xs">Common Themes</strong>
                        <p className="text-gray-300 leading-relaxed">{synthesisState.data.common_themes}</p>
                      </div>
                    )}
                    {synthesisState.data.contradictions && (
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                        <strong className="text-amber-400 block mb-2 uppercase tracking-wider text-xs">Contradictions</strong>
                        <p className="text-gray-300 leading-relaxed">{synthesisState.data.contradictions}</p>
                      </div>
                    )}
                    {synthesisState.data.research_gaps && (
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                        <strong className="text-red-400 block mb-2 uppercase tracking-wider text-xs">Research Gaps</strong>
                        <p className="text-gray-300 leading-relaxed">{synthesisState.data.research_gaps}</p>
                      </div>
                    )}
                  </div>
                )}
                {synthesisState.data?.error && (
                  <div className="text-red-400 text-sm p-4 bg-red-400/5 border border-red-400/20 rounded-xl m-1">
                    {synthesisState.data.error}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* SECTION 5 — ROADMAP RESULT */}
          {roadmapState.data && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="glass-panel p-8 w-full border-t border-primary/40 overflow-hidden relative hover:glow-shadow transition-shadow duration-500"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Map className="w-64 h-64 text-primary" />
              </div>
              
              <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                <h2 className="text-3xl font-bold flex items-center gap-3 text-white tracking-wide">
                  <Map className="text-primary w-7 h-7" /> 
                  Research Strategy Horizon
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                
                {/* Foundational Papers Column */}
                <div className="bg-black/20 rounded-2xl p-6 border border-white/5 hover:border-amber-500/30 transition-colors h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-amber-400" />
                    </div>
                    <h4 className="font-bold uppercase tracking-wider text-sm text-amber-400">Foundational Anchors</h4>
                  </div>
                  <ul className="space-y-5 flex-1">
                    {roadmapState.data.foundational_papers?.map((p, i) => (
                      <li key={i} className="group cursor-default bg-white/5 p-4 rounded-xl border border-transparent hover:border-amber-500/20 transition-all">
                        <div className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors line-clamp-2 leading-snug">{p.title}</div>
                        <div className="text-xs text-gray-500 mt-2 flex justify-between items-center bg-black/30 p-2 rounded-lg">
                          <span className="truncate pr-2">{p.authors?.split(',')[0]} ({p.year})</span>
                          <span className="text-amber-500/80 font-mono font-medium px-2 py-0.5 bg-amber-500/10 rounded">{p.citation_count} cit.</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gap Areas Column */}
                <div className="bg-black/20 rounded-2xl p-6 border border-white/5 hover:border-red-500/30 transition-colors h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <h4 className="font-bold uppercase tracking-wider text-sm text-red-400">Identified Gaps</h4>
                  </div>
                  <ul className="space-y-4 flex-1">
                    {roadmapState.data.gap_areas?.map((gap, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-300 bg-white/5 p-4 rounded-xl border border-transparent hover:border-red-500/20 transition-all items-start">
                        <span className="text-red-500 flex-shrink-0 mt-0.5"><Zap className="w-4 h-4"/></span>
                        <span className="leading-relaxed">{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Next Query Suggestions Column */}
                <div className="bg-black/20 rounded-2xl p-6 border border-white/5 hover:border-primary/30 transition-colors h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-bold uppercase tracking-wider text-sm text-primary">Exploration Vectors</h4>
                  </div>
                  <div className="space-y-3 flex-1 flex flex-col justify-start">
                    {roadmapState.data.next_queries?.map((querySuggestion, i) => (
                      <button 
                        key={i}
                        onClick={() => triggerNextSearch(querySuggestion)}
                        className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/10 transition-all flex items-center justify-between group shadow-sm hover:shadow-[0_0_15px_rgba(107,70,193,0.3)] transform hover:-translate-y-0.5"
                      >
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors leading-snug">{querySuggestion}</span>
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110">
                          <Search className="w-3.5 h-3.5 text-primary" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </div>
      )}
    </motion.div>
  );
};

export default Home;
