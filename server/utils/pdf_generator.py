import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from io import BytesIO
from datetime import datetime

def generate_checklist_pdf(checklist_data):
    """
    Generate a PDF for a control checklist.
    
    Args:
        checklist_data: Dict with checklist details including:
            - printerSerialNumber
            - template (name, description, items)
            - entries
            - status
            - createdAt
            - completedAt (optional)
            - shippedAt (optional)
    
    Returns:
        BytesIO object containing the PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                          rightMargin=0.5*inch,
                          leftMargin=0.5*inch,
                          topMargin=0.5*inch,
                          bottomMargin=0.5*inch)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#1A365D'),
        spaceAfter=20,
        alignment=0  # Left
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2C5282'),
        spaceAfter=12,
        spaceBefore=16
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=0
    )
    
    bold_style = ParagraphStyle(
        'CustomBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        spaceAfter=0
    )
    
    story = []

    # Logo
    logo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets', 'iacs_logo.png')
    if os.path.exists(logo_path):
        img = ImageReader(logo_path)
        img_w, img_h = img.getSize()
        # Scale to a fixed width while keeping aspect ratio intact
        target_width = 1.25 * inch
        target_height = target_width * (img_h / float(img_w))
        
        logo = Image(logo_path, width=target_width, height=target_height)
        logo.hAlign = 'LEFT'
        story.append(logo)
        story.append(Spacer(1, 0.2*inch))
    
    # Title
    story.append(Paragraph("Control Checklist Report", title_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Header Information
    header_data = [
        [Paragraph('Printer Serial Number:', bold_style), Paragraph(checklist_data.get('printerSerialNumber', 'N/A'), normal_style)],
        [Paragraph('Template:', bold_style), Paragraph(checklist_data.get('template', {}).get('name', 'N/A'), normal_style)],
        [Paragraph('Status:', bold_style), Paragraph(checklist_data.get('status', 'N/A').upper(), normal_style)],
        [Paragraph('Created:', bold_style), Paragraph(datetime.fromisoformat(checklist_data['createdAt']).strftime('%Y-%m-%d %H:%M') if 'createdAt' in checklist_data else 'N/A', normal_style)],
    ]
    
    if checklist_data.get('completedAt'):
        header_data.append([Paragraph('Completed:', bold_style), Paragraph(datetime.fromisoformat(checklist_data['completedAt']).strftime('%Y-%m-%d %H:%M'), normal_style)])
    
    if checklist_data.get('shippedAt'):
        header_data.append([Paragraph('Shipped:', bold_style), Paragraph(datetime.fromisoformat(checklist_data['shippedAt']).strftime('%Y-%m-%d %H:%M'), normal_style)])
    
    header_table = Table(header_data, colWidths=[2.5*inch, 4.5*inch])
    header_table.hAlign = 'LEFT'
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#EDF2F7')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Separate by type
    template_items = {item['id']: item for item in checklist_data.get('template', {}).get('items', [])}
    entries_by_id = {entry['itemId']: entry for entry in checklist_data.get('entries', [])}
    
    # Testing Section
    testing_items = [item for item in checklist_data.get('template', {}).get('items', []) if item['type'] == 'test']
    if testing_items:
        story.append(Paragraph("Testing Checklist", heading_style))
        
        col_headers_test = [
            Paragraph('<b><font color="white">Item</font></b>', normal_style),
            Paragraph('<b><font color="white">Status</font></b>', normal_style),
            Paragraph('<b><font color="white">Comments</font></b>', normal_style)
        ]
        testing_data = [col_headers_test]
        
        for item in testing_items:
            entry = entries_by_id.get(item['id'], {})
            status = '✓ PASSED' if entry.get('isChecked') else '✗ NOT CHECKED'
            status_color = colors.darkgreen if entry.get('isChecked') else colors.darkred
            
            # Using bold_style internally but passing color code
            status_p = Paragraph(f'<b><font color="{status_color}">{status}</font></b>', normal_style)
            
            comment = entry.get('comment', '') or ''
            
            testing_data.append([
                Paragraph(item['label'], normal_style),
                status_p,
                Paragraph(comment, normal_style)
            ])
        
        # Table colWidths: 7.5 inches total (3.5 + 1.2 + 2.8 = 7.5)
        testing_table = Table(testing_data, colWidths=[3.5*inch, 1.2*inch, 2.8*inch])
        testing_table.hAlign = 'LEFT'
        testing_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2B6CB0')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.25, colors.lightgrey),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#A0AEC0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F7FAFC')]),
        ]))
        story.append(testing_table)
        story.append(Spacer(1, 0.2*inch))
    
    # Facts/Control Section
    control_items = [item for item in checklist_data.get('template', {}).get('items', []) if item['type'] == 'control']
    if control_items:
        story.append(Paragraph("Facts & Controls", heading_style))
        
        col_headers_facts = [
            Paragraph('<b><font color="white">Fact</font></b>', normal_style),
            Paragraph('<b><font color="white">Value</font></b>', normal_style)
        ]
        facts_data = [col_headers_facts]
        
        for item in control_items:
            entry = entries_by_id.get(item['id'], {})
            value = str(entry.get('value', ''))
            facts_data.append([
                Paragraph(item['label'], normal_style),
                Paragraph(value, normal_style)
            ])
        
        # Table colWidths: 7.5 inches total (3.5 + 4.0 = 7.5)
        facts_table = Table(facts_data, colWidths=[3.5*inch, 4.0*inch])
        facts_table.hAlign = 'LEFT'
        facts_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2C7A7B')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.25, colors.lightgrey),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#A0AEC0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F7FAFC')]),
        ]))
        story.append(facts_table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer
