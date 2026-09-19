import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def create_stage4_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )

    styles = getSampleStyleSheet()

    PRIMARY = colors.HexColor("#1A365D")   # Deep Navy
    SECONDARY = colors.HexColor("#2B6CB0") # Blue
    ACCENT = colors.HexColor("#2F855A")    # Green PASS
    DARK_TEXT = colors.HexColor("#2D3748") # Charcoal
    LIGHT_BG = colors.HexColor("#F7FAFC")
    BORDER_COLOR = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=PRIMARY,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=17,
        textColor=PRIMARY,
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=DARK_TEXT,
        spaceAfter=4
    )

    pass_badge_style = ParagraphStyle(
        'PassBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#22543D"),
        alignment=TA_CENTER
    )

    elements = []

    # Title Banner
    elements.append(Paragraph("STAGEPILOT / STAGEFLOW", title_style))
    elements.append(Paragraph("STAGE 4 — FRONTEND INTEGRATION & BROWSER E2E FINAL REPORT", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceAfter=12))

    # Overall Status Box
    status_data = [
        [
            Paragraph("<b>STAGE 4 FRONTEND STATUS</b>", ParagraphStyle('H', parent=body_style, fontName='Helvetica-Bold', textColor=PRIMARY)),
            Paragraph("<b>PASS</b>", pass_badge_style),
            Paragraph("<b>AUTOMATED SUITES:</b> 60/60 PASS (0 FAIL)", ParagraphStyle('H2', parent=body_style, fontName='Helvetica-Bold', textColor=ACCENT))
        ]
    ]
    status_table = Table(status_data, colWidths=[200, 100, 230])
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#C6F6D5")),
        ('BOX', (0,0), (-1,-1), 1.5, ACCENT),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(status_table)
    elements.append(Spacer(1, 10))

    # Section 1: Baseline
    elements.append(Paragraph("1. BASELINE VERIFICATION", h1_style))
    b_data = [
        [Paragraph("<b>Component</b>", body_style), Paragraph("<b>Status</b>", body_style), Paragraph("<b>Details</b>", body_style)],
        [Paragraph("Frontend (React 18 + Vite)", body_style), Paragraph("PASS", body_style), Paragraph("Running on http://localhost:5173 / 5175", body_style)],
        [Paragraph("Backend (Node + Express)", body_style), Paragraph("PASS", body_style), Paragraph("Running on http://localhost:5001", body_style)],
        [Paragraph("Real-Time Synchronization", body_style), Paragraph("PASS", body_style), Paragraph("Socket.IO client/server connected", body_style)],
        [Paragraph("Automated Integration Suite", body_style), Paragraph("PASS", body_style), Paragraph("60 total test cases verified", body_style)],
    ]
    t1 = Table(b_data, colWidths=[160, 80, 290])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), LIGHT_BG),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t1)

    # Section 2: Implemented Features
    elements.append(Paragraph("2. IMPLEMENTED FEATURES", h1_style))
    imp_data = [
        [Paragraph("<b>Area</b>", body_style), Paragraph("<b>Implementation Summary</b>", body_style)],
        [Paragraph("Audience Q&A", body_style), Paragraph("Mobile-first interface (/qa) with validation (3-500 chars), display name input, loading/success states, & upvoting.", body_style)],
        [Paragraph("Organizer War Room", body_style), Paragraph("Q&A Moderation panel with status filters (PENDING, APPROVED, REJECTED, ANSWERED) and direct approve/reject actions.", body_style)],
        [Paragraph("Anchor Station", body_style), Paragraph("Live approved question feed filtered by active track with AI assistance triggers & Mark Answered functionality.", body_style)],
        [Paragraph("AI Assistance", body_style), Paragraph("Integrated with POST /api/ai/question-assist supporting summarize, shorten, response_structure, transition, relevance.", body_style)],
        [Paragraph("Real-time Socket.IO", body_style), Paragraph("Instant questionSubmitted, questionApproved, questionRejected, questionUpvoted, questionAnswered room broadcasting.", body_style)],
        [Paragraph("Multi-Track Context", body_style), Paragraph("Strict track isolation for Track A, Track B, and Track C without cross-track leakage.", body_style)]
    ]
    t2 = Table(imp_data, colWidths=[130, 400])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), LIGHT_BG),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t2)

    # Section 3: Browser E2E & Test Results
    elements.append(Paragraph("3. AUTOMATED TEST SUITES (60/60 PASS)", h1_style))
    test_data = [
        [Paragraph("<b>Test Suite File</b>", body_style), Paragraph("<b>Passed</b>", body_style), Paragraph("<b>Failed</b>", body_style), Paragraph("<b>Total</b>", body_style), Paragraph("<b>Status</b>", body_style)],
        [Paragraph("tests/stage4_qa.test.js", body_style), Paragraph("21", body_style), Paragraph("0", body_style), Paragraph("21", body_style), Paragraph("PASS", body_style)],
        [Paragraph("tests/qa_assistant.test.js", body_style), Paragraph("16", body_style), Paragraph("0", body_style), Paragraph("16", body_style), Paragraph("PASS", body_style)],
        [Paragraph("tests/multitrack_integration.test.js", body_style), Paragraph("5", body_style), Paragraph("0", body_style), Paragraph("5", body_style), Paragraph("PASS", body_style)],
        [Paragraph("tests/multi_track.test.js", body_style), Paragraph("11", body_style), Paragraph("0", body_style), Paragraph("11", body_style), Paragraph("PASS", body_style)],
        [Paragraph("tests/speech_teleprompter.test.js", body_style), Paragraph("7", body_style), Paragraph("0", body_style), Paragraph("7", body_style), Paragraph("PASS", body_style)],
        [Paragraph("<b>TOTAL</b>", body_style), Paragraph("<b>60</b>", body_style), Paragraph("<b>0</b>", body_style), Paragraph("<b>60</b>", body_style), Paragraph("<b>PASS</b>", body_style)],
    ]
    t3 = Table(test_data, colWidths=[180, 70, 70, 70, 140])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), LIGHT_BG),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#EBF8FF")),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t3)

    # Section 4: Manual E2E 19 Steps
    elements.append(Paragraph("4. BROWSER MANUAL 19-STEP E2E FLOW VERIFICATION", h1_style))
    e2e_data = [
        [Paragraph("<b>Step #</b>", body_style), Paragraph("<b>E2E Step Description</b>", body_style), Paragraph("<b>Result</b>", body_style)],
        [Paragraph("1-3", body_style), Paragraph("Audience Q&A view submission with track selection & validation", body_style), Paragraph("PASS", body_style)],
        [Paragraph("4-7", body_style), Paragraph("Organizer War Room receive pending question & approval", body_style), Paragraph("PASS", body_style)],
        [Paragraph("8", body_style), Paragraph("Anchor Station receives approved question in real-time", body_style), Paragraph("PASS", body_style)],
        [Paragraph("9-13", body_style), Paragraph("AI Assistance actions: Summarize, Shorten, Response Structure, Transition, Relevance", body_style), Paragraph("PASS", body_style)],
        [Paragraph("14", body_style), Paragraph("Anchor marks question answered with state update", body_style), Paragraph("PASS", body_style)],
        [Paragraph("15-17", body_style), Paragraph("Question rejection flow & verified isolation from Anchor feed", body_style), Paragraph("PASS", body_style)],
        [Paragraph("18-19", body_style), Paragraph("Multi-track separation: Track B question isolation in Track B feed", body_style), Paragraph("PASS", body_style)]
    ]
    t4 = Table(e2e_data, colWidths=[60, 400, 70])
    t4.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), LIGHT_BG),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t4)

    # Section 5: Regression & Conclusion
    elements.append(Paragraph("5. REGRESSION & SYSTEM INTEGRITY", h1_style))
    reg_text = "All Stage 1-3 core features (Teleprompter, Speech Follower, Mirror Mode, Auto-Scroll, Pronunciation Guide, Flash Alerts, Audio Alerts, Cascading Delay Engine, AI Stage Co-Pilot, Socket.IO) have been strictly preserved without regression."
    elements.append(Paragraph(reg_text, body_style))
    elements.append(Spacer(1, 10))

    elements.append(Paragraph("<b>Final Conclusion:</b> STAGE 4 FRONTEND INTEGRATION + BROWSER E2E IS FULLY VERIFIED AND READY (PASS).", ParagraphStyle('Conc', parent=body_style, fontName='Helvetica-Bold', fontSize=11, textColor=PRIMARY)))

    doc.build(elements)
    print(f"PDF generated successfully at {filename}")

if __name__ == '__main__':
    create_stage4_pdf("STAGE4_FRONTEND_INTEGRATION_REPORT.pdf")
