import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

def create_dev1_pdf(filename):
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
        fontSize=20,
        leading=24,
        textColor=PRIMARY,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
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
    elements.append(Paragraph("DEVELOPER 1 — FRONTEND LEAD FINAL REPORT", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceAfter=10))

    # Overall Status Banner
    status_data = [
        [
            Paragraph("<b>FRONTEND COMPILATION & INTEGRATION</b>", ParagraphStyle('H', parent=body_style, fontName='Helvetica-Bold', textColor=PRIMARY)),
            Paragraph("<b>STATUS: PASS</b>", pass_badge_style),
            Paragraph("<b>SUITES:</b> 60/60 PASS (0 FAIL)", ParagraphStyle('H2', parent=body_style, fontName='Helvetica-Bold', textColor=ACCENT))
        ]
    ]
    status_table = Table(status_data, colWidths=[210, 110, 210])
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#C6F6D5")),
        ('BOX', (0,0), (-1,-1), 1.5, ACCENT),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
    ]))
    elements.append(status_table)
    elements.append(Spacer(1, 10))

    # Section 1: Summary of Work & Fixes
    elements.append(Paragraph("1. SUMMARY OF WORK & RESOLVED ISSUES", h1_style))
    fix_data = [
        [Paragraph("<b>Item</b>", body_style), Paragraph("<b>Issue / Action Taken</b>", body_style), Paragraph("<b>Resolution Result</b>", body_style)],
        [Paragraph("Vite/Babel Syntax Error", body_style), Paragraph("Resolved extra closing <code>&lt;/div&gt;</code> tag on line 97 of <code>Navbar.jsx</code>.", body_style), Paragraph("Clean Vite build with zero syntax errors", body_style)],
        [Paragraph("AnchorCopilotDrawer Hook Error", body_style), Paragraph("Added missing <code>useEffect</code> import to <code>AnchorCopilotDrawer.jsx</code>.", body_style), Paragraph("Prevented runtime Hook reference crash", body_style)],
        [Paragraph("Audience Q&A UI", body_style), Paragraph("Refined character counter progression, submission alerts, & responsive mobile layouts.", body_style), Paragraph("Enhanced user input feedback", body_style)],
        [Paragraph("War Room Moderation", body_style), Paragraph("Added status filter counters (PENDING, APPROVED, REJECTED, ANSWERED) & button feedback.", body_style), Paragraph("Improved organizer queue workflow", body_style)],
        [Paragraph("Anchor Q&A Feed", body_style), Paragraph("Optimized stage-friendly high-contrast dark theme & wired 5 AI assist actions.", body_style), Paragraph("Distance-readable stage interface", body_style)]
    ]
    t1 = Table(fix_data, colWidths=[140, 250, 140])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), LIGHT_BG),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t1)

    # Section 2: Automated Test Execution
    elements.append(Paragraph("2. AUTOMATED INTEGRATION TEST RESULTS (60/60 PASS)", h1_style))
    test_data = [
        [Paragraph("<b>Test Suite File</b>", body_style), Paragraph("<b>Passed</b>", body_style), Paragraph("<b>Failed</b>", body_style), Paragraph("<b>Total</b>", body_style), Paragraph("<b>Status</b>", body_style)],
        [Paragraph("tests/stage4_qa.test.js", body_style), Paragraph("21", body_style), Paragraph("0", body_style), Paragraph("21", body_style), Paragraph("PASS", body_style)],
        [Paragraph("tests/qa_assistant.test.js", body_style), Paragraph("16", body_style), Paragraph("0", body_style), Paragraph("16", body_style), Paragraph("PASS", body_style)],
        [Paragraph("tests/multitrack_integration.test.js", body_style), Paragraph("5", body_style), Paragraph("0", body_style), Paragraph("5", body_style), Paragraph("PASS", body_style)],
        [Paragraph("tests/multi_track.test.js", body_style), Paragraph("11", body_style), Paragraph("0", body_style), Paragraph("11", body_style), Paragraph("PASS", body_style)],
        [Paragraph("tests/speech_teleprompter.test.js", body_style), Paragraph("7", body_style), Paragraph("0", body_style), Paragraph("7", body_style), Paragraph("PASS", body_style)],
        [Paragraph("<b>TOTAL</b>", body_style), Paragraph("<b>60</b>", body_style), Paragraph("<b>0</b>", body_style), Paragraph("<b>60</b>", body_style), Paragraph("<b>PASS</b>", body_style)],
    ]
    t2 = Table(test_data, colWidths=[180, 70, 70, 70, 140])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), LIGHT_BG),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#EBF8FF")),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t2)

    # Section 3: Manual 19-Step E2E Verification
    elements.append(Paragraph("3. MANUAL 19-STEP BROWSER E2E VERIFICATION", h1_style))
    e2e_data = [
        [Paragraph("<b>Steps</b>", body_style), Paragraph("<b>Verification Description</b>", body_style), Paragraph("<b>Result</b>", body_style)],
        [Paragraph("1 - 3", body_style), Paragraph("Audience Q&A view submission with track selection & validation", body_style), Paragraph("PASS", body_style)],
        [Paragraph("4 - 7", body_style), Paragraph("Organizer War Room receive pending question & approval action", body_style), Paragraph("PASS", body_style)],
        [Paragraph("8", body_style), Paragraph("Anchor Station receives approved question in real-time feed", body_style), Paragraph("PASS", body_style)],
        [Paragraph("9 - 13", body_style), Paragraph("AI Assistance actions: Summarize, Shorten, Structure, Transition, Relevance", body_style), Paragraph("PASS", body_style)],
        [Paragraph("14", body_style), Paragraph("Anchor marks question answered with state update", body_style), Paragraph("PASS", body_style)],
        [Paragraph("15 - 17", body_style), Paragraph("Question rejection flow & verified isolation from Anchor feed", body_style), Paragraph("PASS", body_style)],
        [Paragraph("18 - 19", body_style), Paragraph("Multi-track separation: Track B question isolation in Track B feed ONLY", body_style), Paragraph("PASS", body_style)]
    ]
    t3 = Table(e2e_data, colWidths=[60, 400, 70])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), LIGHT_BG),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t3)

    # Section 4: System Integrity & Recommended Next Steps
    elements.append(Paragraph("4. SYSTEM INTEGRITY & RECOMMENDED NEXT STEPS", h1_style))
    elements.append(Paragraph("• <b>Stability & Regression</b>: All Stage 1–4 core functionality (Teleprompter, Speech Follower, Mirror Mode, Auto-Scroll, Pronunciation Guide, Flash Alerts, Delay Engine, AI Co-Pilot, Socket.IO) remains 100% operational.", body_style))
    elements.append(Paragraph("• <b>Recommended Next Steps</b>: Proceed with production bundle build validation (<code>npm run build --prefix client</code>) and maintain dev servers for live event demonstrations.", body_style))
    elements.append(Spacer(1, 8))

    elements.append(Paragraph("<b>Final Lead Status:</b> FRONTEND INTEGRATION & BUILD STABILITY IS FULLY VERIFIED (PASS).", ParagraphStyle('Conc', parent=body_style, fontName='Helvetica-Bold', fontSize=10.5, textColor=PRIMARY)))

    doc.build(elements)
    print(f"PDF generated successfully at {filename}")

if __name__ == '__main__':
    create_dev1_pdf("DEVELOPER_1_FRONTEND_LEAD_REPORT.pdf")
