#!/usr/bin/env python3
import sys
import os
import subprocess
import zipfile
import xml.etree.ElementTree as ET

def extract_pdf(file_path):
    try:
        res = subprocess.run(["pdftotext", file_path, "-"], capture_output=True, text=True, check=True)
        return res.stdout.strip()
    except Exception as e:
        return f"[Error ekstrak PDF: {e}]"

def extract_docx(file_path):
    try:
        with zipfile.ZipFile(file_path) as z:
            xml_content = z.read("word/document.xml")
        tree = ET.fromstring(xml_content)
        paragraphs = []
        for node in tree.iter():
            if node.tag.endswith("}p"):
                p_text = "".join(n.text for n in node.iter() if n.text)
                if p_text.strip():
                    paragraphs.append(p_text.strip())
        return "\n\n".join(paragraphs)
    except Exception as e:
        return f"[Error ekstrak DOCX: {e}]"

def extract_pptx(file_path):
    try:
        import pptx
        prs = pptx.Presentation(file_path)
        slides_text = []
        for idx, slide in enumerate(prs.slides, 1):
            cur = []
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        t = paragraph.text.strip()
                        if t:
                            cur.append(t)
            if cur:
                slides_text.append(f"--- Slide {idx} ---\n" + "\n".join(cur))
        return "\n\n".join(slides_text)
    except Exception as e:
        return f"[Error ekstrak PPTX: {e}]"

def extract_image(file_path):
    try:
        res = subprocess.run(
            ["tesseract", file_path, "stdout", "-l", "ind+eng", "--oem", "1"],
            capture_output=True,
            text=True,
            check=True
        )
        return res.stdout.strip()
    except Exception as e:
        return f"[Error OCR Gambar: {e}]"

def main():
    if len(sys.argv) < 2:
        print("Usage: extract_text.py <file_path>", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        print(extract_pdf(file_path))
    elif ext == ".docx":
        print(extract_docx(file_path))
    elif ext == ".pptx":
        print(extract_pptx(file_path))
    elif ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp"]:
        print(extract_image(file_path))
    elif ext in [".txt", ".md", ".json", ".csv", ".rtf"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            print(f.read().strip())
    else:
        # Fallback to pdftotext or strings
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                print(f.read().strip())
        except Exception as e:
            print(f"[Format {ext} tidak didukung: {e}]", file=sys.stderr)
            sys.exit(1)

if __name__ == "__main__":
    main()
