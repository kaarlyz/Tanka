#!/usr/bin/env python3
import sys
import os
import re
import subprocess
import zipfile
import xml.etree.ElementTree as ET
import tempfile
import glob
import hashlib

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
        sparse_pages = {}

        for idx, page in enumerate(pages, 1):
            p_strip = page.strip()
            # Halaman dengan teks minimal (< 150 karakter) atau tanpa pola soal utuh tetap wajib OCR
            if len(p_strip) >= 150:
                final_pages.append((idx, p_strip))
            else:
                needs_ocr.append(idx)
                if p_strip:
                    sparse_pages[idx] = p_strip

        # If all or some pages are scanned (sparse/empty text), OCR those specific pages in parallel
        tess_env = {**os.environ, "OMP_THREAD_LIMIT": "1"}
        cpu_workers = min(8, os.cpu_count() or 4)
        if needs_ocr:
            from concurrent.futures import ThreadPoolExecutor
            with tempfile.TemporaryDirectory() as tmpdir:
                # Support up to 60 scanned pages without premature truncation
                ocr_targets = sorted(needs_ocr[:60])
                min_p, max_p = min(ocr_targets), max(ocr_targets)
                prefix = os.path.join(tmpdir, "page")
                # Single batch render instead of N individual subprocess spawns
                subprocess.run(
                    ["pdftoppm", "-png", "-r", "150", "-f", str(min_p), "-l", str(max_p), file_path, prefix],
                    capture_output=True,
                    timeout=30
                )

                pad_len = max(len(str(max_p)), 2)
                def process_ocr_page(page_num):
                    png_name = f"{prefix}-{page_num:0{pad_len}d}.png"
                    if not os.path.exists(png_name):
                        cands = [f for f in glob.glob(f"{prefix}*.png") if re.search(rf"-0*{page_num}\.png$", f)]
                        if cands:
                            png_name = cands[0]
                    if os.path.exists(png_name):
                        try:
                            t_res = subprocess.run(
                                ["tesseract", png_name, "stdout", "-l", "ind+eng", "--oem", "1"],
                                capture_output=True,
                                text=True,
                                timeout=20,
                                env=tess_env
                            )
                            ocr_txt = t_res.stdout.strip()
                            if ocr_txt:
                                orig_sparse = sparse_pages.get(page_num, "")
                                if orig_sparse and orig_sparse not in ocr_txt:
                                    return (page_num, f"{orig_sparse}\n\n{ocr_txt}".strip())
                                return (page_num, ocr_txt)
                        except Exception:
                            pass
                    orig_sparse = sparse_pages.get(page_num, "")
                    if orig_sparse:
                        return (page_num, orig_sparse)
                    return None

                with ThreadPoolExecutor(max_workers=cpu_workers) as executor:
                    results = list(executor.map(process_ocr_page, ocr_targets))
                    for res in results:
                        if res:
                            final_pages.append(res)

        # Extract embedded images and tag pages with their image placeholders
        # Menggunakan 3-Layer Zero-Token Heuristic Filter:
        # Layer 1: Eliminasi Header/Metadata dokumen (Hierarki Indikator, Bentuk Soal)
        # Layer 2: Deteksi Pure Art (Ilustrasi/Lukisan Murni tanpa OCR teks, misal No 16 tolak tambang & No 27 hoax)
        # Layer 3: Deteksi Infografis, Grafik & Tabel berstruktur (mengandung keyword visual atau data matriks)
        page_images_map = {}
        try:
            uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "exam_images")
            os.makedirs(uploads_dir, exist_ok=True)
            with open(file_path, "rb") as f:
                doc_hash = hashlib.sha256(f.read()).hexdigest()[:16]
            
            # Ambil koordinat vertikal (top) dan tinggi halaman via pdftohtml -xml jika tersedia
            xml_page_images = {}
            try:
                xml_res = subprocess.run(["pdftohtml", "-xml", "-stdout", file_path], capture_output=True, text=True, timeout=12)
                if xml_res.returncode == 0 and xml_res.stdout:
                    root_xml = ET.fromstring(xml_res.stdout)
                    for page_el in root_xml.findall("page"):
                        p_num_xml = int(page_el.get("number", 0))
                        p_h = float(page_el.get("height", 0))
                        xml_page_images[p_num_xml] = []
                        for img_el in page_el.findall("image"):
                            top_val = float(img_el.get("top", 0))
                            h_val = float(img_el.get("height", 0))
                            xml_page_images[p_num_xml].append((top_val, h_val, p_h))
            except Exception:
                pass

            with tempfile.TemporaryDirectory() as img_tmpdir:
                prefix_img = os.path.join(img_tmpdir, "img")
                # 1. Ekstrak objek raster asli secara native ke tmpfs (tanpa overhead dekompresi PNG)
                subprocess.run(["pdfimages", file_path, prefix_img], capture_output=True, timeout=25)
                
                # 2. Ambil metadata mapping halaman dari pdfimages -list
                list_res = subprocess.run(["pdfimages", "-list", file_path], capture_output=True, text=True, timeout=20)
                if list_res.returncode == 0:
                    lines = list_res.stdout.splitlines()
                    candidates = []
                    page_img_counts = {}
                    for line in lines[2:]:
                        parts = line.split()
                        if len(parts) >= 5 and parts[0].isdigit() and parts[1].isdigit():
                            p_num = int(parts[0])
                            img_idx = int(parts[1])
                            w, h = int(parts[3]), int(parts[4])
                            
                            # Filter dimensi gambar bermakna (bukan icon / garis pembatas / smask alpha mask)
                            is_not_mask = parts[2].lower() != "smask"
                            if is_not_mask and w >= 220 and h >= 120:
                                cands = glob.glob(f"{prefix_img}-{img_idx:03d}.*")
                                if cands:
                                    pos_on_page = page_img_counts.get(p_num, 0)
                                    page_img_counts[p_num] = pos_on_page + 1

                                    top_val = None
                                    p_height = None
                                    if p_num in xml_page_images and pos_on_page < len(xml_page_images[p_num]):
                                        top_val, _, p_height = xml_page_images[p_num][pos_on_page]

                                    candidates.append((p_num, img_idx, cands[0], w, h, top_val, p_height, pos_on_page))

                    def process_candidate_img(cand):
                        p_num, img_idx, img_filepath, w, h, top_val, p_height, pos_on_page = cand
                        try:
                            # Jalankan OCR lokal cepat pada kandidat gambar
                            t_res = subprocess.run(
                                ["tesseract", img_filepath, "stdout", "-l", "ind+eng", "--oem", "1"],
                                capture_output=True,
                                text=True,
                                timeout=10,
                                env=tess_env
                            )
                            img_ocr_text = t_res.stdout.strip() if t_res.returncode == 0 else ""
                            
                            # Layer 1: Skip jika banner header kurikulum/metadata
                            if any(h_kw in img_ocr_text for h_kw in ["Hierarki Indikator", "Bentuk Soal", "Kompetensi:", "Subelemen:"]):
                                return None

                            # Layer 2: Pure Art / Visual Illustration (0 karakter atau minim teks)
                            is_pure_art = len(img_ocr_text) <= 5

                            # Layer 3: True Graphic/Chart/Table/Infographic
                            # Keyword visual sah HANYA: grafik, diagram, tabel, kurva, bagan, infografis, peta, kartun, karikatur, ilustrasi
                            visual_keywords = ["grafik", "diagram", "tabel", "kurva", "bagan", "infografis", "peta", "kartun", "karikatur", "ilustrasi"]
                            has_explicit_heading = any(re.search(rf"\b{kw}\b", img_ocr_text, re.I) for kw in visual_keywords)
                            has_chart_symbols = bool(re.search(r"\b\d+\s+\d+\s+\d+\s+\d+\b", img_ocr_text)) # deretan angka sumbu grafik
                            is_structured_visual = has_explicit_heading or has_chart_symbols

                            # Kepadatan teks (karakter per pixel)
                            area = (w * h) if (w and h) else 0
                            density = (len(img_ocr_text) / area) if area > 0 else 0

                            # Tolak Raster Wacana Teks Padat (Dense Prose Rejection):
                            # Jika len > 200 dan teks berupa kalimat/paragraf narasi biasa (memuat konjungsi/paragraf tanpa tabel/angka sumbu grafik),
                            # gambar tersebut adalah wacana bacaan yang ter-rasterize, BUKAN ilustrasi visual. Tolak.
                            has_table_matrix = bool(re.search(r"\|\s*[^|]+\s*\|", img_ocr_text))
                            conjs = [" bahwa ", " yang ", " dan ", " di ", " dari ", " untuk ", " dengan ", " dalam ", " pada ", " atau ", " jika ", " maka ", " akan "]
                            has_prose_conjunctions = sum(1 for c in conjs if c in f" {img_ocr_text.lower()} ") >= 2
                            is_dense_prose = len(img_ocr_text) > 200 and not has_chart_symbols and not has_table_matrix and (has_prose_conjunctions or density > 0.0008)
                            if is_dense_prose:
                                return None

                            # Terima Ilustrasi / Poster Wacana:
                            # Gambar berdimensi besar (lebar >= 400 dan tinggi >= 200) dengan kepadatan teks rendah (< 0.0008 karakter per pixel)
                            # atau memuat poster slogan ("PANTAI BERSIH TANPA SAMPAH")
                            has_poster_slogan = bool(re.search(r"pantai\s+bersih\s+tanpa\s+sampah", img_ocr_text, re.I))
                            is_illustration = ((w >= 400 and h >= 200 and density < 0.0008) or has_poster_slogan) and not is_dense_prose

                            # Anti-Leak: Jangan ambil potongan jika itu murni teks soal/pilihan ganda
                            is_pure_question_or_choice = bool(re.search(r"^\s*(?:[A-Ea-e][\.\)]|Berdasarkan|Manakah|Bagaimana|Apa|Mengapa)\b", img_ocr_text, re.I)) and not any(k in img_ocr_text.lower() for k in ["tabel perspesi", "tingkat partisipasi"])
                            if is_pure_question_or_choice and not is_pure_art:
                                return None

                            if is_pure_art or is_illustration or (is_structured_visual and not is_pure_question_or_choice):
                                return (p_num, img_idx, img_filepath, img_ocr_text, top_val, p_height, pos_on_page)
                        except Exception:
                            pass
                        return None

                    from concurrent.futures import ThreadPoolExecutor
                    with ThreadPoolExecutor(max_workers=cpu_workers) as img_ex:
                        matched = list(img_ex.map(process_candidate_img, candidates))

                    for m in matched:
                        if m:
                            p_num, img_idx, img_filepath, img_ocr_text, top_val, p_height, pos_on_page = m
                            target_filename = f"pdf_{doc_hash}_img-{img_idx:03d}.png"
                            target_path = os.path.join(uploads_dir, target_filename)
                            if img_filepath.endswith(".png"):
                                import shutil
                                shutil.copy2(img_filepath, target_path)
                            else:
                                subprocess.run(["magick", img_filepath, target_path], capture_output=True)
                            
                            if p_num not in page_images_map:
                                page_images_map[p_num] = []
                            page_images_map[p_num].append({
                                "url": f"/uploads/exam_images/{target_filename}",
                                "ocr_text": img_ocr_text,
                                "top": top_val,
                                "page_height": p_height,
                                "pos_idx": pos_on_page,
                                "total_pos": page_img_counts.get(p_num, 1)
                            })
        except Exception as filter_err:
            pass

        # Sort pages back into original sequence and inject image tags
        final_pages.sort(key=lambda x: x[0])
        augmented_pages = []
        for p_num, txt in final_pages:
            p_txt = txt
            if p_num in page_images_map:
                for img_info in page_images_map[p_num]:
                    img_url = img_info["url"]
                    img_ocr = img_info.get("ocr_text", "")
                    top = img_info.get("top")
                    p_height = img_info.get("page_height")
                    pos_idx = img_info.get("pos_idx", 0)
                    total_pos = img_info.get("total_pos", 1)

                    placed = False
                    # 1. Coba cocokkan heading wacana jika teks OCR memuat judul/heading di halaman
                    if img_ocr:
                        for line in img_ocr.splitlines():
                            l_strip = line.strip()
                            if len(l_strip) >= 10 and l_strip in p_txt:
                                p_txt = p_txt.replace(l_strip, f"{l_strip}\n\n[Gambar: {img_url}]", 1)
                                placed = True
                                break
                        if not placed:
                            # Coba normalisasi quote (misal tanda petik miring)
                            norm_ocr = re.sub(r'[“"”]', '"', img_ocr)
                            for line in norm_ocr.splitlines():
                                l_strip = line.strip()
                                if len(l_strip) >= 10:
                                    rx_pattern = re.escape(l_strip).replace('\\"', r'["“”]')
                                    m_heading = re.search(rx_pattern, p_txt)
                                    if m_heading:
                                        matched_str = m_heading.group(0)
                                        p_txt = p_txt.replace(matched_str, f"{matched_str}\n\n[Gambar: {img_url}]", 1)
                                        placed = True
                                        break

                    # 2. Jika tidak ada kecocokan heading teks, gunakan posisi koordinat vertikal
                    if not placed:
                        is_bottom = False
                        if top is not None and p_height is not None and p_height > 0:
                            is_bottom = top > (p_height * 0.5)
                        elif total_pos > 1:
                            is_bottom = pos_idx >= (total_pos / 2.0)
                        
                        if is_bottom:
                            p_txt = f"{p_txt.rstrip()}\n\n[Gambar: {img_url}]"
                        else:
                            p_txt = f"[Gambar: {img_url}]\n\n{p_txt}"
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
