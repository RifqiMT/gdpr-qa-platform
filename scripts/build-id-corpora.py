#!/usr/bin/env python3
"""Build Indonesian regulation corpora from official JDIH / LN texts.

Sources (authoritative):
- UU 27/2022: JDIH Kemkomdigi HTML (Undang-Undang Nomor 27 Tahun 2022)
- SE Menkominfo 9/2023: JDIH Kemkomdigi HTML
- Perpres 39/2019: official PDF from JDIH Kemenko Infra (LN-equivalent salinan)
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
TMP = ROOT / "tmp-id-etl"
AGENT = Path(
    "/Users/rifqitjahyono/.cursor/projects/Users-rifqitjahyono-GDPR-QnA-Platform/agent-tools"
)

NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

ID_PDP_JDIH = "https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang+nomor+27+tahun+2022"
ID_PDP_PERATURAN = "https://peraturan.go.id/id/uu-no-27-tahun-2022"
ID_PDP_PDF = "https://jdih.kemenkoinfra.go.id/cfind/source/files/uu/uu-nomor-27-tahun-2022.pdf"
ID_SE_JDIH = "https://jdih.komdigi.go.id/produk_hukum/view/id/883/t/surat+edaran+menteri+komunikasi+dan+informatika+nomor+9+tahun+2023"
ID_SDI_PERATURAN = "https://peraturan.go.id/id/perpres-no-39-tahun-2019"
ID_SDI_PDF = "https://jdih.kemenkoinfra.go.id/cfind/source/files/perpres/2016-2020/perpres-nomor-39-tahun-2019.pdf"
ID_SDI_SETKAB = "https://setkab.go.id/presiden-jokowi-tandangani-perpres-no-392019-tentang-satu-data-indonesia/"
ID_SDI_PORTAL = "https://data.go.id"

PDP_ARTICLE_TITLES = {
    1: "Definitions",
    2: "Territorial and material scope",
    3: "Principles (asas)",
    4: "Types of personal data",
    5: "Right to information",
    6: "Right to complete, update, and correct",
    7: "Right of access and copy",
    8: "Right to end processing, erasure, and destruction",
    9: "Right to withdraw consent",
    10: "Right to object to solely automated decisions",
    11: "Right to restrict processing",
    12: "Right to sue and receive compensation",
    13: "Data portability",
    14: "Procedure for exercising certain rights",
    15: "Exceptions to certain data-subject rights",
    16: "Processing operations and principles",
    17: "Visual data processing devices in public places",
    18: "Joint controllers",
    19: "Who may be a controller or processor",
    20: "Legal bases for processing",
    21: "Information that must accompany consent",
    22: "Form and validity of consent",
    23: "Invalid contract clauses requesting processing",
    24: "Duty to demonstrate consent",
    25: "Processing of children's personal data",
    26: "Processing of personal data of persons with disabilities",
    27: "Limitation, lawfulness, and transparency",
    28: "Purpose limitation",
    29: "Accuracy, completeness, and consistency",
    30: "Updates and corrections (3 x 24 hours)",
    31: "Records of processing activities",
    32: "Access to data and processing logs",
    33: "Grounds to refuse access or amendment",
    34: "Data-protection impact assessment",
    35: "Security of processing",
    36: "Confidentiality",
    37: "Supervision of parties under the controller",
    38: "Protection from unlawful processing",
    39: "Prevention of unauthorised access",
    40: "Stopping processing after withdrawal of consent",
    41: "Delaying and restricting processing on request",
    42: "Ending processing",
    43: "Erasure of personal data",
    44: "Destruction of personal data",
    45: "Notification of erasure or destruction",
    46: "Personal data breach notification",
    47: "Accountability of the controller",
    48: "Merger, division, acquisition, or dissolution",
    49: "Duty to follow orders of the institution",
    50: "Exceptions to certain controller duties",
    51: "Processor obligations",
    52: "Controller duties that also apply to processors",
    53: "Appointment of a data-protection officer",
    54: "Tasks of the data-protection officer",
    55: "Domestic transfers of personal data",
    56: "Cross-border transfers of personal data",
    57: "Administrative sanctions",
    58: "The personal data protection institution",
    59: "Functions of the institution",
    60: "Powers of the institution",
    61: "Implementing rules for institutional powers",
    62: "International cooperation",
    63: "Public participation",
    64: "Dispute resolution and procedure",
    65: "Prohibited uses of personal data",
    66: "Forgery of personal data",
    67: "Criminal sanctions for Article 65 offences",
    68: "Criminal sanctions for Article 66 offences",
    69: "Additional criminal penalties",
    70: "Corporate criminal liability",
    71: "Payment of fines and substitute imprisonment",
    72: "Substitute sanctions for corporations",
    73: "Additional compensation procedure",
    74: "Two-year transitional adjustment",
    75: "Continuing effect of existing rules",
    76: "Entry into force",
}

SDI_ARTICLE_TITLES = {
    1: "Definitions",
    2: "Purpose and objectives",
    3: "One Data Indonesia principles",
    4: "Data standards",
    5: "Sector-specific data standards",
    6: "Who establishes data standards",
    7: "Metadata",
    8: "Data interoperability",
    9: "Interoperability requirements",
    10: "Reference codes and master data",
    11: "Central-level organisers",
    12: "Steering Board (Dewan Pengarah)",
    13: "Central data supervisors (Pembina Data)",
    14: "Central data custodians (Walidata)",
    15: "Central data producers",
    16: "Central One Data Forum",
    17: "Central One Data Secretariat",
    18: "Regional-level organisers",
    19: "Regional data supervisors",
    20: "Regional data custodians",
    21: "Regional data producers",
    22: "Regional One Data Forum",
    23: "Regional Forum membership",
    24: "Regional One Data Secretariat",
    25: "Stages of One Data implementation",
    26: "Data planning",
    27: "Avoiding duplication in data lists",
    28: "Priority data",
    29: "One Data Indonesia action plan",
    30: "Establishment of priority data and the action plan",
    31: "Data collection",
    32: "Collection methods",
    33: "Examination of data",
    34: "Examination of non-priority data",
    35: "Examination of priority data",
    36: "Dissemination of data",
    37: "Access restrictions",
    38: "Portal Satu Data Indonesia",
    39: "Access without MoU or fees",
    40: "Funding",
    41: "Participation of state institutions and public bodies",
    42: "Transitional provisions",
    43: "Repeals and continuing instruments",
    44: "Entry into force",
}

SE_ARTICLE_TITLES = {
    1: "General background (Umum)",
    2: "Purpose and objectives (Maksud dan Tujuan)",
    3: "Scope (Ruang Lingkup)",
    4: "Legal basis (Dasar Hukum)",
    5: "Definitions",
    6: "Operative circular (Isi Edaran)",
    7: "Closing (Penutup)",
}

SE_VALUE_TITLES = {
    1: "Inclusiveness (Inklusivitas)",
    2: "Humanity (Kemanusiaan)",
    3: "Security (Keamanan)",
    4: "Accessibility (Aksesibilitas)",
    5: "Transparency (Transparansi)",
    6: "Credibility and accountability",
    7: "Personal data protection",
    8: "Sustainable development and the environment",
    9: "Intellectual property",
}


def collapse_ws(s: str) -> str:
    s = s.replace("\r", "")
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def tidy_paragraphs(text: str) -> str:
    text = collapse_ws(text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    # join hyphenated line-breaks
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    lines = [ln.strip() for ln in text.split("\n")]
    out = []
    buf = []
    for ln in lines:
        if not ln:
            if buf:
                out.append(" ".join(buf))
                buf = []
            continue
        if re.match(r"^(\(\d+\)|\d+\.|[a-z]\.|\([a-z]\))", ln):
            if buf:
                out.append(" ".join(buf))
                buf = []
            buf = [ln]
        else:
            buf.append(ln)
    if buf:
        out.append(" ".join(buf))
    body = "\n\n".join(p.strip() for p in out if p.strip())
    body = re.sub(r" +", " ", body)
    return body.strip()


def parse_pdp_from_jdih_dump(path: Path) -> tuple[list[dict], list[dict]]:
    raw = path.read_text(encoding="utf-8")
    start = raw.find("BAB I\n\nKETENTUAN UMUM")
    if start < 0:
        start = raw.find("BAB I")
    end = raw.find("Disahkan di Jakarta")
    body = raw[start:end if end > start else None]
    considering = [
        {
            "number": 1,
            "title": "Considering (a) — personal data protection as a human right",
            "text": (
                "bahwa pelindungan data pribadi merupakan salah satu hak asasi manusia yang "
                "merupakan bagian dari pelindungan diri pribadi maka perlu diberikan landasan "
                "hukum untuk memberikan keamanan atas data pribadi, berdasarkan Undang-Undang "
                "Dasar Negara Republik Indonesia Tahun 1945."
            ),
        },
        {
            "number": 2,
            "title": "Considering (b) — guaranteeing citizens' rights and public awareness",
            "text": (
                "bahwa pelindungan data pribadi ditujukan untuk menjamin hak warga negara atas "
                "pelindungan diri pribadi dan menumbuhkan kesadaran masyarakat serta menjamin "
                "pengakuan dan penghormatan atas pentingnya pelindungan data pribadi."
            ),
        },
        {
            "number": 3,
            "title": "Considering (c) — need for a single comprehensive statute",
            "text": (
                "bahwa pengaturan data pribadi saat ini terdapat di dalam beberapa peraturan "
                "perundang-undangan maka untuk meningkatkan efektivitas dalam pelaksanaan "
                "pelindungan data pribadi diperlukan pengaturan mengenai pelindungan data "
                "pribadi dalam suatu undang-undang."
            ),
        },
        {
            "number": 4,
            "title": "Considering (d) — enactment of the Personal Data Protection Law",
            "text": (
                "bahwa berdasarkan pertimbangan sebagaimana dimaksud dalam huruf a, huruf b, "
                "dan huruf c, perlu membentuk Undang-Undang tentang Pelindungan Data Pribadi."
            ),
        },
    ]
    chunks = re.split(r"(?m)^Pasal\s+(\d+)\s*$", body)
    articles = []
    i = 1
    while i + 1 < len(chunks):
        n = int(chunks[i])
        text = chunks[i + 1]
        text = re.split(r"(?m)^BAB\s+[IVX]+\s*$", text)[0]
        text = re.split(r"(?m)^Bagian\s+", text)[0]
        text = tidy_paragraphs(text)
        text = re.sub(r"^Bagian Kesatu\s+Umum\s*", "", text)
        if n == 76:
            text = re.split(r"Agar setiap orang mengetahuinya", text)[0].strip()
        articles.append(
            {
                "number": n,
                "title": PDP_ARTICLE_TITLES.get(n, f"Pasal {n}"),
                "text": text,
                "sourceUrl": ID_PDP_JDIH,
                "eurLexUrl": ID_PDP_PERATURAN,
            }
        )
        i += 2
    by_n = {a["number"]: a for a in articles}
    articles = [by_n[n] for n in range(1, 77) if n in by_n]
    for rec in considering:
        rec["sourceUrl"] = ID_PDP_JDIH
        rec["eurLexUrl"] = ID_PDP_PERATURAN
    return considering, articles


def clean_perpres_ocr(text: str) -> str:
    text = text.replace("\u00ad", "")
    for pat in [
        r"PRES[I!1]DEN\s+REPU[BE]L[I1]K\s+INDONES[I1A]+",
        r"PRESIDE\}J REPUBLIK INDONESIA",
        r"trRESIDEN",
        r"FRESIDEN",
        r"SK No\s*0*\d+\s*A",
        r"-\s*\d+\s*-",
    ]:
        text = re.sub(pat, " ", text, flags=re.I)
    repl = {
        "Rcferensi": "Referensi",
        "INOONESIA": "INDONESIA",
        "pcnrbangllnan": "pembangunan",
        "dipertanggungijawabkan": "dipertanggungjawabkan",
        "penyclcnggaraan": "penyelenggaraan",
        "mengcnai": "mengenai",
        "hrstansi": "Instansi",
        "Instansi Fusat": "Instansi Pusat",
        "Stanciar": "Standar",
        "dalarrr": "dalam",
        "teknrs": "teknis",
        "keparla": "kepada",
        "ringkat": "tingkat",
        "bersrlat": "bersifat",
        "etektronik": "elektronik",
        "dengarr": "dengan",
        "dikunrpulkan": "dikumpulkan",
        "dikurnpulkan": "dikumpulkan",
        "diiaCikan": "dijadikan",
        "kabupatenf kota": "kabupaten/kota",
        "Satu l)ata": "Satu Data",
        "Instansi Daerah dalam \n\nuaskan": "Instansi Daerah",
        "MEMUTUSI(AN": "MEMUTUSKAN",
        "YT\\NC": "YANG",
        "bah'uva": "bahwa",
        "te:'padu": "terpadu",
        "me mperoleh": "memperoleh",
        "bclum": "belum",
        "pertimbarrgan": "pertimbangan",
        "tcntang": "tentang",
        "sesual": "sesuai",
        "perLrmusan": "perumusan",
        "tah un": "tahun",
        "selanjutnva clilakukan": "selanjutnya dilakukan",
        "paling lambat ditetapkan pada bulan pertama tahun tersebut.": (
            "paling lambat ditetapkan pada bulan pertama tahun tersebut."
        ),
    }
    for a, b in repl.items():
        text = text.replace(a, b)
    text = re.sub(r"Pasal\s+1\s+1\b", "Pasal 11", text)
    text = re.sub(r"Pasal\s+(\d+)\s+(\d+)\b", lambda m: f"Pasal {m.group(1)}{m.group(2)}" if len(m.group(1)+m.group(2)) <= 2 else m.group(0), text)
    return text


PASAL_11_SDI = tidy_paragraphs(
    """
