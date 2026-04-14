import os
import io
from datetime import datetime
from typing import Dict, Any
from database.supabase_client import SupabaseDB
from agents.citation_agent import CitationAgent

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
        Table, TableStyle, PageBreak
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class ExportAgent:
    def __init__(self):
        self.db = SupabaseDB()
        self.citation = CitationAgent()

    def export_session_pdf(self, session_id: str, citation_style: str = "APA") -> bytes:
        """
        Fetch session from Supabase and generate a well-formatted PDF.
        Returns raw PDF bytes.
        """
        if not REPORTLAB_AVAILABLE:
            raise RuntimeError(
                "reportlab is not installed. Run: pip install reportlab"
            )

        # ── Fetch data ────────────────────────────────────────────────────────
        session_detail = self.db.get_session_details(session_id)
        session_meta   = self.db.get_session_meta(session_id)

        papers     = session_detail.get("papers", []) if session_detail else []
        analysis   = session_detail.get("analysis") or {}
        query      = session_meta.get("query", "Unknown Query") if session_meta else "Unknown Query"
        sess_name  = session_meta.get("session_name", "Research Session") if session_meta else "Research Session"

        # ── Citation strings ────────────────────────────────────────────────
        citations_text = self.citation.export_bulk_citations(
            papers, format="txt", style=citation_style
        )

        # ── Build PDF in memory ─────────────────────────────────────────────
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )

        styles = getSampleStyleSheet()

        # Custom styles ──────────────────────────────────────────────────────
        cover_title = ParagraphStyle(
            "CoverTitle",
            parent=styles["Title"],
            fontSize=28,
            textColor=colors.HexColor("#6C63FF"),
            spaceAfter=12,
            alignment=TA_CENTER,
        )
        cover_sub = ParagraphStyle(
            "CoverSub",
            parent=styles["Normal"],
            fontSize=13,
            textColor=colors.HexColor("#AAAAAA"),
            spaceAfter=8,
            alignment=TA_CENTER,
        )
        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading1"],
            fontSize=16,
            textColor=colors.HexColor("#6C63FF"),
            spaceBefore=18,
            spaceAfter=8,
            borderPad=(0, 0, 4, 0),
        )
        paper_title_style = ParagraphStyle(
            "PaperTitle",
            parent=styles["Heading2"],
            fontSize=12,
            textColor=colors.HexColor("#E0E0E0"),
            spaceBefore=10,
            spaceAfter=4,
        )
        body = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontSize=9,
            textColor=colors.HexColor("#CCCCCC"),
            spaceAfter=4,
            leading=13,
            alignment=TA_JUSTIFY,
        )
        meta_style = ParagraphStyle(
            "Meta",
            parent=styles["Normal"],
            fontSize=8,
            textColor=colors.HexColor("#888888"),
            spaceAfter=2,
        )
        mono = ParagraphStyle(
            "Mono",
            parent=styles["Code"],
            fontSize=8,
            textColor=colors.HexColor("#BBBBBB"),
            backColor=colors.HexColor("#1A1A2E"),
            spaceAfter=4,
        )

        story = []
        divider = HRFlowable(
            width="100%", thickness=0.5,
            color=colors.HexColor("#333355"),
            spaceAfter=10, spaceBefore=6
        )

        # ── 1. Cover Page ───────────────────────────────────────────────────
        story.append(Spacer(1, 3 * cm))
        story.append(Paragraph("ORCHESTRIX", cover_title))
        story.append(Paragraph("Multi-Agent Research Intelligence Platform", cover_sub))
        story.append(Spacer(1, 0.5 * cm))
        story.append(divider)
        story.append(Spacer(1, 0.5 * cm))
        story.append(Paragraph(f"<b>Session:</b> {sess_name}", cover_sub))
        story.append(Paragraph(
            f"<b>Exported:</b> {datetime.now().strftime('%B %d, %Y – %H:%M UTC')}",
            cover_sub,
        ))
        story.append(Spacer(1, 0.5 * cm))
        story.append(Paragraph(
            f"<b>Total Papers:</b> {len(papers)} &nbsp;&nbsp; "
            f"<b>Citation Style:</b> {citation_style}",
            cover_sub,
        ))
        story.append(PageBreak())

        # ── 2. Research Query ───────────────────────────────────────────────
        story.append(Paragraph("Research Query", section_heading))
        story.append(divider)
        story.append(Paragraph(query, body))
        story.append(Spacer(1, 0.5 * cm))

        # ── 3. Paper List ───────────────────────────────────────────────────
        story.append(Paragraph(f"Discovered Papers ({len(papers)})", section_heading))
        story.append(divider)

        for idx, paper in enumerate(papers, start=1):
            story.append(
                Paragraph(
                    f"{idx}. {paper.get('title', 'Untitled Paper')}",
                    paper_title_style,
                )
            )
            authors = paper.get("authors", "Unknown")
            year    = paper.get("year", "n.d.")
            cites   = paper.get("citation_count", 0)
            story.append(Paragraph(
                f"Authors: {authors} | Year: {year} | Citations: {cites}",
                meta_style,
            ))

            abstract = paper.get("abstract", "")
            if abstract:
                safe_abstract = abstract[:600] + ("…" if len(abstract) > 600 else "")
                story.append(Paragraph(safe_abstract, body))

            url = paper.get("source_url", "")
            if url:
                story.append(Paragraph(f"URL: {url}", meta_style))

            story.append(Spacer(1, 0.3 * cm))

        story.append(PageBreak())

        # ── 4. Summaries / Analysis ─────────────────────────────────────────
        story.append(Paragraph("Analysis Highlights", section_heading))
        story.append(divider)

        if analysis and analysis.get("chart_data"):
            chart_data = analysis["chart_data"]

            # Keyword frequency table
            keywords = chart_data.get("keyword_frequency") or chart_data.get("keywords", [])
            if keywords:
                story.append(Paragraph("Top Keywords:", paper_title_style))
                kw_data = [["Keyword", "Frequency"]]
                kw_data += [[k.get("keyword", k.get("word", "?")), str(k.get("count", 0))]
                             for k in keywords[:10]]
                tbl = Table(kw_data, colWidths=[10 * cm, 4 * cm])
                tbl.setStyle(TableStyle([
                    ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#2D2B55")),
                    ("TEXTCOLOR",    (0, 0), (-1, 0), colors.HexColor("#FFFFFF")),
                    ("FONTSIZE",     (0, 0), (-1, -1), 8),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1),
                     [colors.HexColor("#161625"), colors.HexColor("#1A1A2E")]),
                    ("TEXTCOLOR",    (0, 1), (-1, -1), colors.HexColor("#CCCCCC")),
                    ("GRID",         (0, 0), (-1, -1), 0.25, colors.HexColor("#333355")),
                    ("TOPPADDING",   (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
                ]))
                story.append(tbl)
                story.append(Spacer(1, 0.4 * cm))

            # Publication trend table
            trend = chart_data.get("publication_trend") or chart_data.get("trend", [])
            if trend:
                story.append(Paragraph("Publication Trend:", paper_title_style))
                tr_data = [["Year", "Papers"]]
                tr_data += [[str(t.get("year", "?")), str(t.get("count", 0))] for t in trend]
                tbl2 = Table(tr_data, colWidths=[7 * cm, 7 * cm])
                tbl2.setStyle(TableStyle([
                    ("BACKGROUND",   (0, 0), (-1, 0), colors.HexColor("#2D2B55")),
                    ("TEXTCOLOR",    (0, 0), (-1, 0), colors.HexColor("#FFFFFF")),
                    ("FONTSIZE",     (0, 0), (-1, -1), 8),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1),
                     [colors.HexColor("#161625"), colors.HexColor("#1A1A2E")]),
                    ("TEXTCOLOR",    (0, 1), (-1, -1), colors.HexColor("#CCCCCC")),
                    ("GRID",         (0, 0), (-1, -1), 0.25, colors.HexColor("#333355")),
                    ("TOPPADDING",   (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
                ]))
                story.append(tbl2)
        else:
            story.append(Paragraph("No analysis data stored for this session.", body))

        story.append(PageBreak())

        # ── 5. Citations ────────────────────────────────────────────────────
        story.append(Paragraph(f"Citations ({citation_style})", section_heading))
        story.append(divider)

        if citations_text:
            for line in citations_text.split("\n\n"):
                if line.strip():
                    story.append(Paragraph(line.strip(), body))
                    story.append(Spacer(1, 0.25 * cm))
        else:
            story.append(Paragraph("No citation data available for this session.", body))

        # ── 6. Export Timestamp (footer paragraph) ──────────────────────────
        story.append(PageBreak())
        story.append(Spacer(1, 5 * cm))
        story.append(Paragraph("Export Information", section_heading))
        story.append(divider)
        story.append(Paragraph(
            f"Generated by Orchestrix Intelligence Platform", cover_sub
        ))
        story.append(Paragraph(
            f"Timestamp: {datetime.now().isoformat()}", cover_sub
        ))
        story.append(Paragraph(
            f"Session ID: {session_id}", cover_sub
        ))

        # ── Build ─────────────────────────────────────────────────────────
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
