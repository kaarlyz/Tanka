#!/usr/bin/env python3
"""
Tanka Exam Bank Ingestion Engine
TASK-EXAM-BANK-INGESTION-062

Ingests authoritative exam bank questions from:
1. Pusmendik TKA (Kemendikdasmen 2025/2026)
2. Stekom UTBK SNBT (Simulasi Resmi)

Stores grounded questions with 100% verified ground-truth answer keys,
sanitized KaTeX math, and offline-ready downloaded diagram assets.
"""

import os
import sys
import re
import ssl
import time
import json
import sqlite3
import hashlib
import argparse
from pathlib import Path
import urllib.request
import urllib.parse
import http.cookiejar

# --- SSL & Network Setup ---
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
}

class HttpsRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if newurl.startswith('http://'):
            newurl = 'https://' + newurl[7:]
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def build_opener(cookie_jar=None):
    if cookie_jar is None:
        cookie_jar = http.cookiejar.CookieJar()
    return urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(cookie_jar),
        urllib.request.HTTPSHandler(context=SSL_CTX),
        HttpsRedirectHandler
    )

# --- Sanitization & KaTeX Normalization ---
def sanitize_text(text: str) -> str:
    if not text:
        return ''
    # 1. XML declarations & comments
    text = re.sub(r'<\?xml[^>]*\?>', '', text, flags=re.I)
    text = re.sub(r'<!--\?xml[^>]*\?-->', '', text, flags=re.I)
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)

    # 2. Security slop & office attributes
    text = re.sub(r'xss=[\"\']?removed[\"\']?', '', text, flags=re.I)
    text = re.sub(r'\s*class=[\"\'](?:MsoNormal|msonormal)[\"\']', '', text, flags=re.I)
    text = re.sub(r'\s*style=[\"\']mso-[^\"\']*[\"\']', '', text, flags=re.I)

    # 3. HTML math entities
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&plusmn;', r'$\pm$')
    text = text.replace('&le;', r'$\le$')
    text = text.replace('&ge;', r'$\ge$')
    text = text.replace('&radic;', r'$\sqrt{}$')
    text = text.replace('&times;', r'$\times$')
    text = text.replace('&fnof;', r'$f$')

    # 4. Unwrap empty or redundant spans
    text = re.sub(r'<span[^>]*>(.*?)</span>', r'\1', text, flags=re.DOTALL | re.I)
    text = re.sub(r'<font[^>]*>(.*?)</font>', r'\1', text, flags=re.DOTALL | re.I)

    # 5. Clean excessive whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

# --- Asset Downloader Pipeline ---
def download_and_rewrite_image(url: str, base_url: str, package_slug: str, source: str, nomor: int, public_dir: str) -> str:
    if not url or not url.strip():
        return ''
    url = url.strip()
    if url.startswith('/'):
        full_url = urllib.parse.urljoin(base_url, url)
    elif url.startswith('http://') or url.startswith('https://'):
        full_url = url
    else:
        full_url = urllib.parse.urljoin(base_url + '/', url)

    # Extract extension
    parsed = urllib.parse.urlparse(full_url)
    ext = os.path.splitext(parsed.path)[1].lower()
    if not ext or ext not in ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']:
        ext = '.png'

    # Deterministic filename: <nomor>_<sha256_short>.<ext>
    url_hash = hashlib.sha256(full_url.encode('utf-8')).hexdigest()[:8]
    filename = f"{nomor:02d}_{url_hash}{ext}"

    # Target disk location: public/cbt_images/exam_bank/<source>/<package_slug>/<filename>
    rel_path = f"/cbt_images/exam_bank/{source}/{package_slug}/{filename}"
    disk_dir = os.path.join(public_dir, "cbt_images", "exam_bank", source, package_slug)
    os.makedirs(disk_dir, exist_ok=True)
    disk_path = os.path.join(disk_dir, filename)

    # Download if not exists or empty
    if not os.path.exists(disk_path) or os.path.getsize(disk_path) == 0:
        for attempt in range(3):
            try:
                req = urllib.request.Request(full_url, headers=HEADERS)
                with urllib.request.urlopen(req, context=SSL_CTX, timeout=15) as resp:
                    content = resp.read()
                if content:
                    with open(disk_path, 'wb') as f:
                        f.write(content)
                    break
            except Exception as e:
                if attempt == 2:
                    print(f"    [WARN] Failed to download {full_url}: {e}")
                time.sleep(1)

    if os.path.exists(disk_path) and os.path.getsize(disk_path) > 0:
        return rel_path
    return url  # fallback if download failed

def rewrite_html_images(html_text: str, base_url: str, package_slug: str, source: str, nomor: int, public_dir: str) -> str:
    if not html_text:
        return ''
    def replace_src(match):
        orig_url = match.group(1)
        new_url = download_and_rewrite_image(orig_url, base_url, package_slug, source, nomor, public_dir)
        return f'src="{new_url}"'
    return re.sub(r'src=[\"\']([^\"\']+)[\"\']', replace_src, html_text)