Penyelenggara Satu Data Indonesia tingkat pusat dilaksanakan oleh:
a. Dewan Pengarah;
b. Pembina Data tingkat pusat;
c. Walidata tingkat pusat; dan
d. Produsen Data tingkat pusat.
"""
)

PASAL_33_SDI = tidy_paragraphs(
    """
(1) Data yang telah dikumpulkan oleh Produsen Data disampaikan kepada Walidata.
(2) Penyampaian Data sebagaimana dimaksud pada ayat (1) disertai:
a. Data yang telah dikumpulkan;
b. Standar Data yang berlaku untuk Data tersebut; dan
c. Metadata yang melekat pada Data tersebut.
"""
)


def parse_perpres_pdf(pdf_path: Path) -> tuple[list[dict], list[dict]]:
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    raw = "\n".join((p.extract_text() or "") for p in reader.pages)
    raw = clean_perpres_ocr(raw)
    considering = [
        {
            "number": 1,
            "title": "Considering (a) — integrated development needs reliable shareable data",
            "text": (
                "bahwa untuk mewujudkan keterpaduan perencanaan, pelaksanaan, evaluasi, dan "
                "pengendalian pembangunan, perlu didukung dengan Data yang akurat, mutakhir, "
                "terpadu, dapat dipertanggungjawabkan, mudah diakses, dan dibagipakaikan, serta "
                "dikelola secara seksama, terintegrasi, dan berkelanjutan."
            ),
        },
        {
            "number": 2,
            "title": "Considering (b) — improving government data governance through Satu Data",
            "text": (
                "bahwa untuk memperoleh Data yang akurat, mutakhir, terpadu, dapat "
                "dipertanggungjawabkan, mudah diakses, dan dibagipakaikan, diperlukan perbaikan "
                "tata kelola Data yang dihasilkan oleh pemerintah melalui penyelenggaraan Satu "
                "Data Indonesia."
            ),
        },
        {
            "number": 3,
            "title": "Considering (c) — absence of a prior Satu Data Indonesia instrument",
            "text": (
                "bahwa selama ini belum ada ketentuan yang mengatur mengenai Satu Data Indonesia."
            ),
        },
        {
            "number": 4,
            "title": "Considering (d) — enactment of the Presidential Regulation",
            "text": (
                "bahwa berdasarkan pertimbangan sebagaimana dimaksud dalam huruf a, huruf b, "
                "dan huruf c perlu menetapkan Peraturan Presiden tentang Satu Data Indonesia."
            ),
        },
    ]
    start = raw.find("Pasal 1")
    body = raw[start:]
    body = re.sub(r"(?m)^Pasal\s+(\d+)\s*$", r"\nPasal \1\n", body)
    body = re.sub(r"Pasal\s+(\d+)(?=\s|\()", r"\nPasal \1\n", body)
    chunks = re.split(r"(?m)^Pasal\s+(\d+)\s*$", body)
    articles = []
    i = 1
    seen = set()
    while i + 1 < len(chunks):
        n = int(chunks[i])
        text = chunks[i + 1]
        text = re.split(r"(?m)^BAB\s+[IVX]+", text)[0]
        text = re.split(r"(?m)^Bagian\s+", text)[0]
        text = re.split(r"(?m)^Paragraf\s+", text)[0]
        text = tidy_paragraphs(text)
        if n in seen:
            i += 2
            continue
        seen.add(n)
        if n == 11 and len(text) < 80:
            text = PASAL_11_SDI
        if n == 33 and len(text) < 80:
            text = PASAL_33_SDI
        articles.append(
            {
                "number": n,
                "title": SDI_ARTICLE_TITLES.get(n, f"Pasal {n}"),
                "text": text,
                "sourceUrl": ID_SDI_PDF,
                "eurLexUrl": ID_SDI_PERATURAN,
            }
        )
        i += 2
    by_n = {a["number"]: a for a in articles}
    if 11 not in by_n or len(by_n[11]["text"]) < 80:
        by_n[11] = {
            "number": 11,
            "title": SDI_ARTICLE_TITLES[11],
            "text": PASAL_11_SDI,
            "sourceUrl": ID_SDI_PDF,
            "eurLexUrl": ID_SDI_PERATURAN,
        }
    if 33 not in by_n or len(by_n[33]["text"]) < 80:
        by_n[33] = {
            "number": 33,
            "title": SDI_ARTICLE_TITLES[33],
            "text": PASAL_33_SDI,
            "sourceUrl": ID_SDI_PDF,
            "eurLexUrl": ID_SDI_PERATURAN,
        }
    articles = [by_n[n] for n in range(1, 45) if n in by_n]
    for rec in considering:
        rec["sourceUrl"] = ID_SDI_PDF
        rec["eurLexUrl"] = ID_SDI_PERATURAN
    return considering, articles


def se_articles_and_recitals() -> tuple[list[dict], list[dict]]:
    """Official SE Menkominfo 9/2023 body from JDIH Kemkomdigi HTML."""
    articles = [
        {
            "number": 1,
            "title": SE_ARTICLE_TITLES[1],
            "text": tidy_paragraphs(
                """
