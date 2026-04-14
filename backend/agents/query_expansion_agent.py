import os
import json
import re
from typing import List, Dict, Any
from services.llm_service import call_groq

class QueryExpansionAgent:
    """
    Uses the Groq API to generate 2 related sub-queries from an original query,
    including reasoning for each expansion.
    """

    def expand_query(self, query: str) -> Dict[str, Any]:
        """
        Accepts an original query string.
        Returns a structured dictionary with original query, expanded queries, and reasoning.
        
        Example Return Format:
        {
            "original_query": "transformer models",
            "expanded_queries": [
                {"query": "attention mechanism NLP", "reason": "core concept behind transformer architecture"},
                {"query": "BERT fine tuning", "reason": "practical downstream application of transformer models"}
            ]
        }
        """
        print(f"[QueryExpansionAgent] Expanding query via Groq with reasoning: '{query}'")

        result = self._expand_via_groq(query)

        if not result or not result.get("expanded_queries"):
            print("[QueryExpansionAgent] Groq expansion failed. Using heuristic fallback.")
            result = self._heuristic_expand(query)

        return result

    def _expand_via_groq(self, query: str) -> Dict[str, Any]:
        prompt = (
            f"You are a research assistant. Given the following research query, "
            f"generate exactly 2 related academic sub-queries that explore complementary aspects. "
            f"For each sub-query, provide a one-sentence reason explaining why it is a relevant expansion. "
            f"Return ONLY a valid JSON object in the following format:\n"
            f'{{"original_query": "{query}", "expanded_queries": ['
            f'{{"query": "sub-query 1", "reason": "reason 1"}}, '
            f'{{"query": "sub-query 2", "reason": "reason 2"}}'
            f"]}}\n"
            f"No explanation, no markdown, no code fences.\n\n"
            f"Original query: {query}"
        )

        response_content = call_groq(
            prompt=prompt,
            system_prompt="You are a specialized research agent that returns structured query expansions in JSON format.",
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=400,
            json_mode=True
        )

        if not response_content:
            return {}

        try:
            # Cleanup potential markdown etc.
            raw = re.sub(r"^```(?:json)?", "", response_content).strip()
            raw = re.sub(r"```$", "", raw).strip()
            
            parsed = json.loads(raw)
            # Basic validation
            if isinstance(parsed, dict) and "expanded_queries" in parsed:
                # Ensure we have exactly 2 and they have the right keys
                expanded = parsed["expanded_queries"]
                if isinstance(expanded, list) and len(expanded) >= 2:
                    return {
                        "original_query": query,
                        "expanded_queries": [
                            {"query": str(e.get("query", "")).strip(), "reason": str(e.get("reason", "")).strip()}
                            for e in expanded[:2]
                        ]
                    }
            return {}
        except Exception as e:
            print(f"[QueryExpansionAgent] JSON parse error: {e}")
            return {}

    def _heuristic_expand(self, query: str) -> Dict[str, Any]:
        return {
            "original_query": query,
            "expanded_queries": [
                {"query": f"{query} applications", "reason": "exploring practical use-cases and deployments"},
                {"query": f"{query} recent advances", "reason": "identifying the latest state-of-the-art developments"}
            ]
        }