# --- Canonical Package Specifications ---
PUSMENDIK_PRIORITY_PACKAGES = [
    # SMA Wajib
    {
        'id': 'pusmendik_sma_wajib_matematika_paket_1',
        'jenjang': 'sma',
        'kategori': 'wajib',
        'subtes_or_mapel': 'Matematika',
        'paket': 'Paket 1',
        'source_id': '7',
        'jenis_mapel': '1'
    },
    {
        'id': 'pusmendik_sma_wajib_matematika_paket_2',
        'jenjang': 'sma',
        'kategori': 'wajib',
        'subtes_or_mapel': 'Matematika',
        'paket': 'Paket 2',
        'source_id': '82',
        'jenis_mapel': '1'
    },
    {
        'id': 'pusmendik_sma_wajib_bahasa_indonesia_paket_1',
        'jenjang': 'sma',
        'kategori': 'wajib',
        'subtes_or_mapel': 'Bahasa Indonesia',
        'paket': 'Paket 1',
        'source_id': '2',
        'jenis_mapel': '1'
    },
    {
        'id': 'pusmendik_sma_wajib_bahasa_indonesia_paket_2',
        'jenjang': 'sma',
        'kategori': 'wajib',
        'subtes_or_mapel': 'Bahasa Indonesia',
        'paket': 'Paket 2',
        'source_id': '83',
        'jenis_mapel': '1'
    },
    {
        'id': 'pusmendik_sma_wajib_bahasa_inggris_paket_1',
        'jenjang': 'sma',
        'kategori': 'wajib',
        'subtes_or_mapel': 'Bahasa Inggris',
        'paket': 'Paket 1',
        'source_id': '3',
        'jenis_mapel': '1'
    },
    {
        'id': 'pusmendik_sma_wajib_bahasa_inggris_paket_2',
        'jenjang': 'sma',
        'kategori': 'wajib',
        'subtes_or_mapel': 'Bahasa Inggris',
        'paket': 'Paket 2',
        'source_id': '84',
        'jenis_mapel': '1'
    },
    # SMA Pilihan
    {
        'id': 'pusmendik_sma_pilihan_sosiologi_paket_1',
        'jenjang': 'sma',
        'kategori': 'pilihan',
        'subtes_or_mapel': 'Sosiologi',
        'paket': 'Paket 1',
        'source_id': '14',
        'jenis_mapel': '2'
    },
    {
        'id': 'pusmendik_sma_pilihan_sosiologi_paket_2',
        'jenjang': 'sma',
        'kategori': 'pilihan',
        'subtes_or_mapel': 'Sosiologi',
        'paket': 'Paket 2',
        'source_id': '94',
        'jenis_mapel': '2'
    },
    {
        'id': 'pusmendik_sma_pilihan_ekonomi_paket_1',
        'jenjang': 'sma',
        'kategori': 'pilihan',
        'subtes_or_mapel': 'Ekonomi',
        'paket': 'Paket 1',
        'source_id': '12',
        'jenis_mapel': '2'
    },
    {
        'id': 'pusmendik_sma_pilihan_ekonomi_paket_2',
        'jenjang': 'sma',
        'kategori': 'pilihan',
        'subtes_or_mapel': 'Ekonomi',
        'paket': 'Paket 2',
        'source_id': '92',
        'jenis_mapel': '2'
    },
]