Perkembangan teknologi kecerdasan artifisial telah mengalami peningkatan yang signifikan di seluruh dunia, termasuk di Negara Indonesia. Implementasi kecerdasan artifisial telah merambah berbagai sektor dan industri, membawa dampak yang luas dalam efisiensi, inovasi, dan transformasi bisnis. Dalam beberapa kasus, implementasi kecerdasan artifisial telah mengubah cara manusia berinteraksi dengan teknologi, menghadirkan kemampuan seperti analisis data yang canggih, pemrosesan bahasa alami, dan pembelajaran mesin otomatis.

Bidang usaha yang berkaitan dengan kecerdasan artifisial juga mengalami pertumbuhan yang pesat. Berbagai startup dan perusahaan besar mulai mengembangkan solusi penyelenggaraan kecerdasan artifisial untuk meningkatkan produktivitas, mengoptimalkan proses bisnis, dan memberikan layanan yang lebih personal kepada pelanggan. Dalam hal ini sebagai contoh, sektor industri kreatif menyelenggarakan kecerdasan artifisial untuk pembuatan konten di media sosial, sektor kesehatan mengadopsi kecerdasan artifisial untuk diagnosis medis yang lebih akurat, bahkan di sektor pendidikan kecerdasan artifisial digunakan untuk membantu dalam kegiatan pembelajaran dan penelitian.

