import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

def create_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#1A365D")   # Deep Navy
    SECONDARY = colors.HexColor("#2B6CB0") # Vibrant Blue
    ACCENT = colors.HexColor("#319795")    # Teal Accent
    DARK_TEXT = colors.HexColor("#2D3748") # Charcoal
    LIGHT_BG = colors.HexColor("#F7FAFC")  # Cool Grey Background
    BORDER_COLOR = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        alignment=TA_LEFT,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=DARK_TEXT,
        spaceAfter=8
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1A202C")
    )

    story = []

    # Title Banner
    story.append(Paragraph("🚀 STAGEPILOT (STAGEFLOW)", title_style))
    story.append(Paragraph("<b>Project Progress Report & GPT Context Handover</b> | Date: Sep 19, 2026", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceBefore=0, spaceAfter=15))

    # Section 1: Project Overview
    story.append(Paragraph("1. Project Architecture & Overview", h1_style))
    overview_text = (
        "<b>StagePilot (StageFlow)</b> is a real-time multi-track stage management and live teleprompter application. "
        "It empowers event organizers to control schedules, manage speaker delays across multiple stages, and provide "
        "anchors with a synchronized, high-contrast teleprompter featuring real-time speech tracking and AI assistance."
    )
    story.append(Paragraph(overview_text, body_style))

    # Architecture Specs Table
    arch_data = [
        [Paragraph("<b>Component</b>", body_style), Paragraph("<b>Technology & Setup</b>", body_style)],
        [Paragraph("<b>Repository</b>", body_style), Paragraph("https://github.com/rudra0279/StageFlow.git", body_style)],
        [Paragraph("<b>Frontend App</b>", body_style), Paragraph("React + Vite (Port 5173 / 5175), Web Audio API, Web Speech API", body_style)],
        [Paragraph("<b>Backend Server</b>", body_style), Paragraph("Node.js, Express, Socket.IO (Port 5001 - port 5000 fallback handled)", body_style)],
        [Paragraph("<b>Database</b>", body_style), Paragraph("MongoDB (with In-Memory Server fallback & auto-seeding for local dev)", body_style)],
        [Paragraph("<b>AI Provider</b>", body_style), Paragraph("Google Gemini AI API (Script generation & Stage Co-Pilot)", body_style)]
    ]

    t_arch = Table(arch_data, colWidths=[120, 410])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), LIGHT_BG),
        ('TEXTCOLOR', (0,0), (-1,0), PRIMARY),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 15))

    # Section 2: Implementation Matrix
    story.append(Paragraph("2. Stage Implementation Matrix", h1_style))
    
    matrix_data = [
        [Paragraph("<b>Stage / Feature</b>", body_style), Paragraph("<b>Description</b>", body_style), Paragraph("<b>Status</b>", body_style)],
        [
            Paragraph("<b>Stage 1: Anchor Teleprompter</b>", body_style),
            Paragraph("High-contrast UI, mirror mode (flip horizontally), auto-scroll, speed/font controls, pronunciation guide, urgent flash banner, Web Audio chime, Browser STT Speech Follower.", body_style),
            Paragraph("<font color='#276749'><b>COMPLETED</b></font>", body_style)
        ],
        [
            Paragraph("<b>Stage 2: Organizer War Room</b>", body_style),
            Paragraph("Real-time control dashboard, Cascading Delay Engine across sessions, AI Stage Co-Pilot (Gemini API), Socket.IO live sync.", body_style),
            Paragraph("<font color='#276749'><b>COMPLETED</b></font>", body_style)
        ],
        [
            Paragraph("<b>Stage 3: Multi-Track System</b>", body_style),
            Paragraph("Track A (Main Stage), Track B (Workshop Hall), Track C (Networking) support, track-isolated delay engine, track selector in Anchor view, 13/13 test suite passing.", body_style),
            Paragraph("<font color='#276749'><b>COMPLETED</b></font>", body_style)
        ],
        [
            Paragraph("<b>Infrastructure & Fixes</b>", body_style),
            Paragraph("Fixed missing helmet module, resolved macOS Port 5000 AirPlay conflict by moving server to Port 5001, updated Vite proxy config, pushed all commits to remote main.", body_style),
            Paragraph("<font color='#276749'><b>RESOLVED & PUSHED</b></font>", body_style)
        ]
    ]

    t_matrix = Table(matrix_data, colWidths=[130, 320, 80])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_BG])
    ]))
    story.append(t_matrix)
    story.append(Spacer(1, 15))

    # Section 3: Operational Status
    story.append(Paragraph("3. Operational Credentials & Endpoint Verification", h1_style))
    
    op_text = (
        "• <b>Backend API Endpoint</b>: <code>http://localhost:5001/api</code> (Health Check: <code>http://localhost:5001/api/health</code>)<br/>"
        "• <b>Frontend Client App</b>: <code>http://localhost:5173</code> or <code>http://localhost:5175</code><br/>"
        "• <b>Demo Account (Organizer)</b>: <code>organizer@stagepilot.io</code> | Password: <code>password123</code><br/>"
        "• <b>Demo Account (Anchor)</b>: <code>anchor@stagepilot.io</code> | Password: <code>password123</code>"
    )
    story.append(Paragraph(op_text, body_style))
    story.append(Spacer(1, 15))

    # Section 4: Prompt Template for Next GPT Session
    story.append(Paragraph("4. Ready-to-Use Prompt Template for GPT", h1_style))
    
    prompt_code = (
        "Hi GPT! I am continuing work on StagePilot (StageFlow), a real-time multi-track stage management and teleprompter application.\n\n"
        "Current Architecture & Completed Features:\n"
        "1. Tech Stack: Node.js, Express, Socket.IO, MongoDB, React, Vite, Web Speech API, Gemini AI.\n"
        "2. Teleprompter: High-contrast stage view, mirror mode, auto-scroll, Web Speech STT follower, audio announcements.\n"
        "3. Organizer War Room: Live control dashboard, Cascading Delay Engine, AI Stage Co-Pilot.\n"
        "4. Multi-Track Engine: Track A, Track B, Track C support with track-isolated delay management.\n"
        "5. Deployment & Remote: Server on Port 5001, Client proxy configured, all code pushed to GitHub (https://github.com/rudra0279/StageFlow.git).\n\n"
        "I would like to implement the following next task/feature:\n"
        "[INSERT YOUR NEXT FEATURE HERE - e.g. 'Add PDF export for stage schedules', 'Build presenter timer HUD', or 'Add speaker analytics']\n\n"
        "Please analyze my architecture and provide a step-by-step technical implementation plan."
    )

    # Box container for prompt
    p_box = Table([[Paragraph(prompt_code.replace('\n', '<br/>'), code_style)]], colWidths=[530])
    p_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, SECONDARY),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(p_box)

    doc.build(story)
    print(f"Successfully generated PDF at: {filename}")

if __name__ == "__main__":
    path1 = "/Users/jeeya_mac/Stagepilot/StageFlow/StagePilot_Project_Progress_Report.pdf"
    path2 = "/Users/jeeya_mac/Stagepilot/StagePilot_Project_Progress_Report.pdf"
    create_pdf(path1)
    create_pdf(path2)
