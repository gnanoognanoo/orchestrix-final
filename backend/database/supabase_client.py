import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseDB:
    def __init__(self):
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if url and key:
            self.client: Client = create_client(url, key)
        else:
            self.client = None

    def save_session(self, session_name: str, query: str):
        if not self.client: return None
        return self.client.table("sessions").insert({"session_name": session_name, "query": query}).execute()

    def save_papers(self, session_id: str, papers: list):
        if not self.client: return None
        # Format for DB
        payload = []
        for p in papers:
            payload.append({
                "session_id": session_id,
                "title": p.get("title"),
                "authors": p.get("authors"),
                "year": p.get("year"),
                "abstract": p.get("abstract"),
                "source_url": p.get("source_url"),
                "citation_count": p.get("citation_count"),
                "notes": p.get("notes", "")
            })
        return self.client.table("papers").insert(payload).execute()

    def save_analysis(self, session_id: str, analysis: dict):
        if not self.client: return None
        return self.client.table("analysis_results").insert({
            "session_id": session_id,
            "chart_data": analysis,
            "summary": ""
        }).execute()
        
    def save_synthesis(self, session_id: str, paper_ids: list, content: str):
        if not self.client: return None
        # Ensure paper_ids are strings
        p_ids = [str(pid) for pid in paper_ids]
        return self.client.table("synthesis_results").insert({
            "session_id": session_id,
            "paper_ids": p_ids,
            "content": content
        }).execute()

    def get_synthesis(self, session_id: str, paper_ids: list):
        if not self.client: return None
        p_ids = [str(pid) for pid in paper_ids]
        # Query for matching session and paper_ids (checking if they match exactly)
        # Note: In production with large sets, this might need a more optimized approach
        result = self.client.table("synthesis_results")\
            .select("content")\
            .eq("session_id", session_id)\
            .execute()
        
        # Manually filter for exact paper_ids set match for simplicity
        # (Supabase/Postgres array comparison '=@' could also be used)
        for row in result.data:
            if set(row.get('paper_ids', [])) == set(p_ids):
                return row.get('content')
        return None

    def get_sessions(self):
        if not self.client: return {"data": []}
        return self.client.table("sessions").select("*").order("created_at", desc=True).execute()
        
    def get_session_details(self, session_id: str):
        if not self.client: return None
        papers = self.client.table("papers").select("*").eq("session_id", session_id).execute()
        analysis = self.client.table("analysis_results").select("*").eq("session_id", session_id).execute()
        return {
            "papers": papers.data,
            "analysis": analysis.data[0] if analysis.data else None
        }

    def delete_session(self, session_id: str):
        if not self.client: return None
        return self.client.table("sessions").delete().eq("id", session_id).execute()
<<<<<<< HEAD

    def get_session_meta(self, session_id: str) -> dict:
        """Return session_name and query for a given session_id."""
        if not self.client: return {}
        result = self.client.table("sessions").select("session_name, query").eq("id", session_id).execute()
        if result.data:
            return result.data[0]
        return {}

    def save_roadmap(self, session_id: str, foundational_papers: list, gap_areas: list, next_queries: list):
        if not self.client: return None
        import uuid
        return self.client.table("roadmaps").insert({
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "foundational_papers": foundational_papers,
            "gap_areas": gap_areas,
            "next_queries": next_queries,
        }).execute()

    def get_roadmap(self, session_id: str):
        if not self.client: return None
        result = self.client.table("roadmaps").select("*").eq("session_id", session_id).order("created_at", desc=True).limit(1).execute()
        if result.data:
            return result.data[0]
        return None
=======
>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
