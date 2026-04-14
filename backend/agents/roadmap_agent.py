import os
import json
import re
from typing import List, Dict, Any
from services.llm_service import call_groq

class RoadmapAgent:
    """
    Adaptive Research Roadmap Generator.
    Analyses papers, summaries, trend data and keyword distribution
    to produce a structured research roadmap using Groq via llm_service.
    """

    def generate_roadmap(self, session_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Input contract:
        {
            "papers": [...],
            "trend_data": [...],
            "keyword_distribution": [...],
            "notes": [...],
            "query": "original query (optional)"
        }

        Returns:
        {
            "foundational_papers": [...],   # top 5 by citation+year
            "gap_areas": [...],             # strings describing gaps
            "next_queries": [...]           # 3-5 clickable suggestion strings
        }
        """
        papers               = session_context.get("papers", [])
        trend_data           = session_context.get("trend_data", [])
        keyword_distribution = session_context.get("keyword_distribution", [])
        notes                = session_context.get("notes", [])
        query                = session_context.get("query", "")

        print(f"[RoadmapAgent] Generating roadmap for {len(papers)} papers via Groq service.")

        # Step 1 – Foundational papers (computed, not AI)
        foundational = self._compute_foundational_papers(papers)

        # Step 2 & 3 – Gap areas + Next queries via Groq
        groq_result = self._call_groq_api(papers, trend_data, keyword_distribution, notes, query)

        gap_areas    = groq_result.get("gap_areas", [])
        next_queries = groq_result.get("next_queries", [])

        # Fallbacks
        if not gap_areas:
            gap_areas = ["Lack of real-world deployment studies", "Limited cross-domain evidence"]
        if not next_queries:
            next_queries = [f"{query} real-world applications"]

        return {
            "foundational_papers": foundational,
            "gap_areas": gap_areas[:6],
            "next_queries": next_queries[:5],
        }

    def _compute_foundational_papers(self, papers: List[Dict]) -> List[Dict]:
        if not papers: return []
        current_year = 2025
        scored = []
        for p in papers:
            citations = p.get("citation_count", 0) or 0
            year = p.get("year", 0) or 0
            year_score = max(0, 100 - (current_year - year) * 5) if year else 0
            rank_score = (0.7 * citations) + (0.3 * year_score)
            scored.append({**p, "_rank_score": rank_score})
        scored.sort(key=lambda x: x["_rank_score"], reverse=True)
        return [{k: v for k, v in p.items() if k != "_rank_score"} for p in scored[:5]]

    def _call_groq_api(self, papers: List[Dict], trend_data: List[Dict], keyword_distribution: List[Dict], notes: List[str], query: str) -> Dict[str, Any]:
        paper_summaries = [
            f"- \"{p.get('title', 'Untitled')}\" ({p.get('year', 'n.d.')}, {p.get('citation_count', 0)} citations): {(p.get('abstract') or '')[:200]}"
            for p in papers[:12]
        ]
        
        keywords_str = ", ".join([k.get("keyword", k.get("word", "")) for k in keyword_distribution[:10]])
        notes_str = " | ".join([str(n) for n in notes[:5]]) if notes else "None"

        prompt = f"""You are an expert research analyst. 
Generate a research roadmap in JSON format including:
1. "gap_areas": [3-5 strings describing answered questions or missing studies]
2. "next_queries": [3-5 specific, clickable search query strings]

Research topic: {query}
Top keywords: {keywords_str}
User notes: {notes_str}

Summary of discovered papers:
{chr(10).join(paper_summaries)}

Return ONLY a valid JSON object in exactly this format:
{{
  "gap_areas": ["gap 1", "gap 2", "gap 3"],
  "next_queries": ["specific search query 1", "specific search query 2", "specific search query 3"]
}}"""

        response_content = call_groq(
            prompt=prompt,
            system_prompt="You are a specialized agent that returns structured research roadmaps in JSON format.",
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=800,
            json_mode=True
        )

        if not response_content:
            return {}

        try:
            # Cleanup potential markdown etc.
            raw = re.sub(r"^```(?:json)?", "", response_content).strip()
            raw = re.sub(r"```$", "", raw).strip()
            return json.loads(raw)
        except Exception as e:
            print(f"[RoadmapAgent] JSON parse error: {e}")
            return {}
