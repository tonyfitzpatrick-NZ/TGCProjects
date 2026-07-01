#!/usr/bin/env python3
"""
TGC Specification PDF Generator
Generates a professional cover page + dynamic Table of Contents
for building project specifications.

Usage (later):
    python generate-specification-pdf.py --project "BAYFIELD EYE CLINIC" \
        --address "31 Bayfield Road, Dunedin" \
        --version "2.0 - Issued for Building Consent" \
        --sections '[{"number":"1","title":"Preliminaries"}, ...]'
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import argparse
import json
from datetime import datetime

# Brand Colors
NAVY = HexColor("#0D1E36")
GOLD = HexColor("#EDBD68")
LIGHT_GOLD = HexColor("#F5E8C7")
DARK_TEXT = HexColor("#1a1a1a")

PAGE_WIDTH, PAGE_HEIGHT = A4


def create_specification_pdf(
    output_path: str,
    project_name: str,
    project_address: str = "",
    version: str = "1.0 - Draft for Review",
    sections: list = None,
    logo_path: str = None,
    project_image_path: str = None,
):
    """
    Generate a professional Specification PDF with cover + dynamic TOC.
    """
    if sections is None:
        sections = []

    c = canvas.Canvas(output_path, pagesize=A4)

    # ==================== COVER PAGE ====================
    # Navy header bar
    c.setFillColor(NAVY)
    c.rect(0, PAGE_HEIGHT - 85*mm, PAGE_WIDTH, 85*mm, fill=1, stroke=0)

    # Gold accent line
    c.setStrokeColor(GOLD)
    c.setLineWidth(3)
    c.line(20*mm, PAGE_HEIGHT - 85*mm, PAGE_WIDTH - 20*mm, PAGE_HEIGHT - 85*mm)

    # Logo (if provided)
    if logo_path:
        try:
            logo = ImageReader(logo_path)
            c.drawImage(logo, 20*mm, PAGE_HEIGHT - 45*mm, width=120*mm, height=25*mm, preserveAspectRatio=True, mask='auto')
        except Exception as e:
            print(f"Warning: Could not load logo: {e}")

    # Title
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(PAGE_WIDTH/2, PAGE_HEIGHT - 115*mm, "PROJECT SPECIFICATION")

    # Project Name
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(NAVY)
    c.drawCentredString(PAGE_WIDTH/2, PAGE_HEIGHT - 145*mm, project_name)

    # Project Address
    if project_address:
        c.setFont("Helvetica", 12)
        c.setFillColor(DARK_TEXT)
        c.drawCentredString(PAGE_WIDTH/2, PAGE_HEIGHT - 155*mm, project_address)

    # Version box
    c.setFillColor(LIGHT_GOLD)
    c.roundRect(25*mm, PAGE_HEIGHT - 200*mm, PAGE_WIDTH - 50*mm, 25*mm, 5, fill=1, stroke=0)

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(PAGE_WIDTH/2, PAGE_HEIGHT - 185*mm, "VERSION")
    c.setFont("Helvetica", 12)
    c.drawCentredString(PAGE_WIDTH/2, PAGE_HEIGHT - 195*mm, version)

    # Project Image Placeholder (if provided)
    if project_image_path:
        try:
            img = ImageReader(project_image_path)
            c.drawImage(img, 30*mm, 60*mm, width=150*mm, height=90*mm, preserveAspectRatio=True)
        except Exception:
            pass
    else:
        # Placeholder box
        c.setStrokeColor(GOLD)
        c.setLineWidth(1)
        c.setDash(3, 3)
        c.rect(30*mm, 60*mm, 150*mm, 90*mm, stroke=1, fill=0)
        c.setDash()
        c.setFillColor(GOLD)
        c.setFont("Helvetica", 10)
        c.drawCentredString(PAGE_WIDTH/2, 105*mm, "Project Image Placeholder")

    # Footer
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_WIDTH, 35*mm, fill=1, stroke=0)

    c.setFillColor(white)
    c.setFont("Helvetica", 9)
    c.drawCentredString(PAGE_WIDTH/2, 20*mm, "TGC Homes | Professional Building Project Specification")
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_WIDTH/2, 12*mm, f"Generated on {datetime.now().strftime('%d %B %Y')}")

    # ==================== TABLE OF CONTENTS PAGE ====================
    c.showPage()

    # Header
    c.setFillColor(NAVY)
    c.rect(0, PAGE_HEIGHT - 30*mm, PAGE_WIDTH, 30*mm, fill=1, stroke=0)

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(PAGE_WIDTH/2, PAGE_HEIGHT - 20*mm, "TABLE OF CONTENTS")

    # Gold line
    c.setStrokeColor(GOLD)
    c.setLineWidth(2)
    c.line(20*mm, PAGE_HEIGHT - 30*mm, PAGE_WIDTH - 20*mm, PAGE_HEIGHT - 30*mm)

    # TOC Content
    y_position = PAGE_HEIGHT - 50*mm

    c.setFillColor(DARK_TEXT)
    c.setFont("Helvetica-Bold", 11)

    for section in sections:
        number = section.get("number", "")
        title = section.get("title", "")
        page = section.get("page", "")

        # Section number + title
        c.setFont("Helvetica", 10)
        c.drawString(20*mm, y_position, f"{number}. {title}")

        # Dotted leader line
        c.setStrokeColor(HexColor("#CCCCCC"))
        c.setDash(1, 2)
        text_width = c.stringWidth(f"{number}. {title}", "Helvetica", 10)
        c.line(22*mm + text_width, y_position + 3, PAGE_WIDTH - 35*mm, y_position + 3)
        c.setDash()

        # Page number
        c.setFillColor(NAVY)
        c.setFont("Helvetica", 10)
        c.drawRightString(PAGE_WIDTH - 20*mm, y_position, str(page))

        y_position -= 8*mm

        # Add new page if needed
        if y_position < 40*mm:
            c.showPage()
            y_position = PAGE_HEIGHT - 40*mm

    # Footer on TOC page
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_WIDTH, 20*mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_WIDTH/2, 8*mm, f"TGC Homes — {project_name} | Specification v{version.split()[0]}")

    c.save()
    print(f"PDF generated successfully: {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate TGC Project Specification PDF")
    parser.add_argument("--project", required=True, help="Project name")
    parser.add_argument("--address", default="", help="Project address")
    parser.add_argument("--version", default="1.0 - Draft for Review", help="Document version")
    parser.add_argument("--sections", default="[]", help="JSON list of sections")
    parser.add_argument("--output", default="Specification.pdf", help="Output PDF filename")
    parser.add_argument("--logo", default=None, help="Path to logo image")
    parser.add_argument("--image", default=None, help="Path to project image")

    args = parser.parse_args()

    sections = json.loads(args.sections)

    create_specification_pdf(
        output_path=args.output,
        project_name=args.project,
        project_address=args.address,
        version=args.version,
        sections=sections,
        logo_path=args.logo,
        project_image_path=args.image,
    )