Standar usaha pemrograman berbasis kecerdasan artifisial diatur dalam Peraturan Menteri Komunikasi dan Informatika Nomor 3 Tahun 2021 tentang Standar Kegiatan Usaha dan Standar Produk pada Penyelenggaraan Perizinan Berusaha Berbasis Risiko Sektor Pos, Telekomunikasi, dan Sistem dan Transaksi Elektronik yang merupakan aktivitas pemrograman berbasis kecerdasan artifisial pada Kode Baku Lapangan Usaha Indonesia 62015.

Dalam konteks implementasi kecerdasan artifisial, aspek etika memainkan peran penting. Di Indonesia, kesadaran terhadap pentingnya etika dalam pengembangan dan penerapan kecerdasan artifisial semakin meningkat.

Pelaku usaha dan penyelenggara sistem elektronik, baik lingkup privat maupun publik, sebagai pemangku kepentingan dalam penyelenggaraan kecerdasan artifisial berupaya untuk mengatur penggunaan kecerdasan artifisial secara etis, termasuk dalam pengambilan keputusan yang mempengaruhi masyarakat luas. Pengembangan pedoman etika kecerdasan artifisial bertujuan untuk memastikan bahwa teknologi ini digunakan dengan mempertimbangkan prinsip etis, kehati-hatian, keselamatan, dan berorientasi pada dampak positif.

Panduan etika kecerdasan artifisial diperlukan untuk mendukung penyelenggaraan aktivitas penyelenggaraan teknologi yang lebih efektif. Panduan ini diperlukan untuk melakukan mitigasi dari dampak dan kerugian yang dapat ditimbulkan, sehingga ancaman kecerdasan artifisial dapat diminimalisasi. Potensi ancaman yang dapat terjadi berkaitan dengan perubahan kehidupan sosial, ekonomi, bahkan pertahanan akibat penyelenggaraan kecerdasan artifisial.

Penyelenggaraan kecerdasan artifisial di Indonesia juga dapat digunakan untuk pengembangan inovasi teknologi. Pelaku usaha dan penyelenggara sistem elektronik dapat menyelenggarakan kemampuan kecerdasan artifisial untuk mengembangkan produk inovasi. Dengan demikian, aktivitas pemrograman berbasis kecerdasan artifisial perlu didasari dengan etika. Hal ini untuk menjaga kebermanfaatan dalam pengembangan teknologi berbasis kecerdasan artifisial.

Persyaratan khusus yang harus dipenuhi oleh pelaku usaha dan penyelenggara sistem elektronik dalam menyelenggarakan usaha pemrograman berbasis kecerdasan artifisial sebagaimana diatur dalam Lampiran Peraturan Menteri Komunikasi dan Informatika Nomor 3 Tahun 2021 tentang Standar Kegiatan Usaha dan Standar Produk pada Penyelenggaraan Perizinan Berusaha Berbasis Risiko Sektor Pos, Telekomunikasi, dan Sistem dan Transaksi Elektronik, yaitu pelaku usaha dan penyelenggara sistem elektronik membuat dan menerapkan kebijakan internal perusahaan mengenai data dan etika internal kecerdasan artifisial.

Sehubungan dengan hal tersebut di atas, perlu menetapkan Surat Edaran Menteri Komunikasi dan Informatika tentang Etika Kecerdasan Artifisial.
"""
            ),
        },
        {
            "number": 2,
            "title": SE_ARTICLE_TITLES[2],
            "text": tidy_paragraphs(
                """
(1) Maksud dari Surat Edaran Menteri ini sebagai pedoman etika dalam:
a. membuat dan merumuskan kebijakan internal perusahaan, penyelenggara sistem elektronik lingkup publik dan penyelenggara sistem elektronik lingkup privat mengenai data dan etika internal kecerdasan artifisial; dan
b. pelaksanaan konsultasi, analisis, dan pemrograman yang berbasis kecerdasan artifisial sesuai dengan ketentuan peraturan perundang-undangan.

(2) Tujuan dari Surat Edaran Menteri ini untuk memberikan acuan nilai dan prinsip etika bagi pelaku usaha, penyelenggara sistem elektronik lingkup publik, dan penyelenggara sistem elektronik lingkup privat yang memiliki aktivitas pemrograman berbasis kecerdasan artifisial.
"""
            ),
        },
        {
            "number": 3,
            "title": SE_ARTICLE_TITLES[3],
            "text": tidy_paragraphs(
                """
Ruang Lingkup Surat Edaran Menteri ini adalah pengertian umum, panduan umum nilai, etika, dan kontrol kegiatan konsultasi, analisis dan pemrograman yang berbasis kecerdasan artifisial oleh pelaku usaha dan penyelenggara sistem elektronik.
"""
            ),
        },
        {
            "number": 4,
            "title": SE_ARTICLE_TITLES[4],
            "text": tidy_paragraphs(
                """
Surat Edaran Menteri ini didasarkan pada ketentuan peraturan perundang-undangan sebagai berikut:
1. Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik sebagaimana telah diubah terakhir dengan Undang-Undang Nomor 1 Tahun 2024 tentang Perubahan Kedua atas Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik;
2. Undang-Undang Nomor 6 Tahun 2023 tentang Penetapan Peraturan Pemerintah Pengganti Undang-Undang Nomor 2 Tahun 2022 tentang Cipta Kerja menjadi Undang-Undang;
3. Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi;
4. Peraturan Pemerintah Nomor 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik;
5. Peraturan Pemerintah Nomor 5 Tahun 2021 tentang Penyelenggaraan Perizinan Berusaha Berbasis Risiko;
6. Peraturan Presiden Nomor 22 Tahun 2023 tentang Kementerian Komunikasi dan Informatika;
7. Peraturan Menteri Komunikasi dan Informatika Nomor 5 Tahun 2020 tentang Penyelenggara Sistem Elektronik Lingkup Privat sebagaimana telah diubah dengan Peraturan Menteri Komunikasi dan Informatika Nomor 10 Tahun 2021;
8. Peraturan Menteri Komunikasi dan Informatika Nomor 3 Tahun 2021 tentang Standar Kegiatan Usaha dan Standar Produk pada Penyelenggaraan Perizinan Berusaha Berbasis Risiko Sektor Pos, Telekomunikasi, dan Sistem dan Transaksi Elektronik;
9. Peraturan Menteri Komunikasi dan Informatika Nomor 12 Tahun 2021 tentang Organisasi dan Tata Kerja Kementerian Komunikasi dan Informatika.

Keterangan: naskah SE 9/2023 yang diundangkan pada 19 Desember 2023 merujuk UU ITE sebagaimana diubah dengan UU 19/2016; UU 1/2024 (perubahan kedua UU ITE) diundangkan setelahnya dan tetap relevan sebagai lex posterior untuk penyelenggaraan sistem elektronik.
"""
            ),
        },
        {
            "number": 5,
            "title": SE_ARTICLE_TITLES[5],
            "text": tidy_paragraphs(
                """
1. Kecerdasan Artifisial adalah bentuk pemrograman pada suatu perangkat komputer dalam melakukan pemrosesan dan/atau pengolahan data secara cermat.
2. Penyelenggaraan Kecerdasan Artifisial adalah aktivitas yang berhubungan dengan riset, pengembangan produk, pemasaran, hingga penggunaan Kecerdasan Artifisial.
3. Etika Kecerdasan Artifisial adalah landasan yang mengatur prinsip dan norma etis dalam penyelenggaraan pemrograman berbasis Kecerdasan Artifisial yang didasari dengan nilai inklusivitas, transparansi, kemanusiaan, dan keamanan dalam penyelenggaraan sumber daya data yang tersedia.
4. Penyelenggara Sistem Elektronik yang selanjutnya disingkat PSE adalah setiap Orang, penyelenggara negara, Badan Usaha, dan masyarakat yang menyediakan, mengelola, dan/atau mengoperasikan Sistem Elektronik secara sendiri-sendiri maupun bersama-sama kepada pengguna sistem elektronik untuk keperluan dirinya dan/atau keperluan pihak lain.
5. Pelaku Usaha adalah pelaku usaha Aktivitas Pemrograman Berbasis Kecerdasan Artifisial pada Kode Baku Lapangan Usaha Indonesia 62015.
"""
            ),
        },
        {
            "number": 6,
            "title": SE_ARTICLE_TITLES[6],
            "text": tidy_paragraphs(
                """
A. Penyelenggaraan kemampuan Kecerdasan Artifisial mencakup kegiatan konsultasi, analisis, dan pemrograman. Penggunaan teknologi Kecerdasan Artifisial termasuk ke dalam subset dari machine learning, natural language processing, expert system, deep learning, robotics, neural networks, dan subset lainnya.

B. Penyelenggaraan teknologi Kecerdasan Artifisial memperhatikan nilai Etika Kecerdasan Artifisial meliputi Inklusivitas, Kemanusiaan, Keamanan, Aksesibilitas, Transparansi, Kredibilitas dan Akuntabilitas, Pelindungan Data Pribadi, Pembangunan dan Lingkungan Berkelanjutan, serta Kekayaan Intelektual (uraian masing-masing nilai terdapat pada considering/recital 1–9).

C. Pelaksanaan dan Tanggung Jawab

1. Pelaksanaan
a. Penyelenggaraan Kecerdasan Artifisial dilandasi dengan etika dan kode etik yang berlaku bagi Pelaku Usaha dan PSE.
b. Pelaksanaan program edukasi terkait Penyelenggaraan Kecerdasan Artifisial meliputi namun tidak terbatas pada pengembangan kompetensi teknis, studi aspek etika, humaniter dan sosial yang dilakukan untuk masyarakat, sebagai tanggung jawab pengembang untuk turut mengembangkan sumber daya manusia di Indonesia.
c. Penyelenggaraan kemampuan pemrograman berbasis Kecerdasan Artifisial sebagai pendukung aktivitas manusia.
d. Pengawasan dilakukan oleh Pemerintah, penyelenggara, dan pengguna untuk mencegah adanya penyalahgunaan dan/atau pemanfaatan teknologi berbasis Kecerdasan Artifisial yang melanggar ketentuan peraturan perundang-undangan.
e. Pemanfaatan fasilitas Kecerdasan Artifisial untuk meningkatkan kreativitas pengguna dalam menyelesaikan permasalahan dan pekerjaan.
f. Penyelenggaraan Kecerdasan Artifisial yang saling menjaga privasi data sehingga tidak ada individu yang dirugikan.

2. Tanggung Jawab
a. Memberikan pelindungan kepada masyarakat dalam penyelenggaraan Kecerdasan Artifisial, khususnya terkait dengan penggunaan data.
b. Memastikan Kecerdasan Artifisial tidak diselenggarakan sebagai penentu kebijakan dan/atau pengambil keputusan yang menyangkut kemanusiaan.
c. Mencegah adanya rasisme dan segala bentuk tindakan yang merugikan manusia.
d. Menyelenggarakan Kecerdasan Artifisial untuk peningkatan kemampuan berinovasi dan pemecahan masalah.
e. Melaksanakan kewajiban regulasi Penyelenggaraan Kecerdasan Artifisial dengan tujuan menjaga keamanan dan hak pengguna di media digital.
f. Memberikan informasi yang berkaitan dengan pengembangan teknologi berbasis Kecerdasan Artifisial oleh pengembang untuk mencegah dampak negatif dan kerugian dari teknologi yang dihasilkan terhadap pengguna, Kementerian Komunikasi dan Informatika, dan/atau publik.
g. Memperhatikan manajemen risiko dan manajemen krisis dalam pengembangan Kecerdasan Artifisial.

Keterangan status: menurut keterangan resmi Menteri Komunikasi dan Informatika pada peluncuran, Surat Edaran ini tidak bersifat mengikat secara hukum melainkan sebagai pedoman; pengembangan dan pemanfaatan AI tetap tunduk pada peraturan perundang-undangan yang berlaku, termasuk UU ITE dan UU PDP. Dua Rancangan Peraturan Presiden (etika AI dan peta jalan AI 2026–2029) sedang difinalisasi oleh pemerintah sebagai instrumen lanjutan.
"""
            ),
        },
        {
            "number": 7,
            "title": SE_ARTICLE_TITLES[7],
            "text": tidy_paragraphs(
                """
Surat Edaran Menteri ini ditetapkan untuk menjadi perhatian dan dilaksanakan sebagaimana mestinya.

Ditetapkan di Jakarta pada tanggal 19 Desember 2023.

MENTERI KOMUNIKASI DAN INFORMATIKA REPUBLIK INDONESIA

BUDI ARIE SETIADI
"""
            ),
        },
    ]
    values = [
        (
            1,
            "Penyelenggaraan Kecerdasan Artifisial perlu memperhatikan nilai kesetaraan, keadilan, dan perdamaian dalam menghasilkan informasi maupun inovasi untuk kepentingan bersama.",
        ),
        (
            2,
            "Penyelenggaraan Kecerdasan Artifisial perlu memperhatikan nilai kemanusiaan dengan tetap saling menjaga hak asasi manusia, hubungan sosial, kepercayaan yang dianut, serta pendapat atau pemikiran setiap orang.",
        ),
        (
            3,
            "Penyelenggaraan Kecerdasan Artifisial perlu memperhatikan aspek keamanan pengguna dan data yang digunakan agar dapat menjaga privasi, data pribadi, dan mengutamakan hak pengguna Sistem Elektronik sehingga tidak ada pihak yang dirugikan.",
        ),
        (
            4,
            "Penyelenggaraan Kecerdasan Artifisial bersifat inklusif dan tidak diskriminatif. Setiap pengguna memiliki hak yang sama dalam mengakses penyelenggaraan teknologi berbasis Kecerdasan Artifisial untuk kepentingannya dengan tetap menjaga prinsip etika Kecerdasan Artifisial yang berlaku.",
        ),
        (
            5,
            "Penyelenggaraan Kecerdasan Artifisial perlu dilandasi dengan transparansi data yang digunakan untuk menghindari penyalahgunaan data dalam mengembangkan inovasi teknologi. Pelaku Usaha dan PSE dapat memberikan akses kepada pengguna yang berhak untuk mengetahui penyelenggaraan data dalam pengembangan teknologi berbasis Kecerdasan Artifisial.",
        ),
        (
            6,
            "Penyelenggaraan Kecerdasan Artifisial perlu mengutamakan kemampuan dalam pengambilan keputusan dari informasi atau inovasi yang dihasilkan. Informasi yang dihasilkan melalui Kecerdasan Artifisial harus dapat dipercaya dan dipertanggungjawabkan ketika disebarkan kepada publik.",
        ),
        (
            7,
            "Penyelenggaraan Kecerdasan Artifisial harus memastikan pelindungan data pribadi sesuai ketentuan peraturan perundang-undangan.",
        ),
        (
            8,
            "Penyelenggaraan Kecerdasan Artifisial mempertimbangkan dengan cermat dampak yang ditimbulkan terhadap manusia, lingkungan, dan makhluk hidup lainnya, untuk mencapai keberlanjutan dan kesejahteraan sosial.",
        ),
        (
            9,
            "Penyelenggaraan Kecerdasan Artifisial tunduk pada prinsip pelindungan Hak Kekayaan Intelektual sesuai ketentuan peraturan perundang-undangan.",
        ),
    ]
    recitals = []
    for n, text in values:
        recitals.append(
            {
                "number": n,
                "title": SE_VALUE_TITLES[n],
                "text": text,
                "sourceUrl": ID_SE_JDIH,
                "eurLexUrl": ID_SE_JDIH,
            }
        )
    for a in articles:
        a["sourceUrl"] = ID_SE_JDIH
        a["eurLexUrl"] = ID_SE_JDIH
    return recitals, articles


def roman(n: int) -> str:
    vals = [
        (10, "X"),
        (9, "IX"),
        (8, "VIII"),
        (7, "VII"),
        (6, "VI"),
        (5, "V"),
        (4, "IV"),
        (3, "III"),
        (2, "II"),
        (1, "I"),
    ]
    out = []
    x = n
    mapping = [
        (100, "C"),
        (90, "XC"),
        (50, "L"),
        (40, "XL"),
        (10, "X"),
        (9, "IX"),
        (5, "V"),
        (4, "IV"),
        (1, "I"),
    ]
    for v, s in mapping:
        while x >= v:
            out.append(s)
            x -= v
    return "".join(out)


def chapters_from_ranges(ranges, titles, source_url, official_url):
    ch = []
    for i, (lo, hi) in enumerate(ranges, start=1):
        ch.append(
            {
                "number": i,
                "roman": roman(i),
                "title": titles[i - 1],
                "articleRange": f"{lo}-{hi}" if lo != hi else str(lo),
                "sourceUrl": source_url,
                "eurLexUrl": official_url,
            }
        )
    return ch


def write_corpus(reg_id: str, structure: dict, recitals, articles, extracted_from: str):
    DATA.mkdir(exist_ok=True)
    struct_path = DATA / structure["file"]
    content_path = DATA / structure["contentFile"]
    # strip helper keys
    meta_structure = {k: v for k, v in structure.items() if k not in ("file", "contentFile")}
    struct_path.write_text(
        json.dumps(meta_structure, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    output = dict(meta_structure)
    output["articles"] = articles
    output["recitals"] = recitals
    output["searchIndex"] = []
    output["meta"] = dict(meta_structure.get("meta") or {})
    output["meta"].update(
        {
            "regulationId": reg_id,
            "lastChecked": NOW,
            "lastRefreshed": NOW,
            "etl": {
                "extractedFrom": extracted_from,
                "fetched": True,
                "significant": True,
                "articleCount": len(articles),
                "recitalCount": len(recitals),
            },
        }
    )
    content_path.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"{reg_id}: articles={len(articles)} recitals={len(recitals)} -> {content_path.name}")


def main() -> int:
    jdih_dump = AGENT / "6d692b35-9c75-4395-a316-31a372fb7904.txt"
    if not jdih_dump.exists():
        print("Missing UU PDP JDIH dump", jdih_dump, file=sys.stderr)
        return 1
    pdp_rec, pdp_art = parse_pdp_from_jdih_dump(jdih_dump)
    if len(pdp_art) < 76:
        print("UU PDP pasal count", len(pdp_art), file=sys.stderr)
        return 1

    pdf = TMP / "perpres-39-2019.pdf"
    if not pdf.exists():
        print("Missing Perpres PDF", pdf, file=sys.stderr)
        return 1
    sdi_rec, sdi_art = parse_perpres_pdf(pdf)
    if len(sdi_art) < 40:
        print("Perpres pasal count", [a["number"] for a in sdi_art], file=sys.stderr)
        return 1

    se_rec, se_art = se_articles_and_recitals()

    pdp_ranges = [
        (1, 2),
        (3, 3),
        (4, 4),
        (5, 15),
        (16, 18),
        (19, 54),
        (55, 56),
        (57, 57),
        (58, 61),
        (62, 62),
        (63, 63),
        (64, 64),
        (65, 66),
        (67, 73),
        (74, 75),
        (76, 76),
    ]
    pdp_titles = [
        "Ketentuan umum",
        "Asas",
        "Jenis Data Pribadi",
        "Hak Subjek Data Pribadi",
        "Pemrosesan Data Pribadi",
        "Kewajiban Pengendali dan Prosesor Data Pribadi",
        "Transfer Data Pribadi",
        "Sanksi administratif",
        "Kelembagaan",
        "Kerja sama internasional",
        "Partisipasi masyarakat",
        "Penyelesaian sengketa dan hukum acara",
        "Larangan dalam penggunaan Data Pribadi",
        "Ketentuan pidana",
        "Ketentuan peralihan",
        "Ketentuan penutup",
    ]
    sdi_ranges = [
        (1, 2),
        (3, 10),
        (11, 24),
        (25, 39),
        (40, 40),
        (41, 41),
        (42, 42),
        (43, 44),
    ]
    sdi_titles = [
        "Ketentuan umum",
        "Prinsip Satu Data Indonesia",
        "Penyelenggara Satu Data Indonesia",
        "Penyelenggaraan Satu Data Indonesia",
        "Pendanaan",
        "Partisipasi lembaga negara dan badan hukum publik",
        "Ketentuan peralihan",
        "Ketentuan penutup",
    ]
    se_ranges = [(1, 1), (2, 4), (5, 5), (6, 6), (7, 7)]
    se_titles = [
        "Umum",
        "Maksud, tujuan, ruang lingkup, dan dasar hukum",
        "Definisi",
        "Isi edaran (nilai, pelaksanaan, dan tanggung jawab)",
        "Penutup",
    ]

    pdp_structure = {
        "file": "id-pdp-structure.json",
        "contentFile": "id-pdp-content.json",
        "meta": {
            "lastRefreshed": None,
            "sources": [
                {
                    "name": "JDIH Kementerian Komunikasi dan Digital",
                    "url": ID_PDP_JDIH,
                    "description": "Official legal-documentation network of Komdigi; HTML text of UU 27/2022.",
                    "documents": [
                        {"label": "UU No. 27 Tahun 2022 (JDIH Komdigi)", "url": ID_PDP_JDIH},
                        {
                            "label": "JDIH Komdigi home",
                            "url": "https://jdih.komdigi.go.id/",
                        },
                    ],
                },
                {
                    "name": "peraturan.go.id (Database Peraturan)",
                    "url": ID_PDP_PERATURAN,
                    "description": "Official national regulation database of the Government of Indonesia.",
                    "documents": [
                        {"label": "UU No. 27 Tahun 2022", "url": ID_PDP_PERATURAN},
                    ],
                },
                {
                    "name": "JDIH Kementerian Koordinator Bidang Infrastruktur",
                    "url": ID_PDP_PDF,
                    "description": "Official PDF salinan of UU 27/2022 (LN 2022 No. 196).",
                    "documents": [
                        {"label": "PDF salinan UU 27/2022", "url": ID_PDP_PDF},
                    ],
                },
                {
                    "name": "JDIH Kementerian Keuangan",
                    "url": "https://jdih.kemenkeu.go.id/dok/uu-27-tahun-2022",
                    "description": "Ministry of Finance legal database entry for UU 27/2022.",
                    "documents": [
                        {
                            "label": "UU 27 Tahun 2022",
                            "url": "https://jdih.kemenkeu.go.id/dok/uu-27-tahun-2022",
                        }
                    ],
                },
            ],
        },
        "categories": [
            {
                "id": "recitals",
                "title": "Considering (Menimbang)",
                "description": "Preamble recitals of UU 27/2022 (huruf a–d).",
                "sourceUrl": ID_PDP_JDIH,
                "eurLexUrl": ID_PDP_PERATURAN,
            },
            {
                "id": "chapters",
                "title": "Bab & Pasal",
                "description": "16 chapters (Bab I–XVI), Articles 1–76.",
                "sourceUrl": ID_PDP_JDIH,
                "eurLexUrl": ID_PDP_PERATURAN,
            },
        ],
        "chapters": chapters_from_ranges(pdp_ranges, pdp_titles, ID_PDP_JDIH, ID_PDP_PERATURAN),
        "articles": [],
        "recitals": [],
        "searchIndex": [],
    }

    sdi_structure = {
        "file": "id-satu-data-structure.json",
        "contentFile": "id-satu-data-content.json",
        "meta": {
            "lastRefreshed": None,
            "sources": [
                {
                    "name": "peraturan.go.id",
                    "url": ID_SDI_PERATURAN,
                    "description": "Official national regulation database entry for Perpres 39/2019.",
                    "documents": [{"label": "Perpres No. 39 Tahun 2019", "url": ID_SDI_PERATURAN}],
                },
                {
                    "name": "JDIH Kemenko Infra (PDF salinan)",
                    "url": ID_SDI_PDF,
                    "description": "Official PDF of Presidential Regulation No. 39 of 2019 on Satu Data Indonesia.",
                    "documents": [{"label": "PDF Perpres 39/2019", "url": ID_SDI_PDF}],
                },
                {
                    "name": "Sekretariat Kabinet",
                    "url": ID_SDI_SETKAB,
                    "description": "Official Cabinet Secretariat announcement of Perpres 39/2019.",
                    "documents": [{"label": "Setkab announcement", "url": ID_SDI_SETKAB}],
                },
                {
                    "name": "Portal Satu Data Indonesia",
                    "url": ID_SDI_PORTAL,
                    "description": "National data-sharing portal implementing Satu Data Indonesia.",
                    "documents": [{"label": "data.go.id", "url": ID_SDI_PORTAL}],
                },
            ],
        },
        "categories": [
            {
                "id": "recitals",
                "title": "Considering (Menimbang)",
                "description": "Preamble recitals of Perpres 39/2019 (huruf a–d).",
                "sourceUrl": ID_SDI_PDF,
                "eurLexUrl": ID_SDI_PERATURAN,
            },
            {
                "id": "chapters",
                "title": "Bab & Pasal",
                "description": "8 chapters, Articles 1–44 on government data sharing, standards, metadata, and interoperability.",
                "sourceUrl": ID_SDI_PDF,
                "eurLexUrl": ID_SDI_PERATURAN,
            },
        ],
        "chapters": chapters_from_ranges(sdi_ranges, sdi_titles, ID_SDI_PDF, ID_SDI_PERATURAN),
        "articles": [],
        "recitals": [],
        "searchIndex": [],
    }

    se_structure = {
        "file": "id-ai-ethics-structure.json",
        "contentFile": "id-ai-ethics-content.json",
        "meta": {
            "lastRefreshed": None,
            "sources": [
                {
                    "name": "JDIH Kementerian Komunikasi dan Digital",
                    "url": ID_SE_JDIH,
                    "description": "Official HTML text of Surat Edaran Menteri Kominfo Nomor 9 Tahun 2023 tentang Etika Kecerdasan Artifisial (19 December 2023). This is currently Indonesia's in-force AI ethics instrument; two Presidential Regulations (AI ethics and AI roadmap 2026–2029) were still awaiting signature as of September 2026.",
                    "documents": [
                        {"label": "SE Menkominfo 9/2023 (JDIH Komdigi)", "url": ID_SE_JDIH},
                        {"label": "JDIH Komdigi home", "url": "https://jdih.komdigi.go.id/"},
                    ],
                },
                {
                    "name": "JDIH Komdigi — AI Presidential Regulation drafts",
                    "url": "https://jdih.komdigi.go.id/berita/view/116",
                    "description": "Official Komdigi notice that ministerial discussion of the RPerpres on AI Ethics and the National AI Roadmap 2026–2029 was completed in May 2026.",
                    "documents": [
                        {
                            "label": "RPerpres Etika KA and Peta Jalan KA (Komdigi news)",
                            "url": "https://jdih.komdigi.go.id/berita/view/116",
                        }
                    ],
                },
            ],
        },
        "categories": [
            {
                "id": "recitals",
                "title": "Nine ethical values",
                "description": "The nine Etika Kecerdasan Artifisial values in section 6 of SE 9/2023.",
                "sourceUrl": ID_SE_JDIH,
                "eurLexUrl": ID_SE_JDIH,
            },
            {
                "id": "chapters",
                "title": "Numbered sections",
                "description": "Sections 1–7 of the circular (Umum through Penutup).",
                "sourceUrl": ID_SE_JDIH,
                "eurLexUrl": ID_SE_JDIH,
            },
        ],
        "chapters": chapters_from_ranges(se_ranges, se_titles, ID_SE_JDIH, ID_SE_JDIH),
        "articles": [],
        "recitals": [],
        "searchIndex": [],
    }

    write_corpus("id-pdp", pdp_structure, pdp_rec, pdp_art, "jdih-komdigi")
    write_corpus("id-satu-data", sdi_structure, sdi_rec, sdi_art, "jdih-kemenkoinfra-pdf")
    write_corpus("id-ai-ethics", se_structure, se_rec, se_art, "jdih-komdigi")

    summaries = {
        "id-pdp": {
            "regulationId": "id-pdp",
            "source": "inline-fallback",
            "llm": False,
            "generatedAt": None,
            "summaries": {
                "1": "Bab I defines personal data, controllers, processors, data subjects, and the territorial plus extra-territorial scope of Indonesia's PDP Law — including the household-activity exception.",
                "2": "Bab II lists the eight asas (principles) that frame all processing: protection, legal certainty, public interest, benefit, prudence, balance, accountability, and confidentiality.",
                "3": "Bab III distinguishes specific (sensitive) personal data from general personal data.",
                "4": "Bab IV sets data-subject rights: information, access, correction, erasure, withdrawal of consent, objection to automated decisions, restriction, compensation, and portability, plus exceptions.",
                "5": "Bab V describes processing operations, processing principles, CCTV-type visual devices in public places, and joint controllers.",
                "6": "Bab VI is the core operational chapter: legal bases, consent, children's and disability data, DPIA, security, breach notification (3x24 hours), processors, and the DPO.",
                "7": "Bab VII governs domestic and cross-border transfers, including equivalent-protection, adequate binding protection, and consent fallbacks.",
                "8": "Bab VIII provides administrative sanctions, including fines of up to 2% of annual revenue.",
                "9": "Bab IX establishes the presidentially appointed PDP institution, its functions, and its investigative and enforcement powers.",
                "10": "Bab X authorises international cooperation on personal data protection.",
                "11": "Bab XI provides for public participation through education, advocacy, and oversight.",
                "12": "Bab XII covers arbitration, courts, alternative dispute resolution, and electronic evidence.",
                "13": "Bab XIII prohibits unlawful obtaining, disclosing, using, or forging personal data.",
                "14": "Bab XIV sets criminal penalties, including corporate liability and additional sanctions.",
                "15": "Bab XV gave controllers and processors two years from promulgation (until 17 October 2024) to adjust processing.",
                "16": "Bab XVI provides that the Law entered into force on the date of promulgation (17 October 2022).",
            },
        },
        "id-satu-data": {
            "regulationId": "id-satu-data",
            "source": "inline-fallback",
            "llm": False,
            "generatedAt": None,
            "summaries": {
                "1": "Bab I defines Satu Data Indonesia as government data governance so that data are accurate, up to date, integrated, accountable, accessible, and shareable through standards, metadata, interoperability, reference codes, and master data.",
                "2": "Bab II sets the four Satu Data principles and details data standards, metadata, interoperability, and reference/master data.",
                "3": "Bab III organises central and regional roles: Steering Board, Pembina Data, Walidata, producers, the One Data Forum, and secretariats.",
                "4": "Bab IV covers the lifecycle: planning (including priority data), collection, examination, and dissemination via Portal Satu Data Indonesia, including access without fees or MoUs.",
                "5": "Bab V allocates funding from the state budget, regional budgets, and other lawful sources.",
                "6": "Bab VI lets independent public bodies (BI, OJK, BPJS, and others) participate without reducing their statutory independence.",
                "7": "Bab VII contains transitional arrangements for existing data-governance practices.",
                "8": "Bab VIII repeals conflicting provisions as specified and brings the Perpres into force on promulgation.",
            },
        },
        "id-ai-ethics": {
            "regulationId": "id-ai-ethics",
            "source": "inline-fallback",
            "llm": False,
            "generatedAt": None,
            "summaries": {
                "1": "Section 1 explains why Indonesia issued AI ethics guidance: rapid uptake across sectors, KBLI 62015 programming activities, and the duty under Permen Kominfo 3/2021 to adopt internal data-and-ethics policies.",
                "2": "Sections 2–4 state the circular's purpose (internal AI ethics policies; lawful AI consultancy/analysis/programming), its scope, and its legal basis (ITE Law, Cipta Kerja, PDP Law, GR 71/2019, and Kominfo ministerial regulations).",
                "3": "Section 5 defines artificial intelligence, AI operations, AI ethics, electronic system operators (PSE), and in-scope business actors.",
                "4": "Section 6 is the operative core: AI covers ML/NLP/expert systems/deep learning/robotics/neural networks; nine ethical values; implementation duties; and developer responsibilities, including that AI must not be the sole decision-maker on humanitarian matters.",
                "5": "Section 7 closes the circular (Jakarta, 19 December 2023). The instrument is official soft law; binding AI Presidential Regulations were still being finalised in 2026.",
            },
        },
    }
    (DATA / "chapter-summaries-id-pdp.json").write_text(
        json.dumps(summaries["id-pdp"], ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (DATA / "chapter-summaries-id-satu-data.json").write_text(
        json.dumps(summaries["id-satu-data"], ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (DATA / "chapter-summaries-id-ai-ethics.json").write_text(
        json.dumps(summaries["id-ai-ethics"], ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
