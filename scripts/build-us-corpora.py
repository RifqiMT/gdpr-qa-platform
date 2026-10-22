#!/usr/bin/env python3
"""Build US analogue corpora from official government texts.

Sources (authoritative):
- CCPA/CPRA: California Civil Code Title 1.81.5 §§1798.100–1798.199.100,
  CPPA unofficial compilation posted January 2025 (cppa.ca.gov).
- Colorado ADMT Act: SB 26-189, 2026 Colo. Sess. Laws ch. 131
  (signed 14 May 2026); C.R.S. 6-1-1701 et seq.
- OPEN Government Data Act: Title II of Pub. L. 115-435
  (Foundations for Evidence-Based Policymaking Act of 2018),
  132 Stat. 5529; 44 U.S.C. §§3502, 3504, 3506, 3511.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
TMP = ROOT / "tmp-us-etl"

NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

CCPA_CPPA = "https://cppa.ca.gov/regulations/pdf/ccpa_text.pdf"
CCPA_LEGINFO = "https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=CIV&division=3.&title=1.81.5.&part=4.&chapter=&article="
CCPA_CPPA_HOME = "https://cppa.ca.gov/"
CCPA_OAG = "https://oag.ca.gov/privacy/ccpa"

CO_BILL = "https://leg.colorado.gov/bills/sb26-189"
CO_SESSION = "https://www.leg.colorado.gov/laws/session-laws/SB26-189/131/download"
CO_AG = "https://coag.gov/ai/"
CO_CRS = "https://leg.colorado.gov/bills/sb26-189"

OPEN_GOVINFO = "https://www.govinfo.gov/content/pkg/PLAW-115publ435/html/PLAW-115publ435.htm"
OPEN_CONGRESS = "https://www.congress.gov/115/plaws/publ435/PLAW-115publ435.pdf"
OPEN_DATAGOV = "https://data.gov/"
OPEN_GSA = "https://www.gsa.gov/policy-regulations/policy/information-technology-policy"

ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]


def collapse(text: str) -> str:
    t = (text or "").replace("\u00a0", " ").replace("\r", "\n")
    t = re.sub(r"[ \t]+\n", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    t = re.sub(r"[ \t]{2,}", " ", t)
    return t.strip()


_KEEP_ACRONYMS = (
    "ADMT",
    "FERPA",
    "HIPAA",
    "FDA",
    "GLBA",
    "ECOA",
    "FCRA",
    "CFR",
    "USC",
    "FTE",
    "CIO",
    "OMB",
    "GSA",
)


def sentence_case_caps(text: str) -> str:
    """Turn Colorado session-law ALL CAPS into readable prose without changing words."""
    t = collapse(text)
    t = re.sub(r"\bADECISION\b", "A DECISION", t, flags=re.I)
    t = re.sub(r"\bADEPLOYER\b", "A DEPLOYER", t, flags=re.I)
    t = re.sub(r"\bADEVELOPER\b", "A DEVELOPER", t, flags=re.I)
    t = re.sub(r"\bACOVERED\b", "A COVERED", t, flags=re.I)
    t = re.sub(r"\bAPLAIN\b", "A PLAIN", t, flags=re.I)
    t = re.sub(r"\bANOTICE\b", "A NOTICE", t, flags=re.I)
    if sum(1 for c in t if c.isupper()) < 0.45 * max(1, sum(1 for c in t if c.isalpha())):
        return t
    lower = t.lower()
    out = []
    cap_next = True
    for ch in lower:
        if cap_next and ch.isalpha():
            out.append(ch.upper())
            cap_next = False
        else:
            out.append(ch)
            if ch in ".!?":
                cap_next = True
    restored = "".join(out)
    for acro in _KEEP_ACRONYMS:
        restored = re.sub(rf"\b{re.escape(acro.lower())}\b", acro, restored, flags=re.I)
    restored = re.sub(r"\bu\.s\.c\.", "U.S.C.", restored, flags=re.I)
    restored = re.sub(r"\bc\.r\.s\.", "C.R.S.", restored, flags=re.I)
    restored = re.sub(r"\bpubl?\.\s*l\.", "Pub. L.", restored, flags=re.I)
    return restored


def clean_co(text: str) -> str:
    t = text or ""
    t = re.sub(
        r"\)+\)+\)+ Capital letters or bold & italic numbers indicate new material.*?(?=\n|$)",
        " ",
        t,
        flags=re.I | re.S,
    )
    t = re.sub(
        r"Ch\.\s*131\s+Consumer and Commercial Transactions\s+\d+",
        " ",
        t,
        flags=re.I,
    )
    t = re.sub(
        r"\d+\s+Consumer and Commercial Transactions\s+Ch\.\s*131",
        " ",
        t,
        flags=re.I,
    )
    t = re.sub(r"####\s*", "", t)
    t = re.sub(r"\s+", " ", t)
    return sentence_case_caps(t)


def clean_govinfo(text: str) -> str:
    t = text or ""
    t = re.sub(r"```+\s*", "", t)
    t = re.sub(r"\[\[Page \d+ STAT\. \d+\]\]", " ", t)
    t = re.sub(r"<<NOTE:[^>]*>>", " ", t)
    t = re.sub(r"``", '"', t)
    t = re.sub(r"''", '"', t)
    t = re.sub(r"\s+", " ", t)
    return collapse(t)


def article(
    number: int,
    title: str,
    text: str,
    source: str,
    gazette: str,
    citation: str = "",
) -> dict:
    body = collapse(text)
    if citation and citation not in title:
        title = f"{citation} — {title}" if title else citation
    return {
        "number": number,
        "title": title.strip(" —"),
        "text": body,
        "sourceUrl": source,
        "eurLexUrl": gazette,
    }


def recital(number: int, title: str, text: str, source: str, gazette: str) -> dict:
    return {
        "number": number,
        "title": title,
        "text": collapse(text),
        "sourceUrl": source,
        "eurLexUrl": gazette,
    }


def chapter(number: int, title: str, lo: int, hi: int, source: str, gazette: str) -> dict:
    rng = str(lo) if lo == hi else f"{lo}-{hi}"
    return {
        "number": number,
        "roman": ROMANS[number - 1] if number <= len(ROMANS) else str(number),
        "title": title,
        "articleRange": rng,
        "sourceUrl": source,
        "eurLexUrl": gazette,
    }


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {path.name}")


def ranges_from_chapters(chapters: list[dict]) -> list[list[int]]:
    out = []
    for ch in chapters:
        parts = str(ch["articleRange"]).split("-")
        lo = int(parts[0])
        hi = int(parts[-1])
        out.append([lo, hi])
    return out


# ---------------------------------------------------------------------------
# CCPA / CPRA
# ---------------------------------------------------------------------------

CCPA_TITLES = {
    "1798.100": "General Duties of Businesses that Collect Personal Information",
    "1798.105": "Consumers’ Right to Delete Personal Information",
    "1798.106": "Consumers’ Right to Correct Inaccurate Personal Information",
    "1798.110": "Consumers’ Right to Know What Personal Information is Being Collected; Right of Access",
    "1798.115": "Consumers’ Right to Know What Personal Information is Sold or Shared and to Whom",
    "1798.120": "Consumers’ Right to Opt Out of Sale or Sharing of Personal Information",
    "1798.121": "Consumers’ Right to Limit Use and Disclosure of Sensitive Personal Information",
    "1798.125": "Consumers’ Right of No Retaliation Following Opt Out or Exercise of Other Rights",
    "1798.130": "Notice, Disclosure, Correction, and Deletion Requirements",
    "1798.135": "Methods of Limiting Sale, Sharing, and Use of Personal Information and Use of Sensitive Personal Information",
    "1798.140": "Definitions",
    "1798.145": "Exemptions",
    "1798.146": "HIPAA and CMIA exemptions",
    "1798.148": "Gramm-Leach-Bliley and Driver’s Privacy Protection Act exemptions",
    "1798.150": "Personal Information Security Breaches",
    "1798.155": "Administrative Enforcement",
    "1798.160": "Consumer Privacy Fund",
    "1798.175": "Conflicting Provisions",
    "1798.180": "Preemption",
    "1798.185": "Regulations",
    "1798.190": "Anti-Avoidance",
    "1798.192": "Waiver",
    "1798.194": "Liberal construction",
    "1798.196": "Relationship to other California and federal law",
    "1798.198": "Effective date and applicability",
    "1798.199": "California Privacy Protection Agency",
    "1798.199.10": "Agency established; board",
    "1798.199.15": "Board membership and qualifications",
    "1798.199.20": "Chairperson",
    "1798.199.25": "Compensation",
    "1798.199.30": "Quorum and voting",
    "1798.199.35": "Meetings",
    "1798.199.40": "Powers and duties of the Agency",
    "1798.199.45": "Investigations and administrative enforcement",
    "1798.199.50": "Hearings",
    "1798.199.55": "Civil penalties; administrative fines",
    "1798.199.60": "Judicial review",
    "1798.199.65": "Rulemaking",
    "1798.199.70": "Confidentiality of complaints",
    "1798.199.75": "Personnel",
    "1798.199.80": "Budget and funding",
    "1798.199.85": "Annual report",
    "1798.199.90": "Coordination with the Attorney General",
    "1798.199.95": "Limitations period",
    "1798.199.100": "Construction of Agency provisions",
}

CCPA_CHAPTERS_SPEC = [
    ("Consumer rights and business duties", ["1798.100", "1798.105", "1798.106", "1798.110", "1798.115", "1798.120", "1798.121", "1798.125"]),
    ("Notice, disclosure, and opt-out methods", ["1798.130", "1798.135"]),
    ("Definitions", ["1798.140"]),
    ("Exemptions", ["1798.145", "1798.146", "1798.148"]),
    ("Security breaches, administrative enforcement, and the Consumer Privacy Fund", ["1798.150", "1798.155", "1798.160"]),
    ("Construction, preemption, regulations, and anti-avoidance", ["1798.175", "1798.180", "1798.185", "1798.190", "1798.192", "1798.194", "1798.196", "1798.198"]),
    ("California Privacy Protection Agency", None),  # remainder
]


def parse_ccpa(raw: str) -> tuple[list[dict], list[dict], list[dict]]:
    # Skip TOC: body starts at the first standalone "1798.100." after "Page 2 of 65"
    marker = raw.find("Page 2 of 65")
    body = raw[marker:] if marker >= 0 else raw
    # Also skip a second TOC-like block if present
    first = re.search(r"(?m)^1798\.100\.\s+General Duties", body)
    if first:
        body = body[first.start() :]

    # Only Title 1.81.5 sections (1798.100–1798.199.x). Do not match cross-cites such as 1798.81.5.
    pat = re.compile(r"(?m)^(?:Section\s+)?(1798\.1[0-9]{2}(?:\.\d+)?)\.\s*(.*)$")
    hits = list(pat.finditer(body))
    sections: list[tuple[str, str, str]] = []
    seen = set()
    for i, m in enumerate(hits):
        key = m.group(1)
        if key in seen:
            continue
        seen.add(key)
        title_line = (m.group(2) or "").strip()
        start = m.end()
        end = hits[i + 1].start() if i + 1 < len(hits) else len(body)
        text = body[start:end]
        text = re.sub(r"Page \d+ of \d+", " ", text)
        text = collapse(text)
        title = CCPA_TITLES.get(key) or title_line or key
        title = re.sub(r"\s+\.+\s+\d+\s*$", "", title).strip(" .")
        if len(text) < 40:
            continue
        sections.append((key, title, text))

    articles = []
    for i, (key, title, text) in enumerate(sections, start=1):
        articles.append(article(i, title, text, CCPA_CPPA, CCPA_LEGINFO, f"Cal. Civ. Code § {key}"))

    key_to_n = {s[0]: i for i, s in enumerate(sections, start=1)}
    chapters = []
    assigned_nums: set[int] = set()
    nch = 1
    for title, keys in CCPA_CHAPTERS_SPEC:
        if keys is None:
            rest = [n for n in range(1, len(articles) + 1) if n not in assigned_nums]
            if not rest:
                continue
            lo, hi = min(rest), max(rest)
        else:
            nums = [key_to_n[k] for k in keys if k in key_to_n]
            if not nums:
                continue
            lo, hi = min(nums), max(nums)
            assigned_nums.update(range(lo, hi + 1))
        chapters.append(chapter(nch, title, lo, hi, CCPA_CPPA, CCPA_LEGINFO))
        nch += 1

    recitals = [
        recital(
            1,
            "Purpose — notice, purpose limitation, and reasonable security",
            "A business that controls the collection of a consumer’s personal information shall, at or before the point of collection, inform consumers of the categories of personal information to be collected and the purposes for which the categories of personal information are collected or used and whether that information is sold or shared. A business’ collection, use, retention, and sharing of a consumer’s personal information shall be reasonably necessary and proportionate to achieve the purposes for which the personal information was collected or processed. A business that collects a consumer’s personal information shall implement reasonable security procedures and practices appropriate to the nature of the personal information. (Cal. Civ. Code § 1798.100(a), (c), (e).)",
            CCPA_CPPA,
            CCPA_LEGINFO,
        ),
        recital(
            2,
            "Purpose — consumer rights of access, deletion, correction, and opt-out",
            "This title grants California consumers the right to know what personal information is collected, sold, or shared; to delete personal information; to correct inaccurate personal information; to opt out of the sale or sharing of personal information; to limit the use and disclosure of sensitive personal information; and to equal service and price when exercising those rights. (Cal. Civ. Code §§ 1798.105–1798.125.)",
            CCPA_CPPA,
            CCPA_LEGINFO,
        ),
        recital(
            3,
            "Purpose — California Privacy Protection Agency",
            "There is hereby established in state government the California Privacy Protection Agency, which is vested with full administrative power, authority, and jurisdiction to implement and enforce the California Consumer Privacy Act of 2018. The Agency is governed by a five-member board. (Cal. Civ. Code § 1798.199.10 et seq.)",
            CCPA_CPPA,
            CCPA_LEGINFO,
        ),
        recital(
            4,
            "Purpose — statewide floor and preemption of local law",
            "This title is intended to further the constitutional right of privacy and to supplement existing law. This title is a matter of statewide concern and supersedes and preempts all rules, regulations, codes, ordinances, and other laws adopted by a city, county, city and county, municipality, or local agency regarding the collection and sale of consumers’ personal information by a business. (Cal. Civ. Code §§ 1798.175, 1798.180.)",
            CCPA_CPPA,
            CCPA_LEGINFO,
        ),
        recital(
            5,
            "Jurisdiction note — California analogue, not a federal GDPR",
            "The United States has no federal statute equivalent to the EU General Data Protection Regulation. The California Consumer Privacy Act of 2018, as amended by the California Privacy Rights Act of 2020 (Proposition 24) and later session laws, is the most comprehensive in-force U.S. analogue: it is binding California Civil Code (Title 1.81.5) and applies to businesses that meet the statutory thresholds with respect to California residents. Text in this corpus is the CPPA January 2025 compilation of Cal. Civ. Code §§ 1798.100–1798.199.100.",
            CCPA_CPPA_HOME,
            CCPA_LEGINFO,
        ),
    ]
    return recitals, articles, chapters


# ---------------------------------------------------------------------------
# Colorado ADMT (SB 26-189 / C.R.S. 6-1-1701 et seq.)
# ---------------------------------------------------------------------------

CO_ARTICLES_SPEC = [
    ("6-1-1701", "Definitions", r"6-1-1701\.\s*Definitions", r"6-1-1702\."),
    ("6-1-1702", "Developer responsibilities — documentation", r"6-1-1702\.\s*Developer", r"6-1-1703\."),
    ("6-1-1703", "Deployer record keeping", r"6-1-1703\.\s*Deployer record", r"6-1-1704\."),
    (
        "6-1-1704",
        "Deployer disclosures — point-of-interaction notice, public posting, and post-adverse-outcome disclosures",
        r"6-1-1704\.\s*Deployer disclosures",
        r"6-1-1705\.",
    ),
    (
        "6-1-1705",
        "Consumer rights — correction, human review, and reconsideration",
        r"6-1-1705\.\s*Consumer rights",
        r"6-1-1706\.",
    ),
    (
        "6-1-1706",
        "Enforcement by the attorney general — deceptive trade practice, right to cure, no private right of action",
        r"6-1-1706\.\s*Enforcement",
        r"6-1-1707\.",
    ),
    (
        "6-1-1707",
        "Liability — fault allocation; indemnification prohibited",
        r"6-1-1707\.\s*Liability",
        r"6-1-1708\.",
    ),
    (
        "6-1-1708",
        "Compliance with other legal obligations — insurers and covered entities",
        r"6-1-1708\.\s*Compliance",
        r"6-1-1709\.",
    ),
    (
        "6-1-1709",
        "No new private right of action — application of other law",
        r"6-1-1709\.\s*No new private",
        r"SECTION 2\.",
    ),
    (
        "SB26-189 § 2",
        "Unfair or deceptive trade practices — C.R.S. 6-1-105(1)(uuuu)",
        r"SECTION 2\.\s*In Colorado Revised Statutes, 6-1-105",
        r"SECTION 3\.",
    ),
    (
        "SB26-189 § 3",
        "Insurers’ use of external consumer data — C.R.S. 10-3-1104.9(3)(e)",
        r"SECTION 3\.\s*InColoradoRevised Statutes, 10-3-1104\.9|SECTION 3\.\s*In Colorado Revised Statutes, 10-3-1104\.9",
        r"SECTION 4\.",
    ),
    ("SB26-189 § 4", "Appropriation", r"SECTION 4\.\s*Appropriation", r"SECTION 5\."),
    (
        "SB26-189 § 5",
        "Effective date and applicability",
        r"SECTION 5\.\s*Effective date",
        r"SECTION 6\.",
    ),
    (
        "SB26-189 § 6",
        "Safety clause",
        r"SECTION 6\.\s*Safety clause",
        r"\Z",
    ),
]


def parse_admt(raw: str) -> tuple[list[dict], list[dict], list[dict]]:
    articles = []
    for i, (cite, title, start_re, end_re) in enumerate(CO_ARTICLES_SPEC, start=1):
        sm = re.search(start_re, raw, flags=re.I | re.S)
        if not sm:
            print(f"WARN: ADMT missing start {cite}")
            continue
        em = re.search(end_re, raw[sm.end() :], flags=re.I | re.S)
        chunk = raw[sm.start() : sm.end() + (em.start() if em else 0)]
        text = clean_co(chunk)
        # Drop the heading echo
        text = re.sub(r"^6-1-170\d\.\s*[^.]*\.\s*", "", text, count=1)
        articles.append(article(i, title, text, CO_SESSION, CO_BILL, f"C.R.S. {cite}" if cite.startswith("6-1") else cite))

    chapters = [
        chapter(1, "Definitions", 1, 1, CO_SESSION, CO_BILL),
        chapter(2, "Developer and deployer duties", 2, 3, CO_SESSION, CO_BILL),
        chapter(3, "Deployer disclosures", 4, 4, CO_SESSION, CO_BILL),
        chapter(4, "Consumer rights", 5, 5, CO_SESSION, CO_BILL),
        chapter(5, "Enforcement and allocation of fault", 6, 7, CO_SESSION, CO_BILL),
        chapter(6, "Compliance with other legal obligations", 8, 9, CO_SESSION, CO_BILL),
        chapter(7, "Conforming amendments, appropriation, and effective date", 10, 14, CO_SESSION, CO_BILL),
    ]

    recitals = [
        recital(
            1,
            "Long title",
            "Concerning the use of automated decision-making technology in consequential decisions, and, in connection therewith, making an appropriation. Be it enacted by the General Assembly of the State of Colorado.",
            CO_SESSION,
            CO_BILL,
        ),
        recital(
            2,
            "Legislative declaration — post-adverse-outcome disclosures",
            "The General Assembly finds that the specific content and format of post-adverse outcome disclosures may vary across consequential decision domains. The General Assembly intends that the specific elements of post-adverse outcome disclosures be further clarified through rule-making that accounts for sector-specific practices while ensuring that consumers receive meaningful and understandable information about consequential decisions. On or before January 1, 2027, the Attorney General shall adopt rules to clarify and implement the post-adverse outcome disclosure requirements. (C.R.S. 6-1-1704(4).)",
            CO_SESSION,
            CO_BILL,
        ),
        recital(
            3,
            "Effective date — consequential decisions on or after 1 January 2027",
            "Except as otherwise provided, this act takes effect January 1, 2027. Rulemaking authorities in C.R.S. 6-1-1704(4), 6-1-1705(3), and 6-1-1706(6), the insurance conforming amendment, the appropriation, the effective-date section, and the safety clause take effect upon passage. This act applies to consequential decisions made on or after January 1, 2027. Approved: May 14, 2026. (SB 26-189 §§ 5–6; 2026 Colo. Sess. Laws ch. 131.)",
            CO_SESSION,
            CO_BILL,
        ),
        recital(
            4,
            "Safety clause",
            "The general assembly finds, determines, and declares that this act is necessary for the immediate preservation of the public peace, health, or safety or for appropriations for the support and maintenance of the departments of the state and state institutions.",
            CO_SESSION,
            CO_BILL,
        ),
        recital(
            5,
            "Jurisdiction note — Colorado analogue, not a federal AI Act",
            "The United States has no federal statute equivalent to the EU Artificial Intelligence Act. Senate Bill 24-205 (the 2024 Colorado AI Act) was delayed and then repealed and reenacted by Senate Bill 26-189, signed 14 May 2026 as 2026 Colorado Session Laws Chapter 131. The in-force analogue in this workspace is C.R.S. part 17 of article 1 of title 6 (Automated Decision-Making Technology in Consequential Decisions), with developer and deployer duties generally applicable from 1 January 2027.",
            CO_BILL,
            CO_AG,
        ),
    ]
    return recitals, articles, chapters


# ---------------------------------------------------------------------------
# OPEN Government Data Act (Title II of P.L. 115-435)
# ---------------------------------------------------------------------------

def _open_chunk(raw: str, start: str, end: str | None) -> str:
    sm = re.search(start, raw, flags=re.I | re.S)
    if not sm:
        return ""
    if not end:
        return raw[sm.start() :]
    em = re.search(end, raw[sm.end() :], flags=re.I | re.S)
    return raw[sm.start() : sm.end() + (em.start() if em else 0)]


def parse_open(raw: str) -> tuple[list[dict], list[dict], list[dict]]:
    # Skip the table of contents: enacted Title II starts with the USC note marker.
    t2_start = raw.find("TITLE II--OPEN <<NOTE")
    if t2_start < 0:
        t2_start = raw.find("SEC. 201. SHORT TITLE")
    t3 = raw.find("TITLE III--CONFIDENTIAL", t2_start + 20)
    t2 = raw[t2_start : t3 if t3 > t2_start else None]
    t4_start = raw.find("SEC. 401.")
    t4 = raw[t4_start:] if t4_start >= 0 else ""

    specs = [
        (
            1,
            "Sec. 201 — Short title",
            r"SEC\.\s*201\.\s*SHORT TITLE",
            r"SEC\.\s*202\.",
            'This title may be cited as the "Open, Public, Electronic, and Necessary Government Data Act" or the "OPEN Government Data Act".',
        ),
        (
            2,
            "Sec. 202(a) — Definitions (44 U.S.C. § 3502)",
            r"\(a\)\s*Definitions\.--Section 3502 of title 44",
            r"\(b\)\s*Guidance to Make Data Open by Default",
            "",
        ),
        (
            3,
            "Sec. 202(b) — OMB guidance to make data open by default (44 U.S.C. § 3504)",
            r"\(b\)\s*Guidance to Make Data Open by Default",
            r"\(c\)\s*Federal Agency Responsibilities to Make Data Open by Default",
            "",
        ),
        (
            4,
            "Sec. 202(c) — Agency responsibilities to make data open by default (44 U.S.C. § 3506)",
            r"\(c\)\s*Federal Agency Responsibilities to Make Data Open by Default",
            r"\(d\)\s*Data Inventory and Federal Data Catalogue",
            "",
        ),
        (
            5,
            "Sec. 202(d) — Data inventory and Federal data catalogue (44 U.S.C. § 3511)",
            r"\(d\)\s*Data Inventory and Federal Data Catalogue",
            r"\(e\)\s*Chief Data Officers",
            "",
        ),
        (
            6,
            "Sec. 202(e) — Chief Data Officers (44 U.S.C. § 3520)",
            r"\(e\)\s*Chief Data Officers",
            r"\(f\)\s*Chief Data Officer Council",
            "",
        ),
        (
            7,
            "Sec. 202(f) — Chief Data Officer Council (44 U.S.C. § 3520A)",
            r"\(f\)\s*Chief Data Officer Council",
            r"\(g\)\s*Reports",
            "",
        ),
        (
            8,
            "Sec. 202(g) — Reports",
            r"\(g\)\s*Reports",
            r"\Z",
            "",
        ),
        (
            9,
            "P.L. 115-435 Title IV — Rule of construction and existing resources",
            r"SEC\.\s*401\.",
            r"SEC\.\s*403\.",
            "",
        ),
        (
            10,
            "P.L. 115-435 Title IV — Effective date",
            r"SEC\.\s*403\.",
            r"\Z",
            "",
        ),
    ]

    articles = []
    for number, title, start, end, fallback in specs:
        use_src = t4 if "Title IV" in title else t2
        chunk = _open_chunk(use_src, start, end)
        text = clean_govinfo(chunk) if chunk else fallback
        if len(text) < 80 and fallback:
            text = fallback
        if len(text) < 80:
            print(f"WARN: OPEN article {number} short ({len(text)} chars)")
            if len(text) < 20:
                continue
        articles.append(article(number, title, text, OPEN_GOVINFO, OPEN_CONGRESS))
    for i, a in enumerate(articles, start=1):
        a["number"] = i
    n = len(articles)

    title_iv_start = n - 1 if n >= 2 else n
    chapters = [
        chapter(1, "Short title", 1, 1, OPEN_GOVINFO, OPEN_CONGRESS),
        chapter(2, "Definitions", 2, min(2, n), OPEN_GOVINFO, OPEN_CONGRESS),
        chapter(3, "OMB and agency open-data duties", 3, min(4, n), OPEN_GOVINFO, OPEN_CONGRESS),
        chapter(4, "Federal data catalogue, Chief Data Officers, and reports", 5, max(5, title_iv_start - 1), OPEN_GOVINFO, OPEN_CONGRESS),
        chapter(5, "General provisions and effective date", title_iv_start, n, OPEN_GOVINFO, OPEN_CONGRESS),
    ]
    chapters = [c for c in chapters if int(str(c["articleRange"]).split("-")[0]) <= n]

    recitals = [
        recital(
            1,
            "Public Law 115-435 — purpose",
            "An Act to amend titles 5 and 44, United States Code, to require Federal evaluation activities, improve Federal data management, and for other purposes. This Act may be cited as the \"Foundations for Evidence-Based Policymaking Act of 2018\". Title II may be cited as the \"Open, Public, Electronic, and Necessary Government Data Act\" or the \"OPEN Government Data Act\". (Pub. L. 115-435, Jan. 14, 2019, 132 Stat. 5529.)",
            OPEN_GOVINFO,
            OPEN_CONGRESS,
        ),
        recital(
            2,
            "Open Government data asset — default public and machine-readable",
            "The OPEN Government Data Act amends 44 U.S.C. chapter 35 to define an \"open Government data asset\" as a public data asset that is machine-readable and available (or could be made available) in an open format, under an open license, and as part of the worldwide public domain or, if necessary, under a license that places no restrictions on copying, publication, distribution, citation, or reuse, other than a requirement that credit be given. Agency public data assets are to be published as open Government data assets by default, with enumerated exceptions. (44 U.S.C. §§ 3502, 3506, as amended by Pub. L. 115-435 title II.)",
            OPEN_GOVINFO,
            OPEN_CONGRESS,
        ),
        recital(
            3,
            "Federal data catalogue",
            "The Administrator of General Services shall maintain a single public interface online as a point of entry dedicated to sharing agency data assets with the public, which shall be known as the \"Federal data catalogue\". Agency heads must maintain a comprehensive data inventory and submit public data assets, or links to them, as open Government data assets for inclusion in that catalogue. (44 U.S.C. § 3511, as amended by Pub. L. 115-435 title II.) The public interface is operated as data.gov.",
            OPEN_GOVINFO,
            OPEN_DATAGOV,
        ),
        recital(
            4,
            "Jurisdiction note — public-sector open data, not the 2014 DATA Act",
            "The Digital Accountability and Transparency Act of 2014 (Pub. L. 113-101), commonly called the DATA Act, is a federal spending-transparency statute. It is a false friend for the EU Data Act (Regulation (EU) 2023/2854). The closest in-force U.S. analogue for public-sector open data, inventories, machine-readable formats, and a national data portal is Title II of the Foundations for Evidence-Based Policymaking Act of 2018 — the OPEN Government Data Act — codified principally at 44 U.S.C. §§ 3502, 3504, 3506, and 3511. The United States has no federal private-sector IoT/cloud-switching statute equivalent to the EU Data Act.",
            OPEN_GOVINFO,
            OPEN_DATAGOV,
        ),
    ]
    return recitals, articles, chapters


def wrap_structure(
    regulation_id: str,
    sources: list[dict],
    categories: list[dict],
    chapters: list[dict],
    recitals_desc: str,
    chapters_desc: str,
) -> dict:
    return {
        "meta": {
            "lastRefreshed": None,
            "sources": sources,
        },
        "categories": categories,
        "chapters": chapters,
        "articles": [],
        "recitals": [],
        "searchIndex": [],
        "regulation": {"id": regulation_id},
    }


def wrap_content(
    regulation_id: str,
    structure: dict,
    recitals: list[dict],
    articles: list[dict],
    extracted_from: str,
) -> dict:
    out = dict(structure)
    out["recitals"] = recitals
    out["articles"] = articles
    out["meta"] = {
        **structure.get("meta", {}),
        "regulationId": regulation_id,
        "lastChecked": NOW,
        "lastRefreshed": NOW,
        "etl": {
            "extractedFrom": extracted_from,
            "fetched": False,
            "significant": True,
            "articleCount": len(articles),
            "recitalCount": len(recitals),
        },
    }
    return out


def wrap_summaries(regulation_id: str, summaries: dict) -> dict:
    return {
        "regulationId": regulation_id,
        "source": "inline-fallback",
        "llm": False,
        "generatedAt": NOW,
        "summaries": {str(k): v for k, v in summaries.items()},
    }


def main() -> None:
    ccpa_raw = (TMP / "ccpa-cppa-jan2025.txt").read_text(encoding="utf-8", errors="replace")
    admt_raw = (TMP / "colorado-sb26-189-ch131.txt").read_text(encoding="utf-8", errors="replace")
    open_raw = (TMP / "pl115-435-open-data.txt").read_text(encoding="utf-8", errors="replace")

    ccpa_rec, ccpa_art, ccpa_ch = parse_ccpa(ccpa_raw)
    admt_rec, admt_art, admt_ch = parse_admt(admt_raw)
    open_rec, open_art, open_ch = parse_open(open_raw)

    ccpa_sources = [
        {
            "name": "California Privacy Protection Agency",
            "url": CCPA_CPPA,
            "description": "Unofficial compilation of the California Consumer Privacy Act of 2018 as amended (Cal. Civ. Code Title 1.81.5), posted January 2025 after SB 1223, AB 1008, and AB 1824.",
            "documents": [
                {"label": "CCPA text (CPPA PDF, Jan 2025)", "url": CCPA_CPPA},
                {"label": "CPPA home", "url": CCPA_CPPA_HOME},
            ],
        },
        {
            "name": "California Legislative Information (leginfo)",
            "url": CCPA_LEGINFO,
            "description": "Official California Civil Code Title 1.81.5 (CCPA/CPRA) as maintained by the Legislative Counsel.",
            "documents": [{"label": "Cal. Civ. Code Title 1.81.5", "url": CCPA_LEGINFO}],
        },
        {
            "name": "California Department of Justice — Office of the Attorney General",
            "url": CCPA_OAG,
            "description": "Attorney General CCPA landing page (consumer and business guidance; enforcement alongside the CPPA).",
            "documents": [{"label": "OAG CCPA page", "url": CCPA_OAG}],
        },
    ]
    admt_sources = [
        {
            "name": "Colorado General Assembly — SB26-189 (became law)",
            "url": CO_BILL,
            "description": "Official bill page for Senate Bill 26-189, Automated Decision-Making Technology; signed 14 May 2026.",
            "documents": [
                {"label": "SB26-189 bill page", "url": CO_BILL},
                {"label": "2026 Session Laws ch. 131 (download)", "url": CO_SESSION},
            ],
        },
        {
            "name": "Colorado General Assembly — Session Laws Chapter 131",
            "url": CO_SESSION,
            "description": "Enrolled session-law text of SB 26-189 as approved 14 May 2026 (C.R.S. 6-1-1701 et seq.).",
            "documents": [{"label": "Chapter 131 PDF/HTML", "url": CO_SESSION}],
        },
        {
            "name": "Colorado Attorney General — AI / ADMT",
            "url": CO_AG,
            "description": "Colorado Department of Law page on artificial intelligence and automated decision-making technology (rulemaking and enforcement).",
            "documents": [{"label": "coag.gov/ai", "url": CO_AG}],
        },
    ]
    open_sources = [
        {
            "name": "U.S. Government Publishing Office (govinfo)",
            "url": OPEN_GOVINFO,
            "description": "Official HTML of Public Law 115-435, Foundations for Evidence-Based Policymaking Act of 2018, including Title II (OPEN Government Data Act).",
            "documents": [
                {"label": "P.L. 115-435 HTML", "url": OPEN_GOVINFO},
                {"label": "P.L. 115-435 PDF (Congress.gov)", "url": OPEN_CONGRESS},
            ],
        },
        {
            "name": "data.gov — Federal data catalogue",
            "url": OPEN_DATAGOV,
            "description": "Public interface maintained under 44 U.S.C. § 3511 as the Federal data catalogue.",
            "documents": [{"label": "data.gov", "url": OPEN_DATAGOV}],
        },
        {
            "name": "U.S. General Services Administration",
            "url": OPEN_GSA,
            "description": "GSA administers the Federal data catalogue interface required by the OPEN Government Data Act.",
            "documents": [{"label": "GSA IT policy", "url": OPEN_GSA}],
        },
    ]

    ccpa_struct = wrap_structure(
        "us-ccpa",
        ccpa_sources,
        [
            {
                "id": "recitals",
                "title": "Purpose and jurisdiction notes",
                "description": "Statutory purpose excerpts from Cal. Civ. Code Title 1.81.5 and a jurisdiction note that the United States has no federal GDPR.",
                "sourceUrl": CCPA_CPPA,
                "eurLexUrl": CCPA_LEGINFO,
            },
            {
                "id": "chapters",
                "title": "Civil Code sections",
                "description": "Cal. Civ. Code §§ 1798.100–1798.199.100, grouped for Browse.",
                "sourceUrl": CCPA_CPPA,
                "eurLexUrl": CCPA_LEGINFO,
            },
        ],
        ccpa_ch,
        "",
        "",
    )
    admt_struct = wrap_structure(
        "us-admt",
        admt_sources,
        [
            {
                "id": "recitals",
                "title": "Purpose and jurisdiction notes",
                "description": "Long title, legislative declaration, effective-date clause, safety clause, and a jurisdiction note that the United States has no federal AI Act.",
                "sourceUrl": CO_SESSION,
                "eurLexUrl": CO_BILL,
            },
            {
                "id": "chapters",
                "title": "C.R.S. part 17 and bill sections",
                "description": "C.R.S. 6-1-1701 through 6-1-1709 plus SB 26-189 §§ 2–6.",
                "sourceUrl": CO_SESSION,
                "eurLexUrl": CO_BILL,
            },
        ],
        admt_ch,
        "",
        "",
    )
    open_struct = wrap_structure(
        "us-open-data",
        open_sources,
        [
            {
                "id": "recitals",
                "title": "Purpose and jurisdiction notes",
                "description": "P.L. 115-435 purpose, open-data-asset default, Federal data catalogue, and a jurisdiction note distinguishing the 2014 DATA Act.",
                "sourceUrl": OPEN_GOVINFO,
                "eurLexUrl": OPEN_CONGRESS,
            },
            {
                "id": "chapters",
                "title": "Title II and general provisions",
                "description": "OPEN Government Data Act (Title II) plus Title IV clauses that govern construction and effective date.",
                "sourceUrl": OPEN_GOVINFO,
                "eurLexUrl": OPEN_CONGRESS,
            },
        ],
        open_ch,
        "",
        "",
    )

    write_json(DATA / "us-ccpa-structure.json", ccpa_struct)
    write_json(DATA / "us-admt-structure.json", admt_struct)
    write_json(DATA / "us-open-data-structure.json", open_struct)
    write_json(
        DATA / "us-ccpa-content.json",
        wrap_content("us-ccpa", ccpa_struct, ccpa_rec, ccpa_art, "cppa-jan2025-compilation"),
    )
    write_json(
        DATA / "us-admt-content.json",
        wrap_content("us-admt", admt_struct, admt_rec, admt_art, "colo-sess-laws-2026-ch131"),
    )
    write_json(
        DATA / "us-open-data-content.json",
        wrap_content("us-open-data", open_struct, open_rec, open_art, "govinfo-plaw-115publ435"),
    )

    write_json(
        DATA / "chapter-summaries-us-ccpa.json",
        wrap_summaries(
            "us-ccpa",
            {
                1: "Consumer rights and general business duties: notice at collection, purpose limitation, reasonable security, deletion, correction, access, sale/share disclosure, opt-out, limit on sensitive PI, and non-retaliation (Cal. Civ. Code §§ 1798.100–1798.125).",
                2: "Operational methods: 12-month lookback notices, verifiable consumer requests, service-provider contracts, and required opt-out / limit-use links and mechanisms (§§ 1798.130–1798.135).",
                3: "Definitions that drive the statute, including business, consumer, personal information, sensitive personal information, sale, share, service provider, contractor, and dark patterns (§ 1798.140).",
                4: "Exemptions, including HIPAA/CMIA, Gramm-Leach-Bliley, and the Driver’s Privacy Protection Act, plus other enumerated carve-outs (§§ 1798.145–1798.148).",
                5: "Private right of action for certain security breaches, CPPA/AG administrative enforcement, and the Consumer Privacy Fund (§§ 1798.150–1798.160).",
                6: "Liberal construction, statewide preemption of local privacy ordinances, CPPA rulemaking, anti-avoidance, and non-waiver (§§ 1798.175–1798.198).",
                7: "California Privacy Protection Agency: five-member board, investigative and administrative powers, penalties, and coordination with the Attorney General (§§ 1798.199–1798.199.100).",
            },
        ),
    )
    write_json(
        DATA / "chapter-summaries-us-admt.json",
        wrap_summaries(
            "us-admt",
            {
                1: "Definitions of ADMT, covered ADMT, consequential decision, covered domain, developer, deployer, materially influence, meaningful human review, and related terms (C.R.S. 6-1-1701).",
                2: "Developer documentation and material-update notices to deployers, plus deployer three-year recordkeeping (C.R.S. 6-1-1702–1703), generally from 1 January 2027.",
                3: "Point-of-interaction notice, optional public posting, 30-day post-adverse-outcome disclosures, Attorney General rulemaking, FERPA and ECOA interaction, accessibility (C.R.S. 6-1-1704).",
                4: "Consumer rights to correct inaccurate personal data used in a covered ADMT decision and to request meaningful human review and reconsideration (C.R.S. 6-1-1705).",
                5: "Attorney General exclusive enforcement as a deceptive trade practice, 60-day cure until 2030, no new private right of action, and relative-fault allocation between developers and deployers with void indemnities (C.R.S. 6-1-1706–1707).",
                6: "Insurance, HIPAA covered-entity, FDA device, and GLBA interaction rules; restatement that the part creates no new private right of action (C.R.S. 6-1-1708–1709).",
                7: "Conforming CCPA-style deceptive-trade listing, Division of Insurance rule authority, FY 2026–27 appropriation, 1 January 2027 applicability, and the safety clause (SB 26-189 §§ 2–6).",
            },
        ),
    )
    write_json(
        DATA / "chapter-summaries-us-open-data.json",
        wrap_summaries(
            "us-open-data",
            {
                1: "Title II short title: Open, Public, Electronic, and Necessary Government Data Act (OPEN Government Data Act).",
                2: "New and amended 44 U.S.C. § 3502 definitions, including data, data asset, machine-readable, metadata, open Government data asset, open license, and public data asset.",
                3: "OMB Director duties to issue open-data standards and guidance, and agency CIO/information-resources duties to collect and publish data as open Government data assets by default (44 U.S.C. §§ 3504, 3506).",
                4: "Agency comprehensive data inventories and GSA’s Federal data catalogue (data.gov) under 44 U.S.C. § 3511, agency Chief Data Officers and the CDO Council, plus reporting.",
                5: "P.L. 115-435 Title IV: rule of construction, use of existing resources, and delayed effective date (generally 180 days after enactment of 14 January 2019).",
            },
        ),
    )

    print(
        json.dumps(
            {
                "us-ccpa": {"articles": len(ccpa_art), "recitals": len(ccpa_rec), "chapters": len(ccpa_ch)},
                "us-admt": {"articles": len(admt_art), "recitals": len(admt_rec), "chapters": len(admt_ch)},
                "us-open-data": {"articles": len(open_art), "recitals": len(open_rec), "chapters": len(open_ch)},
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