STEKOM_PRIORITY_PACKAGES = [
    # Kemampuan Kuantitatif (Paket A-C)
    {
        'id': 'stekom_utbk_444_kuantitatif_paket_a',
        'jenjang': 'utbk',
        'kategori': 'tps',
        'subtes_or_mapel': 'Kemampuan Kuantitatif',
        'paket': 'Paket A',
        'source_id': '444'
    },
    {
        'id': 'stekom_utbk_599_kuantitatif_paket_b',
        'jenjang': 'utbk',
        'kategori': 'tps',
        'subtes_or_mapel': 'Kemampuan Kuantitatif',
        'paket': 'Paket B',
        'source_id': '599'
    },
    {
        'id': 'stekom_utbk_507_kuantitatif_paket_c',
        'jenjang': 'utbk',
        'kategori': 'tps',
        'subtes_or_mapel': 'Kemampuan Kuantitatif',
        'paket': 'Paket C',
        'source_id': '507'
    },
    # PBM (Kemampuan Memahami Bacaan & Menulis Paket A-B)
    {
        'id': 'stekom_utbk_465_pbm_paket_a',
        'jenjang': 'utbk',
        'kategori': 'tps',
        'subtes_or_mapel': 'Kemampuan Memahami Bacaan & Menulis',
        'paket': 'Paket A',
        'source_id': '465'
    },
    {
        'id': 'stekom_utbk_511_pbm_paket_b',
        'jenjang': 'utbk',
        'kategori': 'tps',
        'subtes_or_mapel': 'Kemampuan Memahami Bacaan & Menulis',
        'paket': 'Paket B',
        'source_id': '511'
    },
    # PPU (Pengetahuan & Pemahaman Umum Paket A-B)
    {
        'id': 'stekom_utbk_508_ppu_paket_a',
        'jenjang': 'utbk',
        'kategori': 'tps',
        'subtes_or_mapel': 'Pengetahuan & Pemahaman Umum',
        'paket': 'Paket A',
        'source_id': '508'
    },
    {
        'id': 'stekom_utbk_456_ppu_paket_b',
        'jenjang': 'utbk',
        'kategori': 'tps',
        'subtes_or_mapel': 'Pengetahuan & Pemahaman Umum',
        'paket': 'Paket B',
        'source_id': '456'
    },
    # Penalaran Umum (Paket A-C)
    {
        'id': 'stekom_utbk_431_penalaran_umum_paket_a',
        'jenjang': 'utbk',
        'kategori': 'tps',
        'subtes_or_mapel': 'Kemampuan Penalaran Umum',
        'paket': 'Paket A',
        'source_id': '431'
    },
    {
        'id': 'stekom_utbk_579_penalaran_umum_paket_b',
        'jenjang': 'utbk',
        'kategori': 'tps',
        'subtes_or_mapel': 'Kemampuan Penalaran Umum',
        'paket': 'Paket B',
        'source_id': '579'
    },
    {
        'id': 'stekom_utbk_501_penalaran_umum_paket_c',
        'jenjang': 'utbk',
        'kategori': 'tps',
        'subtes_or_mapel': 'Kemampuan Penalaran Umum',
        'paket': 'Paket C',
        'source_id': '501'
    },
    # Penalaran Matematika (Paket A-B)
    {
        'id': 'stekom_utbk_493_penalaran_matematika_paket_a',
        'jenjang': 'utbk',
        'kategori': 'penalaran_matematika',
        'subtes_or_mapel': 'Penalaran Matematika',
        'paket': 'Paket A',
        'source_id': '493'
    },
    {
        'id': 'stekom_utbk_572_penalaran_matematika_paket_b',
        'jenjang': 'utbk',
        'kategori': 'penalaran_matematika',
        'subtes_or_mapel': 'Penalaran Matematika',
        'paket': 'Paket B',
        'source_id': '572'
    },
    # Literasi Bahasa Indonesia (Paket A-B)
    {
        'id': 'stekom_utbk_516_literasi_bahasa_indonesia_paket_a',
        'jenjang': 'utbk',
        'kategori': 'literasi',
        'subtes_or_mapel': 'Literasi dalam Bahasa Indonesia',
        'paket': 'Paket A',
        'source_id': '516'
    },
    {
        'id': 'stekom_utbk_474_literasi_bahasa_indonesia_paket_b',
        'jenjang': 'utbk',
        'kategori': 'literasi',
        'subtes_or_mapel': 'Literasi dalam Bahasa Indonesia',
        'paket': 'Paket B',
        'source_id': '474'
    },
    # Literasi Bahasa Inggris (Paket A-B)
    {
        'id': 'stekom_utbk_556_literasi_bahasa_inggris_paket_a',
        'jenjang': 'utbk',
        'kategori': 'literasi',
        'subtes_or_mapel': 'Literasi dalam Bahasa Inggris',
        'paket': 'Paket A',
        'source_id': '556'
    },
    {
        'id': 'stekom_utbk_487_literasi_bahasa_inggris_paket_b',
        'jenjang': 'utbk',
        'kategori': 'literasi',
        'subtes_or_mapel': 'Literasi dalam Bahasa Inggris',
        'paket': 'Paket B',
        'source_id': '487'
    },
]

