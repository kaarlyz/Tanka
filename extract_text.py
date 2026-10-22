#!/usr/bin/env python3
import sys
import os
import subprocess
import zipfile
import xml.etree.ElementTree as ET
import tempfile
import glob

def extract_pdf(file_path):
    try:
        res = subprocess.run(["pdftotext", file_path, "-"], capture_output=True, text=True, check=True)
        raw_text = res.stdout
        
        # Split per page using form-feed character (\x0c)
        pages = raw_text.split("\x0c")
        # Clean trailing empty page
        if pages and not pages[-1].strip():
            pages.pop()

        final_pages = []
        needs_ocr = []

        for idx, page in enumerate(pages, 1):
            p_strip = page.strip()
            if len(p_strip) >= 30:
                final_pages.append((idx, p_strip))
            else:
                needs_ocr.append(idx)

        # If all or some pages are scanned (sparse/empty text), OCR those specific pages in parallel
        if needs_ocr:
            from concurrent.futures import ThreadPoolExecutor
            with tempfile.TemporaryDirectory() as tmpdir:
                # Support up to 60 scanned pages without premature truncation
                ocr_targets = needs_ocr[:60]

                def process_ocr_page(page_num):
                    prefix = os.path.join(tmpdir, f"page_{page_num}")
                    try:
                        subprocess.run(
                            ["pdftoppm", "-png", "-r", "150", "-f", str(page_num), "-l", str(page_num), file_path, prefix],
                            capture_output=True,
                            timeout=20
                        )
                        pngs = glob.glob(f"{prefix}*.png")
                        if pngs:
                            t_res = subprocess.run(
                                ["tesseract", pngs[0], "stdout", "-l", "ind+eng", "--oem", "1"],
                                capture_output=True,
                                text=True,
                                timeout=20
                            )
                            ocr_txt = t_res.stdout.strip()
                            if ocr_txt:
                                return (page_num, ocr_txt)
                    except Exception as ocr_err:
                        pass
                    return None

                with ThreadPoolExecutor(max_workers=min(8, os.cpu_count() or 4)) as executor:
                    results = list(executor.map(process_ocr_page, ocr_targets))
                    for res in results:
                        if res:
                            final_pages.append(res)

        # Extract embedded images and tag pages with their image placeholders
        page_images_map = {}
        try:
            uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "exam_images")
            os.makedirs(uploads_dir, exist_ok=True)
            doc_base = os.path.splitext(os.path.basename(file_path))[0]
            prefix_img = os.path.join(uploads_dir, f"{doc_base}_img")
            # Extract images and also query page mapping using pdfimages -list
            list_res = subprocess.run(["pdfimages", "-list", file_path], capture_output=True, text=True, timeout=20)
            if list_res.returncode == 0:
                lines = list_res.stdout.splitlines()
                # Parse pdfimages list output: page num type width height ...
                for line in lines[2:]:
                    parts = line.split()
                    if len(parts) >= 2 and parts[0].isdigit() and parts[1].isdigit():
                        p_num = int(parts[0])
                        img_idx = int(parts[1])
                        # If width > 400 and height > 200 (likely diagram/infographic/illustration, not a tiny icon)
                        if len(parts) >= 5 and parts[3].isdigit() and parts[4].isdigit():
                            w, h = int(parts[3]), int(parts[4])
                            if w >= 350 and h >= 150:
                                if p_num not in page_images_map:
                                    page_images_map[p_num] = []
                                # pdfimages -png produces: prefix-000.png, prefix-001.png
                                img_filename = f"{doc_base}_img-{img_idx:03d}.png"
                                page_images_map[p_num].append(f"/uploads/exam_images/{img_filename}")
            subprocess.run(["pdfimages", "-png", file_path, prefix_img], capture_output=True, timeout=30)
        except Exception:
            pass

        # Sort pages back into original sequence and inject image tags
        final_pages.sort(key=lambda x: x[0])
        augmented_pages = []
        for p_num, txt in final_pages:
            p_txt = txt
            if p_num in page_images_map:
                for img_url in page_images_map[p_num]:
                    p_txt = f"[Gambar: {img_url}]\n\n" + p_txt
            augmented_pages.append(p_txt)

        extracted = "\n\n--- Halaman Berikutnya ---\n\n".join(augmented_pages)
        if extracted.strip():
            return extracted.strip()

        # Ultimate fallback if pdftotext completely blanked
        with tempfile.TemporaryDirectory() as tmpdir:
            prefix = os.path.join(tmpdir, "page")
            subprocess.run(["pdftoppm", "-png", "-r", "150", "-l", "10", file_path, prefix], capture_output=True)
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

        return "[PDF kosong atau tidak dapat diekstraksi]"
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

