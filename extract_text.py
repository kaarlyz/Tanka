#!/usr/bin/env python3
import sys
import os
import subprocess
import zipfile
import xml.etree.ElementTree as ET

def extract_pdf(file_path):
    try:
        res = subprocess.run(["pdftotext", file_path, "-"], capture_output=True, text=True, check=True)
        text = res.stdout.strip()
        if text:
            return text
        
        # Fallback OCR if PDF is scanned or flattened image (e.g. Print To PDF)
        import tempfile
        import glob
        with tempfile.TemporaryDirectory() as tmpdir:
            prefix = os.path.join(tmpdir, "page")
            subprocess.run(["pdftoppm", "-png", "-r", "150", file_path, prefix], check=True, capture_output=True)
            page_pngs = sorted(glob.glob(os.path.join(tmpdir, "page-*.png")))
            ocr_texts = []
            for png in page_pngs:
                t_res = subprocess.run(
                    ["tesseract", png, "stdout", "-l", "ind+eng", "--oem", "1"],
                    capture_output=True,
                    text=True
                )
                if t_res.stdout and t_res.stdout.strip():
                    ocr_texts.append(t_res.stdout.strip())
            if ocr_texts:
                return "\n\n--- Halaman Berikutnya ---\n\n".join(ocr_texts)
        return ""
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
                if shape.has_table:
                    for row in shape.table.rows:
                        row_txt = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                        if row_txt:
                            cur.append(" | ".join(row_txt))
            if cur:
                slides_text.append(f"--- Slide {idx} ---\n" + "\n".join(cur))
        return "\n\n".join(slides_text)
    except Exception:
        # Fallback stdlib zipfile + XML extraction (no pptx pip module needed)
        try:
            with zipfile.ZipFile(file_path) as z:
                slide_names = sorted(
                    [n for n in z.namelist() if n.startswith("ppt/slides/slide") and n.endswith(".xml")],
                    key=lambda x: int("".join(filter(str.isdigit, x)) or 0)
                )
                slides_text = []
                for idx, sname in enumerate(slide_names, 1):
                    xml_content = z.read(sname)
                    tree = ET.fromstring(xml_content)
                    texts = []
                    for node in tree.iter():
                        if node.tag.endswith("}t") and node.text and node.text.strip():
                            texts.append(node.text.strip())
                    if texts:
                        slides_text.append(f"--- Slide {idx} ---\n" + "\n".join(texts))
                if slides_text:
                    return "\n\n".join(slides_text)
            return "[PPTX kosong / tidak ditemukan teks slide]"
        except Exception as fallback_err:
            return f"[Error ekstrak PPTX: {fallback_err}]"

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
