from fastapi import APIRouter, HTTPException, BackgroundTasks
<<<<<<< HEAD
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from orchestrator.orchestrator import Orchestrator
from agents.export_agent import ExportAgent
from agents.roadmap_agent import RoadmapAgent
from services.synthesis_service import synthesize_papers
from database.supabase_client import SupabaseDB
import io

router      = APIRouter()
orchestrator = Orchestrator()
export_agent = ExportAgent()
roadmap_agent = RoadmapAgent()
db           = SupabaseDB()


# ── Request Models ────────────────────────────────────────────────────────────
=======
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from orchestrator.orchestrator import Orchestrator
from services.synthesis_service import synthesize_papers
from database.supabase_client import SupabaseDB

router = APIRouter()
orchestrator = Orchestrator()
db = SupabaseDB()

>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
class SearchRequest(BaseModel):
    query: str
    session_name: Optional[str] = None

class SynthesisRequest(BaseModel):
    papers: List[Dict[str, Any]]

class CitationRequest(BaseModel):
    papers: List[Dict[str, Any]]
    format: str = 'txt'
    style: str = 'APA'

<<<<<<< HEAD
class RoadmapRequest(BaseModel):
    session_id: Optional[str] = None
    papers: List[Dict[str, Any]] = []
    trend_data: List[Dict[str, Any]] = []
    keyword_distribution: List[Dict[str, Any]] = []
    notes: List[str] = []
    query: Optional[str] = ""


# ── Existing Routes ───────────────────────────────────────────────────────────
=======
>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
@router.post("/search")
async def search(req: SearchRequest):
    try:
        result = orchestrator.execute_search_workflow(req.query)
<<<<<<< HEAD

        if req.session_name:
=======
        
        # Save to DB if requested
        if req.session_name:
            # We skip DB insertion errors if no keys provided yet, just warn
>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
            try:
                session_res = db.save_session(req.session_name, req.query)
                if session_res and session_res.data:
                    session_id = session_res.data[0]['id']
                    result['session_id'] = session_id
                    db.save_papers(session_id, result['papers'])
                    if result.get('analysis'):
                        db.save_analysis(session_id, result['analysis'])
            except Exception as db_e:
                print(f"DB Error: {db_e}")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

<<<<<<< HEAD

@router.post("/synthesize")
async def synthesize(req: SynthesisRequest):
    """POST /synthesize — Groq-powered synthesis."""
    print(f"DEBUG: /synthesize endpoint hit with {len(req.papers)} papers")
    try:
        if len(req.papers) < 2:
            return {"result": "Please select at least 2 papers for synthesis."}

        print("Synthesis Agent Invoked")
        synthesis_text = synthesize_papers(req.papers)
=======
@router.post("/synthesize")
async def synthesize(req: SynthesisRequest):
    """
    POST /synthesize
    Directly calls the Groq-powered synthesis service.
    """
    print(f"DEBUG: /synthesize endpoint hit with {len(req.papers)} papers")
    try:
        # Orchestrator requirements: Only call Synthesis Agent if selected papers >= 2
        if len(req.papers) < 2:
            return {"result": "Please select at least 2 papers for synthesis."}

        print("Synthesis Agent Invoked") # Requested log
        synthesis_text = synthesize_papers(req.papers)
        
        # Return: { result: synthesisText } AND { synthesis: synthesisText } for frontend compatibility
>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
        return {
            "result": synthesis_text,
            "synthesis": synthesis_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

<<<<<<< HEAD

=======
>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
@router.post("/cite")
async def cite(req: CitationRequest):
    try:
        result = orchestrator.execute_citation_workflow(req.papers, req.format, req.style)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

<<<<<<< HEAD

=======
>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
@router.get("/sessions")
async def get_sessions():
    try:
        res = db.get_sessions()
        return res.data if hasattr(res, 'data') else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

<<<<<<< HEAD

=======
>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
@router.get("/sessions/{session_id}")
async def get_session_details(session_id: str):
    try:
        return db.get_session_details(session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

<<<<<<< HEAD

=======
>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    try:
        db.delete_session(session_id)
        return {"status": "success", "message": "Session deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
<<<<<<< HEAD


# ── Feature 1: Export PDF ─────────────────────────────────────────────────────
@router.get("/export/{session_id}/pdf")
async def export_session_pdf(session_id: str, style: str = "APA"):
    """
    GET /api/export/{session_id}/pdf?style=APA
    Returns a downloadable PDF of the research session.
    """
    try:
        pdf_bytes = export_agent.export_session_pdf(session_id, citation_style=style)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="orchestrix-session-{session_id[:8]}.pdf"'
            }
        )
    except RuntimeError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/share/{session_id}")
async def share_session(session_id: str):
    """
    GET /api/share/{session_id}
    Returns a shareable URL for the session.
    """
    try:
        frontend_base = "http://localhost:5173"
        share_url     = f"{frontend_base}/history/{session_id}"
        return {
            "session_id": session_id,
            "share_url": share_url,
            "message": "Share this URL to let others view this research session."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Feature 3: Roadmap ────────────────────────────────────────────────────────
@router.post("/roadmap")
async def generate_roadmap(req: RoadmapRequest):
    """
    POST /api/roadmap
    Generates an adaptive research roadmap for the given session context.
    Optionally saves to Supabase if session_id is provided.
    """
    try:
        session_context = {
            "papers":               req.papers,
            "trend_data":           req.trend_data,
            "keyword_distribution": req.keyword_distribution,
            "notes":                req.notes,
            "query":                req.query or "",
        }

        roadmap = roadmap_agent.generate_roadmap(session_context)

        # Persist if session_id provided
        if req.session_id:
            try:
                db.save_roadmap(
                    session_id=req.session_id,
                    foundational_papers=roadmap["foundational_papers"],
                    gap_areas=roadmap["gap_areas"],
                    next_queries=roadmap["next_queries"],
                )
            except Exception as db_e:
                print(f"[Roadmap] DB save error: {db_e}")

        return roadmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/roadmap/{session_id}")
async def get_roadmap(session_id: str):
    """
    GET /api/roadmap/{session_id}
    Returns the most recent roadmap for a session from Supabase.
    """
    try:
        result = db.get_roadmap(session_id)
        if not result:
            raise HTTPException(status_code=404, detail="No roadmap found for this session.")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
=======
>>>>>>> 640c17c1398701ade703e6ed1c05bfbbe0d5bd2c
