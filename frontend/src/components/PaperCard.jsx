import React, { useState } from 'react';
import { ExternalLink, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

const PaperCard = ({ paper, onSelect, selected, index = 0 }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.01, boxShadow: "0 15px 40px rgba(56, 189, 248, 0.15)" }}
      className={`glass-panel p-5 w-full text-left transition-colors duration-300 ${selected ? 'border-primary shadow-[0_0_25px_rgba(107,70,193,0.4)] bg-primary/5' : 'hover:border-secondary/40'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-lg font-bold text-white pr-4 leading-snug">{paper.title}</h4>
        <div className="flex items-center gap-3">
          {paper.source_url && (
            <a href={paper.source_url} target="_blank" rel="noreferrer" className="text-secondary/70 hover:text-secondary transition-colors" title="View Source">
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
          <input 
            type="checkbox" 
            checked={selected}
            onChange={(e) => onSelect(paper, e.target.checked)}
            className="w-5 h-5 accent-primary cursor-pointer border-white/20 bg-panel rounded shadow-inner"
            title="Select for Synthesis/Citation"
          />
        </div>
      </div>
      
      <div className="text-sm text-gray-400 mb-4 flex flex-wrap gap-4 items-center">
        <span className="font-medium text-gray-300">{paper.authors}</span>
        <span className="bg-white/10 px-2 py-0.5 rounded-md text-white font-mono text-xs">{paper.year}</span>
        <span className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-md text-xs font-semibold hover:bg-primary/20 transition-colors">
          <Quote className="w-3 h-3"/> {paper.citation_count} Citations
        </span>
      </div>
      
      <div className="relative">
        <p className={`text-sm text-gray-300 leading-relaxed ${expanded ? 'line-clamp-none' : 'line-clamp-3'}`}>
          {paper.abstract}
        </p>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-secondary text-xs flex items-center gap-1 mt-3 hover:text-white transition-colors uppercase tracking-wider font-bold"
        >
          {expanded ? <><ChevronUp className="w-4 h-4"/> Show Less</> : <><ChevronDown className="w-4 h-4"/> Read Full Abstract</>}
        </button>
      </div>
    </motion.div>
  );
};

export default PaperCard;