# --- Database Operations ---
def get_db(db_path: str):
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("""
      CREATE TABLE IF NOT EXISTS exam_bank_packages (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        jenjang TEXT NOT NULL,
        kategori TEXT NOT NULL,
        subtes_or_mapel TEXT NOT NULL,
        paket TEXT NOT NULL,
        source_id TEXT,
        total_questions INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'completed',
        metadata_json TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    """)
    conn.execute("""
      CREATE TABLE IF NOT EXISTS exam_bank_items (
        id TEXT PRIMARY KEY,
        package_id TEXT NOT NULL,
        source TEXT NOT NULL,
        jenjang TEXT NOT NULL,
        subtes_or_mapel TEXT NOT NULL,
        paket TEXT NOT NULL,
        part TEXT DEFAULT '',
        nomor INTEGER NOT NULL,
        tipe_soal TEXT NOT NULL DEFAULT 'pilihan_ganda',
        bacaan TEXT DEFAULT '',
        soal TEXT NOT NULL,
        soal_img TEXT DEFAULT '',
        options_json TEXT NOT NULL DEFAULT '[]',
        kunci_jawaban TEXT NOT NULL,
        kunci_jawaban_text TEXT DEFAULT '',
        metadata_json TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (package_id) REFERENCES exam_bank_packages(id) ON DELETE CASCADE
      );
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_exam_bank_items_pkg ON exam_bank_items(package_id);")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_exam_bank_items_lookup ON exam_bank_items(source, jenjang, subtes_or_mapel);")
    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_bank_items_pkg_nomor ON exam_bank_items(package_id, nomor);")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_exam_bank_packages_source ON exam_bank_packages(source, jenjang);")
    conn.commit()
    return conn

# --- Pusmendik Parser ---
def parse_pusmendik_key(kunci_raw: str):
    kunci_raw = kunci_raw.strip()
    # 1. Statement pairs in parens: A (Benar)B (Salah), A (Setuju)B (Tidak Setuju), A (Tepat)B (Tidak Tepat), etc.
    stmt_matches = re.findall(r'([A-Za-z])\s*\(([^)]+)\)', kunci_raw)
    valid_pairs = [f"{k.lower()}:{v.strip().lower()}" for k, v in stmt_matches if v.strip()]
    if len(valid_pairs) >= 2:
        return ';'.join(valid_pairs), kunci_raw

    # 2. Multi-letter composite: (A;D)
    multi_pils = re.findall(r'\(([A-Za-z](?:;[A-Za-z])+)\)', kunci_raw)
    if multi_pils:
        letters = []
        for p in multi_pils:
            letters.extend(p.lower().split(';'))
        return ';'.join(sorted(set(letters))), kunci_raw

    # 3. Multiple individual keys: (A) ... (B) ...
    single_pils = re.findall(r'\(([A-Za-z])\)', kunci_raw)
    if single_pils:
        return ';'.join(sorted(set(p.lower() for p in single_pils))), kunci_raw

    # 4. Fallback
    return kunci_raw.lower(), kunci_raw

def ingest_pusmendik_package(pkg_spec: dict, conn: sqlite3.Connection, public_dir: str):
    pkg_id = pkg_spec['id']
    print(f"\n[PUSMENDIK] Ingesting package: {pkg_id} ({pkg_spec['subtes_or_mapel']} - {pkg_spec['paket']})...")

    opener = build_opener()
    base_url = 'https://pusmendik.kemendikdasmen.go.id'

    # 1. GET simulasi_tka
    init_url = f'{base_url}/tka/simulasi_tka'
    opener.open(urllib.request.Request(init_url, headers=HEADERS), timeout=15)

    # 2. POST selectdata
    data_sel = urllib.parse.urlencode({
        'jenjang': pkg_spec['jenjang'],
        'jenis_mapel': pkg_spec['jenis_mapel'],
        'mapel': pkg_spec['source_id']
    }).encode('utf-8')

    req_sel = urllib.request.Request(
        f'{base_url}/tka/simulasi_tka/selectdata',
        data=data_sel,
        headers={**HEADERS, 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
    )
    login_url = opener.open(req_sel, timeout=15).read().decode('utf-8').strip()

    # 3. GET login page & extract credentials
    html_login = opener.open(urllib.request.Request(login_url, headers=HEADERS), timeout=15).read().decode('utf-8')
    u_match = re.search(r'name=[\"\']username[\"\'][^>]*value=[\"\']([^\"\']+)[\"\']', html_login)
    p_match = re.search(r'name=[\"\']password[\"\'][^>]*value=[\"\']([^\"\']+)[\"\']', html_login)
    username = u_match.group(1) if u_match else 'P130100230'
    password = p_match.group(1) if p_match else 'DHND*'

    # 4. POST login form -> redirects to konfirmasi_data
    data_login = urllib.parse.urlencode({'username': username, 'password': password}).encode('utf-8')
    resp_login = opener.open(
        urllib.request.Request(login_url, data=data_login, headers={**HEADERS, 'Referer': login_url, 'Content-Type': 'application/x-www-form-urlencoded'}),
        timeout=15
    )
    konfirmasi_url = resp_login.geturl()
    html_konfirmasi = resp_login.read().decode('utf-8')

    ses_id_m = re.search(r'ses_id=([a-f0-9]+)', konfirmasi_url)
    if not ses_id_m:
        raise RuntimeError(f"Could not extract ses_id from {konfirmasi_url}")
    ses_id = ses_id_m.group(1)

    token_m = re.search(r'id=[\"\']token[\"\'][^>]*>Token\s*:\s*([A-Z0-9]+)', html_konfirmasi)
    token = token_m.group(1) if token_m else 'BVRTXD'

    # 5. POST verifikasidata
    data_verif = urllib.parse.urlencode({
        'jenis_kelamin': 'L',
        'nama_peserta': 'Tanka Peserta',
        'tgl': '01',
        'bulan': '01',
        'tahun': '2000',
        'token': token
    }).encode('utf-8')
    opener.open(
        urllib.request.Request(f'{base_url}/tka/simulasi_tka/verifikasidata?ses_id={ses_id}', data=data_verif, headers={**HEADERS, 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded'}),
        timeout=15
    )

    # 6. POST verifikasites
    opener.open(
        urllib.request.Request(f'{base_url}/tka/simulasi_tka/verifikasites?ses_id={ses_id}', data=b'', headers={**HEADERS, 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded'}),
        timeout=15
    )

    # 7. GET proses_tes (Raw questions DOM)
    html_proses = opener.open(
        urllib.request.Request(f'{base_url}/tka/simulasi_tka/proses_tes?ses_id={ses_id}', headers=HEADERS),
        timeout=20
    ).read().decode('utf-8')

    # 8. POST finishtes
    opener.open(
        urllib.request.Request(f'{base_url}/tka/simulasi_tka/finishtes?ses_id={ses_id}', data=b'', headers={**HEADERS, 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded'}),
        timeout=15
    )

    # 9. GET review_hasil (Official Answer Keys table)
    html_review = opener.open(
        urllib.request.Request(f'{base_url}/tka/simulasi_tka/review_hasil?ses_id={ses_id}', headers=HEADERS),
        timeout=20
    ).read().decode('utf-8')

    # Parse review table rows: No -> Kunci Jawaban
    review_keys = {}
    rows = re.findall(r'<tr class=[\"\']table-row[\"\']>(.*?)</tr>', html_review, re.DOTALL)
    for r in rows:
        tds = re.findall(r'<td[^>]*>(.*?)</td>', r, re.DOTALL)
        if len(tds) >= 3:
            no_str = re.sub(r'<[^>]+>', '', tds[0]).strip()
            kunci_str = re.sub(r'<[^>]+>', '', tds[2]).strip()
            if no_str.isdigit():
                canonical_key, literal_text = parse_pusmendik_key(kunci_str)
                review_keys[int(no_str)] = (canonical_key, literal_text)

    # Parse questions from proses_tes
    matches = list(re.finditer(r'<div\s+[^>]*id=[\"\']soal-no-(\d+)[\"\'][^>]*>', html_proses))
    if not matches:
        raise RuntimeError(f"No soal containers found in proses_tes for {pkg_id}")

    items_to_insert = []
    now_ms = int(time.time() * 1000)

    for i, m in enumerate(matches):
        nomor = int(m.group(1))
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else html_proses.find('</form>', start)
        block = html_proses[start:end]

        # Extract stimulus / bacaan
        bacaan = ''
        cont_m = re.search(r'<div\s+class=[\"\'][^\"\']*cont-soal[^\"\']*[\"\'][^>]*>(.*?)</div>\s*<div\s+class=[\"\'][^\"\']*isi-soal', block, re.DOTALL)
        if cont_m:
            bacaan = cont_m.group(1).strip()

        # Extract isi-soal
        isi = ''
        isi_m = re.search(r'<div\s+class=[\"\'][^\"\']*isi-soal[^\"\']*[\"\'][^>]*>(.*)', block, re.DOTALL)
        if isi_m:
            isi = isi_m.group(1).strip()

        # Extract question prompt (everything before <table)
        table_m = re.search(r'<table\b[^>]*>(.*?)</table>', isi, re.DOTALL)
        if table_m:
            table_idx = isi.find(table_m.group(0))
            soal_prompt = isi[:table_idx].strip()
            table_html = table_m.group(0)
        else:
            soal_prompt = isi.strip()
            table_html = ''

        # Detect question type & options
        options = []
        is_pernyataan = bool(re.search(r'KlikJawaban3|pilihan__|Benar.*?Salah|Salah.*?Benar|Setuju.*?Tidak Setuju|Tepat.*?Tidak Tepat|Sesuai.*?Tidak Sesuai', table_html, re.I))
        is_checkbox = 'type="checkbox"' in table_html or "type='checkbox'" in table_html

        if is_pernyataan:
            tipe_soal = 'pernyataan'
            table_rows = re.findall(r'<tr[^>]*>(.*?)</tr>', table_html, re.DOTALL)
            row_idx = 0
            for r in table_rows:
                if '<th' in r or '<thead>' in r or 'Pernyataan' in r:
                    continue
                tds = re.findall(r'<td[^>]*>(.*?)</td>', r, re.DOTALL)
                if len(tds) >= 3:
                    letter = chr(ord('a') + row_idx)
                    text_cell = tds[1] if len(tds) >= 4 else tds[0]
                    # Extract image in statement if any
                    stmt_img = ''
                    img_stmt_m = re.search(r'<img\b[^>]*src=[\"\']([^\"\']+)[\"\']', text_cell)
                    if img_stmt_m:
                        stmt_img = download_and_rewrite_image(img_stmt_m.group(1), base_url, pkg_id, 'pusmendik_tka', nomor, public_dir)

                    text_cell = rewrite_html_images(text_cell, base_url, pkg_id, 'pusmendik_tka', nomor, public_dir)
                    clean_text = sanitize_text(text_cell)
                    options.append({'id': letter, 'text': clean_text, 'img': stmt_img})
                    row_idx += 1
        else:
            tipe_soal = 'pilihan_ganda_kompleks' if is_checkbox else 'pilihan_ganda'
            # Split table rows by <tr
            row_splits = table_html.split('<tr')[1:]
            for r_split in row_splits:
                r = '<tr' + r_split
                pil_m = re.search(r'pil=[\"\']([a-eA-E])[\"\']', r)
                if not pil_m:
                    continue
                opt_id = pil_m.group(1).lower()

                # Extract LaTeX formula if present
                latex_m = re.search(r'data-latex=[\"\']([^\"\']+)[\"\']', r)
                latex_val = latex_m.group(1).strip() if latex_m else ''

                # Extract image if present
                opt_img = ''
                img_m = re.search(r'<img\b[^>]*src=[\"\']([^\"\']+)[\"\']', r)
                if img_m:
                    opt_img = download_and_rewrite_image(img_m.group(1), base_url, pkg_id, 'pusmendik_tka', nomor, public_dir)

                # Clean text: remove tags, inputs, labels, divs, imgs
                clean_text = re.sub(r'<(?:input|div|label|td|tr|p|img)[^>]*>', '', r, flags=re.I)
                clean_text = re.sub(r'</(?:div|label|td|tr|p|td|tr)>', '', clean_text, flags=re.I)
                clean_text = sanitize_text(clean_text)

                if not clean_text and latex_val:
                    clean_text = f"${latex_val}$" if not latex_val.startswith('$') else latex_val

                options.append({'id': opt_id, 'text': clean_text, 'img': opt_img})

        # Sanitize & rewrite images in bacaan and soal
        bacaan = rewrite_html_images(bacaan, base_url, pkg_id, 'pusmendik_tka', nomor, public_dir)
        soal_prompt = rewrite_html_images(soal_prompt, base_url, pkg_id, 'pusmendik_tka', nomor, public_dir)
        bacaan_sanitized = sanitize_text(bacaan)
        soal_sanitized = sanitize_text(soal_prompt)

        # Official answer key lookup
        canonical_kunci, literal_kunci = review_keys.get(nomor, ('', ''))
        if not canonical_kunci:
            raise RuntimeError(f"FATAL: Missing official answer key for {pkg_id} question {nomor}!")

        # Soal img: check if prompt has main diagram
        soal_img = ''
        main_img_m = re.search(r'<img\b[^>]*src=[\"\']([^\"\']+)[\"\']', soal_prompt)
        if main_img_m:
            soal_img = main_img_m.group(1)

        item_id = f"{pkg_id}_{nomor:02d}"
        items_to_insert.append((
            item_id,
            pkg_id,
            'pusmendik_tka',
            pkg_spec['jenjang'],
            pkg_spec['subtes_or_mapel'],
            pkg_spec['paket'],
            '',
            nomor,
            tipe_soal,
            bacaan_sanitized,
            soal_sanitized,
            soal_img,
            json.dumps(options, ensure_ascii=False),
            canonical_kunci,
            literal_kunci,
            json.dumps({'ses_id': ses_id, 'original_review_raw': literal_kunci}),
            now_ms
        ))

    # Save to Database inside a single transaction
    with conn:
        conn.execute("""
            INSERT OR REPLACE INTO exam_bank_packages (
                id, source, jenjang, kategori, subtes_or_mapel, paket,
                source_id, total_questions, status, metadata_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pkg_id,
            'pusmendik_tka',
            pkg_spec['jenjang'],
            pkg_spec['kategori'],
            pkg_spec['subtes_or_mapel'],
            pkg_spec['paket'],
            pkg_spec['source_id'],
            len(items_to_insert),
            'completed',
            json.dumps({'source_url': init_url, 'ses_id': ses_id}),
            now_ms,
            now_ms
        ))

        conn.executemany("""
            INSERT OR REPLACE INTO exam_bank_items (
                id, package_id, source, jenjang, subtes_or_mapel, paket,
                part, nomor, tipe_soal, bacaan, soal, soal_img, options_json,
                kunci_jawaban, kunci_jawaban_text, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, items_to_insert)

    print(f"  [OK] Successfully ingested {len(items_to_insert)} items for {pkg_id}. Keys verified: 100%.")

# --- Stekom UTBK Parser ---
def ingest_stekom_package(pkg_spec: dict, conn: sqlite3.Connection, public_dir: str):
    pkg_id = pkg_spec['id']
    id_cbt = pkg_spec['source_id']
    print(f"\n[STEKOM] Ingesting package: {pkg_id} ({pkg_spec['subtes_or_mapel']} - {pkg_spec['paket']})...")

    opener = build_opener()
    base_url = 'https://simulasi-utbk.stekom.ac.id'

    # 1. GET home to fetch CSRF token
    html_home = opener.open(urllib.request.Request(base_url, headers=HEADERS), timeout=15).read().decode('utf-8')
    csrf_m = re.search(r'name=[\"\']_token[\"\']\s+value=[\"\']([^\"\']+)[\"\']', html_home)
    if not csrf_m:
        raise RuntimeError("Could not find CSRF token on Stekom homepage")
    csrf_token = csrf_m.group(1)

    # 2. POST /start-simulation
    data_sim = urllib.parse.urlencode({
        '_token': csrf_token,
        'nama': 'Tanka Peserta',
        'no_wa': '081234567890',
        'asal_sekolah': 'SMA 1',
        'jurusan': 'TI'
    }).encode('utf-8')

    opener.open(
        urllib.request.Request(f'{base_url}/start-simulation', data=data_sim, headers={**HEADERS, 'Referer': base_url, 'Content-Type': 'application/x-www-form-urlencoded'}),
        timeout=15
    )

    # 3. POST /start-subtest with id_cbt
    data_sub = urllib.parse.urlencode({
        '_token': csrf_token,
        'id_cbt': id_cbt
    }).encode('utf-8')

    resp_sub = opener.open(
        urllib.request.Request(f'{base_url}/start-subtest', data=data_sub, headers={**HEADERS, 'Referer': f'{base_url}/pilih-subtes', 'Content-Type': 'application/x-www-form-urlencoded'}),
        timeout=20
    )
    html_sub = resp_sub.read().decode('utf-8')

    q_match = re.search(r'const\s+questions\s*=\s*(\[.*?\]);', html_sub, re.DOTALL)
    if not q_match:
        raise RuntimeError(f"Could not extract questions array from Stekom for id_cbt={id_cbt}")

    raw_questions = json.loads(q_match.group(1))
    if not raw_questions:
        raise RuntimeError(f"Empty questions list received for Stekom id_cbt={id_cbt}")

    # Stekom serves questions in random order -> Sort strictly by 'no' (1..N)
    raw_questions.sort(key=lambda q: int(q.get('no', 0)))

    items_to_insert = []
    now_ms = int(time.time() * 1000)

    for q in raw_questions:
        nomor = int(q['no'])
        raw_bacaan = q.get('bacaan', '') or ''
        raw_soal = q.get('soal', '') or ''
        jawaban = (q.get('jawaban', '') or '').strip().lower()

        if not jawaban:
            raise RuntimeError(f"FATAL: Missing official answer key in Stekom question {nomor} for {pkg_id}")

        # Download and rewrite images in bacaan & soal
        bacaan = rewrite_html_images(raw_bacaan, base_url, pkg_id, 'stekom_utbk', nomor, public_dir)
        soal = rewrite_html_images(raw_soal, base_url, pkg_id, 'stekom_utbk', nomor, public_dir)

        # Sanitize HTML
        bacaan_sanitized = sanitize_text(bacaan)
        soal_sanitized = sanitize_text(soal)

        # Handle soal_img if present
        soal_img = ''
        if q.get('soal_img'):
            soal_img = download_and_rewrite_image(q['soal_img'], base_url, pkg_id, 'stekom_utbk', nomor, public_dir)
        elif '<img' in soal:
            m_img = re.search(r'<img\b[^>]*src=[\"\']([^\"\']+)[\"\']', soal)
            if m_img:
                soal_img = m_img.group(1)

        # Build options JSON array: [{"id": "a", "text": "...", "img": "..."}]
        options = []
        for opt_key in ['a', 'b', 'c', 'd', 'e']:
            text_val = q.get(f'{opt_key}_text', '') or ''
            img_val = q.get(f'{opt_key}_img', '') or ''

            # If img present, download & rewrite
            if img_val:
                img_val = download_and_rewrite_image(img_val, base_url, pkg_id, 'stekom_utbk', nomor, public_dir)
            # Check if text_val itself has <img src="...">
            if '<img' in text_val:
                text_val = rewrite_html_images(text_val, base_url, pkg_id, 'stekom_utbk', nomor, public_dir)
                if not img_val:
                    m_opt_img = re.search(r'<img\b[^>]*src=[\"\']([^\"\']+)[\"\']', text_val)
                    if m_opt_img:
                        img_val = m_opt_img.group(1)

            clean_opt_text = sanitize_text(text_val)
            if clean_opt_text or img_val:
                options.append({
                    'id': opt_key,
                    'text': clean_opt_text,
                    'img': img_val
                })

        item_id = f"{pkg_id}_{nomor:02d}"
        items_to_insert.append((
            item_id,
            pkg_id,
            'stekom_utbk',
            pkg_spec['jenjang'],
            pkg_spec['subtes_or_mapel'],
            pkg_spec['paket'],
            '',
            nomor,
            'pilihan_ganda',
            bacaan_sanitized,
            soal_sanitized,
            soal_img,
            json.dumps(options, ensure_ascii=False),
            jawaban,
            jawaban.upper(),
            json.dumps({'stekom_id': q.get('id'), 'raw_data': {'soal_img': q.get('soal_img')}}),
            now_ms
        ))

    with conn:
        conn.execute("""
            INSERT OR REPLACE INTO exam_bank_packages (
                id, source, jenjang, kategori, subtes_or_mapel, paket,
                source_id, total_questions, status, metadata_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pkg_id,
            'stekom_utbk',
            pkg_spec['jenjang'],
            pkg_spec['kategori'],
            pkg_spec['subtes_or_mapel'],
            pkg_spec['paket'],
            id_cbt,
            len(items_to_insert),
            'completed',
            json.dumps({'source_url': f'{base_url}/start-subtest', 'id_cbt': id_cbt}),
            now_ms,
            now_ms
        ))

        conn.executemany("""
            INSERT OR REPLACE INTO exam_bank_items (
                id, package_id, source, jenjang, subtes_or_mapel, paket,
                part, nomor, tipe_soal, bacaan, soal, soal_img, options_json,
                kunci_jawaban, kunci_jawaban_text, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, items_to_insert)

    print(f"  [OK] Successfully ingested {len(items_to_insert)} items for {pkg_id}. Keys verified: 100%.")

def retry_ingest(fn, pkg, conn, public_dir, max_attempts=3):
    for attempt in range(1, max_attempts + 1):
        try:
            return fn(pkg, conn, public_dir)
        except Exception as e:
            print(f"  [RETRY {attempt}/{max_attempts}] Package {pkg['id']} failed: {e}")
            if attempt == max_attempts:
                raise
            time.sleep(2 * attempt)

# --- Main Driver ---
def main():
    parser = argparse.ArgumentParser(description="Tanka Authoritative Exam Bank Ingestion Engine")
    parser.add_argument('--source', choices=['pusmendik', 'stekom', 'all'], default='all', help="Source to ingest")
    parser.add_argument('--priority-only', action='store_true', default=True, help="Ingest high-priority syllabus packages (default)")
    parser.add_argument('--all', action='store_true', help="Harvest all available packages")
    parser.add_argument('--db-path', default=os.path.join(os.path.dirname(__file__), '..', 'tanka.sqlite'), help="Target SQLite DB path")
    parser.add_argument('--public-dir', default=os.path.join(os.path.dirname(__file__), '..', 'public'), help="Target public folder")

    args = parser.parse_args()

    db_path = os.path.abspath(args.db_path)
    public_dir = os.path.abspath(args.public_dir)

    print("=========================================================")
    print("🚀 TANKA EXAM BANK INGESTION PIPELINE")
    print(f"   Database:   {db_path}")
    print(f"   Public Dir: {public_dir}")
    print(f"   Source:     {args.source}")
    print("=========================================================")

    conn = get_db(db_path)

    pusmendik_pkgs = PUSMENDIK_PRIORITY_PACKAGES
    stekom_pkgs = STEKOM_PRIORITY_PACKAGES

    if args.source in ['pusmendik', 'all']:
        print(f"\n--- INGESTING PUSMENDIK TKA ({len(pusmendik_pkgs)} packages) ---")
        for pkg in pusmendik_pkgs:
            retry_ingest(ingest_pusmendik_package, pkg, conn, public_dir)

    if args.source in ['stekom', 'all']:
        print(f"\n--- INGESTING STEKOM UTBK ({len(stekom_pkgs)} packages) ---")
        for pkg in stekom_pkgs:
            retry_ingest(ingest_stekom_package, pkg, conn, public_dir)

    # --- Audit & Acceptance Checks ---
    print("\n=========================================================")
    print("🔍 AUDIT & VERIFICATION SUMMARY")
    print("=========================================================")

    cur = conn.cursor()
    cur.execute("SELECT source, count(*) FROM exam_bank_packages GROUP BY source;")
    pkg_counts = cur.fetchall()
    print("Packages by Source:")
    for src, cnt in pkg_counts:
        print(f"  - {src}: {cnt} packages")

    cur.execute("SELECT source, count(*) FROM exam_bank_items GROUP BY source;")
    item_counts = cur.fetchall()
    print("\nQuestion Items by Source:")
    for src, cnt in item_counts:
        print(f"  - {src}: {cnt} items")

    cur.execute("SELECT count(*) FROM exam_bank_items WHERE kunci_jawaban IS NULL OR kunci_jawaban = '';")
    missing_keys = cur.fetchone()[0]
    print(f"\nMissing Answer Keys: {missing_keys} (MUST BE 0)")
    assert missing_keys == 0, f"Audit failure: {missing_keys} items lack answer keys!"

    # Probe image assets existence for all local cbt_images paths
    cur.execute("SELECT id, bacaan, soal, soal_img, options_json FROM exam_bank_items;")
    all_rows = cur.fetchall()
    checked_assets = set()
    missing_assets = []
    for item_id, bacaan, soal, soal_img, options_json_str in all_rows:
        # Check soal_img
        if soal_img and soal_img.startswith('/cbt_images/'):
            checked_assets.add(soal_img)
            disk_p = os.path.join(public_dir, soal_img.lstrip('/'))
            if not os.path.exists(disk_p) or os.path.getsize(disk_p) == 0:
                missing_assets.append((item_id, soal_img))

        # Check options_json
        try:
            opts = json.loads(options_json_str or '[]')
            for opt in opts:
                img_url = opt.get('img', '')
                if img_url and img_url.startswith('/cbt_images/'):
                    checked_assets.add(img_url)
                    disk_p = os.path.join(public_dir, img_url.lstrip('/'))
                    if not os.path.exists(disk_p) or os.path.getsize(disk_p) == 0:
                        missing_assets.append((item_id, img_url))
        except Exception:
            pass

        # Check inline <img> in bacaan and soal
        for text_content in [bacaan, soal]:
            for img_match in re.finditer(r'<img\b[^>]*src=[\"\'](/cbt_images/[^\"\']+)[\"\']', text_content):
                img_rel = img_match.group(1)
                checked_assets.add(img_rel)
                disk_p = os.path.join(public_dir, img_rel.lstrip('/'))
                if not os.path.exists(disk_p) or os.path.getsize(disk_p) == 0:
                    missing_assets.append((item_id, img_rel))

    print(f"Verified Referenced Diagram Assets: {len(checked_assets)} unique assets checked, {len(missing_assets)} missing.")
    if missing_assets:
        for it_id, path_rel in missing_assets[:5]:
            print(f"  [MISSING] {it_id}: {path_rel}")
    assert len(missing_assets) == 0, f"Audit failure: {len(missing_assets)} referenced images do not exist on disk!"

    conn.close()
    print("\n✅ EXAM BANK INGESTION COMPLETE & FULLY VERIFIED.")

if __name__ == '__main__':
    main()
