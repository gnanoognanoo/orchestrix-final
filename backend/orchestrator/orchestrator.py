from typing import List, Dict, Any
from services.discovery_service import search_research_papers
from agents.analysis_agent import AnalysisAgent
from agents.citation_agent import CitationAgent
from agents.query_expansion_agent import QueryExpansionAgent
from services.synthesis_service import synthesize_papers
from database.supabase_client import SupabaseDB


class Orchestrator:
    def __init__(self):
        self.analysis   = AnalysisAgent()
        self.citation   = CitationAgent()
        self.expansion  = QueryExpansionAgent()
        self.db         = SupabaseDB()

    # ─────────────────────────────────────────────────────────────────────────
    # MAIN SEARCH WORKFLOW  (Query Expansion + Reranking)
    # ─────────────────────────────────────────────────────────────────────────
    def execute_search_workflow(self, query: str, page: int = 1) -> Dict[str, Any]:
        """
        UPGRADED Orchestration with:
        - Structured Query Expansion (with reasoning)
        - Multi-query Discovery
        - Deduplication (DOI → title → URL)
        - Reranking  rank_score = 0.7*citations + 0.3*year_score
        """
        trace = []

        # ── 1. Generate structured sub-queries ─────────────────────────────
        expansion_result = self.expansion.expand_query(query)
        expanded_queries = expansion_result.get("expanded_queries", [])
        sub_query_1 = expanded_queries[0]["query"] if len(expanded_queries) > 0 else ""
        sub_query_2 = expanded_queries[1]["query"] if len(expanded_queries) > 1 else ""

        # Update trace with detailed expansion data
        trace.append({
            "agent": "Query Expansion Agent",
            "status": "completed",
            "original_query": query,
            "expansion_data": expansion_result # Including the full structured data for the frontend
        })
        print(f"[Orchestrator] Original: '{query}'")
        print(f"[Orchestrator] Sub-query 1: '{sub_query_1}'")
        print(f"[Orchestrator] Sub-query 2: '{sub_query_2}'")

        # ── 2. Discovery for all 3 queries ───────────────────────────────
        all_papers = []
        for q in [query, sub_query_1, sub_query_2]:
            if not q:
                continue
            discovery_data = search_research_papers(q, page=page, limit=10)
            all_papers.extend(discovery_data.get("papers", []))

        merged_count = len(all_papers)
        trace.append({
            "agent": "Discovery Agent",
            "status": f"Merged {merged_count} results from 3 queries"
        })

        # ── 3. Deduplication ─────────────────────────────────────────────
        papers = self._deduplicate(all_papers)
        dedup_count = len(papers)
        trace.append({
            "agent": "Orchestrator",
            "status": f"Deduplicated to {dedup_count} unique papers"
        })

        # ── 4. Rerank ────────────────────────────────────────────────────
        papers = self._rerank(papers)

        # ── 5. Analysis ──────────────────────────────────────────────────
        analysis = None
        if papers:
            analysis = self.analysis.analyze_papers(papers)
            trace.append({
                "agent": "Analysis Agent",
                "status": f"Analyzed {len(papers)} papers"
            })

        # ── 6. Synthesis (preview on first 5) ───────────────────────────
        synthesis_text = ""
        if len(papers) >= 2:
            synthesis_data = self.execute_synthesis_workflow(papers[:5])
            synthesis_text = synthesis_data.get("synthesis")
            trace.extend(synthesis_data.get("trace", []))

        # ── 7. Citations (preview on first 3) ───────────────────────────
        citations = self.citation.export_bulk_citations(papers[:3], format="txt", style="APA")
        trace.append({"agent": "Citation Agent", "status": "Completed"})

        # Final Trace Summary entry
        trace.append({
            "agent": "Trace Summary",
            "status": (
                f"Original: '{query}' | "
                f"Merged: {merged_count} | "
                f"Deduplicated: {dedup_count}"
            )
        })

        return {
            "query": query,
            "expansion_data": expansion_result, # Returning the results for easier frontend access
            "papers": papers,
            "analysis": analysis,
            "synthesis": synthesis_text,
            "citations": citations,
            "trace": trace,
            "pagination": {
                "totalResults": len(papers),
                "currentPage": page,
                "hasMore": False,
            },
        }

    # ─────────────────────────────────────────────────────────────────────────
    # SYNTHESIS WORKFLOW
    # ─────────────────────────────────────────────────────────────────────────
    def execute_synthesis_workflow(self, papers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Groq-based Synthesis Workflow with caching."""
        trace = []
        if len(papers) < 2:
            return {"synthesis": "Please select at least 2 papers for synthesis.", "trace": trace}

        paper_ids  = [p.get("id") for p in papers if p.get("id")]
        session_id = papers[0].get("session_id") if papers else None

        if session_id and paper_ids:
            cached = self.db.get_synthesis(session_id, paper_ids)
            if cached:
                trace.append({"agent": "Synthesis Agent", "status": "Result Loaded from Cache"})
                return {"synthesis": cached, "trace": trace}

        print("Synthesis Agent Invoked")
        synthesis_result = synthesize_papers(papers)

        if "Synthesis service temporarily unavailable" in str(synthesis_result):
            trace.append({"agent": "Synthesis Agent", "status": "Failed"})
        else:
            trace.append({"agent": "Synthesis Agent", "status": "Completed"})
            if session_id and paper_ids:
                try:
                    self.db.save_synthesis(session_id, paper_ids, synthesis_result)
                except Exception:
                    pass

        return {"synthesis": synthesis_result, "trace": trace}

    # ─────────────────────────────────────────────────────────────────────────
    # CITATION WORKFLOW
    # ─────────────────────────────────────────────────────────────────────────
    def execute_citation_workflow(
        self, papers: List[Dict[str, Any]], format: str, style: str
    ) -> Dict[str, Any]:
        trace = [{"agent": "Citation", "status": "running"}]
        citations = self.citation.export_bulk_citations(papers, format, style)
        trace[-1]["status"] = "completed"
        return {"citations": citations, "trace": trace}

    # ─────────────────────────────────────────────────────────────────────────
    # HELPERS
    # ─────────────────────────────────────────────────────────────────────────
    def _deduplicate(self, papers: List[Dict]) -> List[Dict]:
        """Dedup priority: DOI → title (lowercase) → source_url"""
        seen_dois  = set()
        seen_titles = set()
        seen_urls  = set()
        unique = []

        for p in papers:
            # Safely handle potential None externalIds
            ext_ids = p.get("externalIds")
            doi = None
            if isinstance(ext_ids, dict):
                doi = ext_ids.get("DOI")
            elif p.get("doi"):
                doi = p.get("doi")
            
            title = (p.get("title") or "").strip().lower()
            url   = p.get("source_url") or ""

            if doi and doi in seen_dois:
                continue
            if title and title in seen_titles:
                continue
            if url and url in seen_urls:
                continue

            if doi: seen_dois.add(doi)
            if title: seen_titles.add(title)
            if url: seen_urls.add(url)

            unique.append(p)

        return unique

    def _rerank(self, papers: List[Dict]) -> List[Dict]:
        """
        rank_score = (0.7 * citation_count) + (0.3 * publication_year_score)
        year_score = max(0, 100 - (current_year - year) * 5)
        """
        current_year = 2025

        def score(p):
            citations  = p.get("citation_count", 0) or 0
            year       = p.get("year", 0) or 0
            year_score = max(0.0, 100.0 - (current_year - year) * 5) if year else 0.0
            return (0.7 * citations) + (0.3 * year_score)

        return sorted(papers, key=score, reverse=True)
