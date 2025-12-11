from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
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
                          topMargin=0.75*inch,
                          bottomMargin=0.75*inch)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2D3748'),
        spaceAfter=30,
        alignment=1  # Center
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2D3748'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=6
    )
    
    story = []
    
    # Title
    story.append(Paragraph("Control Checklist Report", title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Header Information
    header_data = [
        ['Printer Serial Number:', checklist_data['printerSerialNumber']],
        ['Template:', checklist_data.get('template', {}).get('name', 'N/A')],
        ['Status:', checklist_data['status'].upper()],
        ['Created:', datetime.fromisoformat(checklist_data['createdAt']).strftime('%Y-%m-%d %H:%M')],
    ]
    
    if checklist_data.get('completedAt'):
        header_data.append(['Completed:', datetime.fromisoformat(checklist_data['completedAt']).strftime('%Y-%m-%d %H:%M')])
    
    if checklist_data.get('shippedAt'):
        header_data.append(['Shipped:', datetime.fromisoformat(checklist_data['shippedAt']).strftime('%Y-%m-%d %H:%M')])
    
    header_table = Table(header_data, colWidths=[2*inch, 4*inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#EDF2F7')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Separate by type
    template_items = {item['id']: item for item in checklist_data.get('template', {}).get('items', [])}
    entries_by_id = {entry['itemId']: entry for entry in checklist_data.get('entries', [])}
    
    # Testing Section
    testing_items = [item for item in checklist_data.get('template', {}).get('items', []) if item['type'] == 'test']
    if testing_items:
        story.append(Paragraph("Testing Checklist", heading_style))
        
        testing_data = [['Item', 'Status', 'Comments']]
        for item in testing_items:
            entry = entries_by_id.get(item['id'], {})
            status = '✓ PASSED' if entry.get('isChecked') else '✗ NOT CHECKED'
            comment = entry.get('comment', '')
            testing_data.append([item['label'], status, comment])
        
        testing_table = Table(testing_data, colWidths=[2.5*inch, 1.5*inch, 2*inch])
        testing_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#667eea')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F7FAFC')]),
        ]))
        story.append(testing_table)
        story.append(Spacer(1, 0.3*inch))
    
    # Facts/Control Section
    control_items = [item for item in checklist_data.get('template', {}).get('items', []) if item['type'] == 'control']
    if control_items:
        story.append(Paragraph("Facts & Controls", heading_style))
        
        facts_data = [['Fact', 'Value']]
        for item in control_items:
            entry = entries_by_id.get(item['id'], {})
            value = entry.get('value', '')
            facts_data.append([item['label'], value])
        
        facts_table = Table(facts_data, colWidths=[2.5*inch, 3.5*inch])
        facts_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f093fb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F7FAFC')]),
        ]))
        story.append(facts_table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer
