import os
import requests
import json
from typing import List, Dict, Any
from dotenv import load_dotenv
from services.llm_service import call_groq

# Ensure environment variables are loaded
load_dotenv()

def synthesize_papers(papers: List[Dict[str, Any]]):
    """
    Refactored Synthesis Service using centralized llm_service (Groq).
    """
    
    # Validation & Filtering
    if not isinstance(papers, list):
        return "Invalid input format: Expected papers array"

    valid_papers = [
        p for p in papers 
        if p.get('abstract') and isinstance(p.get('abstract'), str) and len(p.get('abstract').strip()) > 10
    ]

    if len(valid_papers) < 2:
        return "Not enough valid abstracts for synthesis (min 2 required)"

    # Character Combining & Prompt Structuring
    combined_abstracts = ""
    for i, p in enumerate(valid_papers):
        title = p.get('title', 'Unknown Title').strip()
        abstract = p.get('abstract', '').strip()
        
        combined_abstract_part = f"\nPaper {i+1}: {title}\n<abstract>\n{abstract}\n</abstract>\n"
        
        if len(combined_abstracts) + len(combined_abstract_part) > 12000:
            print("WARNING: Prompt truncated at 12,000 characters to prevent overflow.")
            break
        combined_abstracts += combined_abstract_part

    if len(combined_abstracts.strip()) < 50:
        return "Abstract content too small for synthesis"

    structured_prompt = f"Generate a research synthesis across the selected papers.\n{combined_abstracts}"
    
    # ── Call Centralized LLM Service ───────────────────────────────
    print(f"DEBUG: Papers received: {len(papers)}")
    print(f"DEBUG: Valid abstracts filter count: {len(valid_papers)}")

    synthesis_text = call_groq(
        prompt=structured_prompt,
        system_prompt="You are an expert academic research synthesis agent. Provide a synthesis that identifies common themes, contradictions, and gaps.",
        model="llama-3.1-8b-instant",
        temperature=0.4,
        max_tokens=2000
    )

    if synthesis_text:
        print("Synthesis Completed Successfully via Groq Service")
        return synthesis_text
    else:
        return "Synthesis service failed. Please check logs for Groq API errors."
