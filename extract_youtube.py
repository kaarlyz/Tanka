#!/usr/bin/env python3
import sys
import os
import re
import json
import urllib.request
from youtube_transcript_api import YouTubeTranscriptApi

def extract_video_id(url_or_id):
    if not url_or_id:
        return None
    url_or_id = url_or_id.strip()
    
    # Raw 11-char ID
    if re.match(r'^[0-9A-Za-z_-]{11}$', url_or_id):
        return url_or_id

    patterns = [
        r'(?:v=|\/v\/|youtu\.be\/|embed\/|shorts\/)([0-9A-Za-z_-]{11})',
        r'(?:watch\?.*v=)([0-9A-Za-z_-]{11})',
        r'([0-9A-Za-z_-]{11})'
    ]
    for pattern in patterns:
        m = re.search(pattern, url_or_id)
        if m:
            return m.group(1)
    return None

def format_timestamp(seconds):
    total_seconds = int(seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"

def get_video_metadata(video_id):
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        oembed_url = f"https://www.youtube.com/oembed?url={url}&format=json"
        req = urllib.request.Request(oembed_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {
                "title": data.get("title", f"Video YouTube ({video_id})"),
                "author": data.get("author_name", "YouTube Creator"),
                "thumbnail": data.get("thumbnail_url", "")
            }
    except Exception:
        return {
            "title": f"Materi Video YouTube ({video_id})",
            "author": "YouTube",
            "thumbnail": ""
        }

def get_transcript(video_id):
    ytt = YouTubeTranscriptApi()
    try:
        t_list = ytt.list(video_id)
    except Exception as e:
        return None, f"Tidak dapat memuat daftar transkrip: {e}"

    transcript_obj = None
    # 1. Coba cari bahasa Indonesia atau Inggris
    try:
        transcript_obj = t_list.find_transcript(["id", "id-ID", "en", "en-US"])
    except Exception:
        # 2. Coba ambil transkrip pertama yang tersedia
        for t in t_list:
            transcript_obj = t
            break

    if not transcript_obj:
        return None, "Video tidak memiliki teks transkrip atau subtitle yang dapat dibaca."

    try:
        snippets = transcript_obj.fetch()
        if not snippets:
            return None, "Transkrip video kosong."

        # Gabungkan snippet per blok ~20 detik atau ~200 karakter agar teks mengalir wajar
        formatted_paragraphs = []
        current_chunk = []
        chunk_start = 0

        for s in snippets:
            txt = s.text.replace("\n", " ").strip()
            if not txt:
                continue
            if not current_chunk:
                chunk_start = s.start
            current_chunk.append(txt)

            if (s.start - chunk_start >= 25) or (len(" ".join(current_chunk)) >= 250):
                formatted_paragraphs.append(f"[{format_timestamp(chunk_start)}] " + " ".join(current_chunk))
                current_chunk = []

        if current_chunk:
            formatted_paragraphs.append(f"[{format_timestamp(chunk_start)}] " + " ".join(current_chunk))

        full_text = "\n\n".join(formatted_paragraphs)
        return {
            "language": transcript_obj.language,
            "languageCode": transcript_obj.language_code,
            "isGenerated": transcript_obj.is_generated,
            "text": full_text,
            "snippetCount": len(snippets)
        }, None
    except Exception as e:
        return None, f"Gagal mengekstrak transkrip: {e}"

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "URL YouTube wajib disertakan"}))
        sys.exit(1)

    input_url = sys.argv[1]
    video_id = extract_video_id(input_url)
    if not video_id:
        print(json.dumps({"success": False, "error": "ID atau tautan YouTube tidak valid"}))
        sys.exit(1)

    meta = get_video_metadata(video_id)
    tx_data, err = get_transcript(video_id)

    if err or not tx_data:
        print(json.dumps({
            "success": False,
            "videoId": video_id,
            "title": meta["title"],
            "error": err or "Transkrip tidak ditemukan"
        }))
        sys.exit(0)

    print(json.dumps({
        "success": True,
        "videoId": video_id,
        "title": meta["title"],
        "author": meta["author"],
        "thumbnail": meta["thumbnail"],
        "language": tx_data["language"],
        "text": tx_data["text"],
        "snippetCount": tx_data["snippetCount"]
    }, ensure_ascii=False))

if __name__ == "__main__":
    main()
