import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionDetails } from '../services/api';
import { TrendChart, KeywordChart } from '../components/Charts';
<<<<<<< HEAD
import { ArrowLeft, FileText, Users, Calendar, ExternalLink, BookOpen, Star, Loader2, Map, Lightbulb, AlertCircle, Sparkles, Zap } from 'lucide-react';
=======
import { ArrowLeft, FileText, Users, Calendar, ExternalLink, BookOpen, Star, Loader2 } from 'lucide-react';
>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
import { motion } from 'framer-motion';

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
<<<<<<< HEAD
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [error, setError] = useState(null);


=======
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await getSessionDetails(id);
        setDetail(data);
<<<<<<< HEAD
        
        // Fetch existing roadmap if possible
        const { getRoadmap } = await import('../services/api');
        const roadmapData = await getRoadmap(id).catch(() => null);
        setRoadmap(roadmapData);
      } catch (err) {
        console.error(err);
=======
      } catch (err) {
>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
        setError('Failed to load session details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

<<<<<<< HEAD
  const handleGenerateRoadmap = async () => {
    if (!detail) return;
    setGeneratingRoadmap(true);
    try {
      const { generateRoadmap } = await import('../services/api');
      const roadmapData = {
        session_id: id,
        papers: detail.papers,
        trend_data: detail.analysis?.chart_data?.trend || [],
        keyword_distribution: detail.analysis?.chart_data?.keywords || [],
        query: detail.analysis?.query || "Research Session"
      };
      const data = await generateRoadmap(roadmapData);
      setRoadmap(data);
    } catch (err) {
      console.error(err);
      alert("Failed to generate roadmap.");
    } finally {
      setGeneratingRoadmap(false);
    }
  };


=======
>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 text-secondary">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="animate-pulse">Loading session data...</p>
    </div>
  );

  if (error) return (
    <div className="container mx-auto p-8 text-center text-red-400">{error}</div>
  );

  const papers = detail?.papers || [];
  const analysis = detail?.analysis;
  const chartData = analysis?.chart_data || {};
  const trendData = chartData.trend || [];
  const keywordData = chartData.keywords || [];

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <button
        onClick={() => navigate('/history')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to History
      </button>

      <div className="mb-10">
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary inline-block mb-2">
          Session Details
        </h2>
        <p className="text-gray-400">{papers.length} papers discovered in this session</p>
      </div>

      {/* Analysis Charts */}
      {(trendData.length > 0 || keywordData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {trendData.length > 0 && <TrendChart data={trendData} />}
          {keywordData.length > 0 && <KeywordChart data={keywordData} />}
        </div>
      )}

<<<<<<< HEAD
      {/* Roadmap Section */}
      <div className="mb-10">
        {!roadmap ? (
          <div className="glass-panel p-8 text-center border-dashed border-2 border-white/10 hover:border-primary/20 transition-colors">
            <Map className="w-10 h-10 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Research Roadmap Generated</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">Analyze the session data and let the agent propose the next steps for your research.</p>
            <button 
              onClick={handleGenerateRoadmap}
              disabled={generatingRoadmap}
              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-full px-8 py-3 transition-all flex items-center gap-2 mx-auto"
            >
              {generatingRoadmap ? <><Sparkles className="w-4 h-4 animate-spin" /> Generating Roadmap...</> : <><Zap className="w-4 h-4" /> Generate AI Roadmap</>}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Map className="text-primary w-6 h-6" /> Adaptive Research Roadmap
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Foundation */}
              <div className="glass-panel p-5 border-l-4 border-amber-500/50">
                <div className="flex items-center gap-2 mb-4 text-amber-500 text-sm font-bold uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" /> Key Foundations
                </div>
                <div className="space-y-3">
                  {roadmap.foundational_papers?.map((p, i) => (
                    <div key={i} className="text-xs">
                      <div className="text-gray-200 font-medium line-clamp-1">{p.title}</div>
                      <div className="text-gray-500 mt-0.5">{p.citation_count} citations • {p.year}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gaps */}
              <div className="glass-panel p-5 border-l-4 border-red-500/50">
                <div className="flex items-center gap-2 mb-4 text-red-500 text-sm font-bold uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" /> Priority Gaps
                </div>
                <ul className="space-y-2">
                  {roadmap.gap_areas?.map((gap, i) => (
                    <li key={i} className="text-xs text-gray-300 flex gap-2">
                      <span className="text-red-500">•</span> {gap}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Queries */}
              <div className="glass-panel p-5 border-l-4 border-primary/50">
                <div className="flex items-center gap-2 mb-4 text-primary text-sm font-bold uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4" /> Next Search Queries
                </div>
                <div className="flex flex-wrap gap-2">
                  {roadmap.next_queries?.map((q, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-gray-400">
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


=======
>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
      {/* Papers List */}
      {papers.length === 0 ? (
        <div className="glass-panel p-16 text-center">
          <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400">No papers stored for this session.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {papers.map((paper, i) => (
            <motion.div
              key={paper.id || i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel p-6 border border-white/10 hover:border-primary/40 transition-all"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 leading-snug">
                    {paper.title || 'Untitled Paper'}
                  </h3>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                    {paper.authors && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-primary" />
                        {paper.authors}
                      </span>
                    )}
                    {paper.year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-secondary" />
                        {paper.year}
                      </span>
                    )}
                    {paper.citation_count != null && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        {paper.citation_count} citations
                      </span>
                    )}
                  </div>

                  {paper.abstract && (
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                      {paper.abstract}
                    </p>
                  )}

                  {paper.notes && (
                    <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary-light">
                      <FileText className="w-3 h-3 inline mr-1" /> {paper.notes}
                    </div>
                  )}
                </div>

                {paper.source_url && (
                  <a
                    href={paper.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:text-white transition-colors p-2 border border-secondary/30 hover:border-secondary rounded-lg"
                    title="Open paper"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionDetail;