def extract_xlsx(file_path):
    try:
        with zipfile.ZipFile(file_path) as z:
            # 1. Baca shared strings
            shared_strings = []
            if "xl/sharedStrings.xml" in z.namelist():
                tree = ET.fromstring(z.read("xl/sharedStrings.xml"))
                for si in tree.findall("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si"):
                    t = "".join(node.text for node in si.iter() if node.text)
                    shared_strings.append(t.strip())

            # 2. Baca lembar kerja (worksheets)
            sheet_names = sorted(
                [n for n in z.namelist() if n.startswith("xl/worksheets/sheet") and n.endswith(".xml")],
                key=lambda x: int("".join(filter(str.isdigit, x)) or 0)
            )
            sheets_text = []
            for idx, sname in enumerate(sheet_names, 1):
                tree = ET.fromstring(z.read(sname))
                rows = []
                for row in tree.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row"):
                    row_vals = []
                    for c in row.findall("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c"):
                        cell_type = c.get("t")
                        v = c.find("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v")
                        val = v.text if v is not None and v.text else ""
                        if cell_type == "s" and val.isdigit():
                            s_idx = int(val)
                            val = shared_strings[s_idx] if s_idx < len(shared_strings) else val
                        if val:
                            row_vals.append(val.strip())
                    if row_vals:
                        rows.append(" | ".join(row_vals))
                if rows:
                    sheets_text.append(f"--- Lembar {idx} ---\n" + "\n".join(rows))
            if sheets_text:
                return "\n\n".join(sheets_text)
            return "[File Excel kosong]"
    except Exception as e:
        return f"[Error ekstrak XLSX: {e}]"

def extract_via_libreoffice(file_path):
    """Fallback extractor untuk format legacy Office (.doc, .ppt, .xls) dan OpenDocument (.odt, .ods, .odp)."""
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            res = subprocess.run(
                ["libreoffice", "--headless", "--convert-to", "txt:Text", file_path, "--outdir", tmpdir],
                capture_output=True,
                text=True,
                timeout=30
            )
            txt_files = glob.glob(os.path.join(tmpdir, "*.txt"))
            if txt_files:
                with open(txt_files[0], "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read().strip()
                    if content:
                        return content
        return "[Berkas Office kosong atau tidak dapat dikonversi]"
    except Exception as e:
        return f"[Error konversi LibreOffice: {e}]"

def extract_image(file_path):
    try:
        ext = os.path.splitext(file_path)[1].lower()
        target_path = file_path
        tmp_converted = None

        # Konversi format HEIC/HEIF/AVIF/TIFF via ImageMagick sebelum OCR
        if ext in [".heic", ".heif", ".avif", ".tiff", ".tif"]:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tf:
                tmp_converted = tf.name
            subprocess.run(["magick", file_path, tmp_converted], check=True, capture_output=True)
            target_path = tmp_converted

        res = subprocess.run(
            ["tesseract", target_path, "stdout", "-l", "ind+eng", "--oem", "1"],
            capture_output=True,
            text=True,
            check=True
        )
        if tmp_converted and os.path.exists(tmp_converted):
            try: os.unlink(tmp_converted)
            except: pass
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
    elif ext in [".xlsx", ".xlsm"]:
        print(extract_xlsx(file_path))
    elif ext in [".doc", ".ppt", ".xls", ".odt", ".ods", ".odp"]:
        print(extract_via_libreoffice(file_path))
    elif ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".heic", ".heif", ".avif", ".tiff", ".tif"]:
        print(extract_image(file_path))
    elif ext in [".txt", ".md", ".json", ".csv", ".tsv", ".rtf", ".tex"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            print(f.read().strip())
    else:
        # Coba baca teks biasa terlebih dahulu jika berkas berbasis teks
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    print(content)
                    return
        except UnicodeDecodeError:
            pass

        # Fallback konversi dokumen generic
        converted = extract_via_libreoffice(file_path)
        if converted and not converted.startswith("[Error"):
            print(converted)
        else:
            print(f"[Format berkas {ext} tidak didukung atau berupa biner tidak terbaca]")

if __name__ == "__main__":
    main()
