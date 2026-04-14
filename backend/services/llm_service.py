import os
import requests
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

def call_groq(
    prompt: str, 
    system_prompt: str = "You are a helpful research assistant.",
    model: str = "llama-3.1-8b-instant",
    temperature: float = 0.3,
    max_tokens: int = 1000,
    json_mode: bool = False
) -> Optional[str]:
    """
    Centralized Groq API caller to ensure consistent configuration across agents.
    """
    api_key = os.getenv("GROQ_API_KEY")
    groq_url = "https://api.groq.com/openai/v1/chat/completions"

    if not api_key:
        print("ERROR: GROQ_API_KEY is not defined")
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    if json_mode:
        body["response_format"] = {"type": "json_object"}

    try:
        response = requests.post(groq_url, headers=headers, json=body, timeout=60)
        if response.status_code == 200:
            data = response.json()
            return data['choices'][0]['message']['content'].strip()
        else:
            print(f"ERROR: Groq API Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"CRITICAL: Groq API Exception: {str(e)}")
        return None
