/**
 * Build copyright-safe International analogue corpora from ISO.org catalogue abstracts,
 * Harmonized Structure (Annex SL) clause titles, ISO 31000 overlay titles, and AICPA
 * Trust Services Criteria *category / criterion names* only.
 *
 * Does NOT copy paywalled ISO clause text, iteh.ai samples, or AICPA Points of Focus tables.
 * Educational purpose notes and clause maps are original to this product.
 *
 * Run: node scripts/build-iso-soc-corpora.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const { buildSearchIndex, computeDatasetHash } = require('../scraper');
const { getRegulation, getRegulationPaths, enrichArticlesWithChapter, INTL_REGULATION_IDS } = require('../lib/regulations');
const { normalizeCorpus } = require('../document-formatting-guardrails');

const NOW = new Date().toISOString();
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function chapter(number, title, articleRange, sourceUrl) {
  return {
    number,
    roman: ROMAN[number - 1] || String(number),
    title,
    articleRange,
    sourceUrl,
    eurLexUrl: sourceUrl
  };
}

function recital(number, title, text, sourceUrl) {
  return { number, title, text, sourceUrl, eurLexUrl: sourceUrl };
}

function article(number, title, text, sourceUrl) {
  return { number, title, text, sourceUrl, eurLexUrl: sourceUrl, gdprInfoUrl: sourceUrl };
}

function writeCorpus(id, { sources, categories, chapters, recitals, articles, extractedFrom, chapterSummaries }) {
  const reg = getRegulation(id);
  const paths = getRegulationPaths(id);
  const arts = enrichArticlesWithChapter(articles, reg.chapterRanges);
  const norm = normalizeCorpus(recitals, arts);
  const searchIndex = buildSearchIndex(norm.recitals, norm.articles, chapters, {
    recitalsIndexUrl: reg.recitalsIndexUrl || reg.infoBaseUrl,
    eurLexTxtUrl: reg.eurLexTxtUrl || reg.eurLexUrl
  });
  const datasetHash = computeDatasetHash(norm.recitals, norm.articles);
  const meta = {
    lastRefreshed: NOW,
    sources,
    regulationId: id,
    lastChecked: NOW,
    datasetHash,
    etl: {
      extractedFrom,
      fetched: false,
      significant: true,
      datasetHash,
      articleCount: norm.articles.length,
      recitalCount: norm.recitals.length,
      copyrightNote:
        'Educational overlay from public catalogue abstracts and publicly listed clause/criterion titles. Not the paid ISO or AICPA standard text.'
    }
  };
  const structure = { meta: { lastRefreshed: null, sources }, categories, chapters };
  const content = {
    ...structure,
    meta,
    recitals: norm.recitals,
    articles: norm.articles,
    searchIndex
  };
  fs.writeFileSync(paths.structureFile, JSON.stringify(structure, null, 2) + '\n', 'utf8');
  fs.writeFileSync(paths.contentFile, JSON.stringify(content, null, 2) + '\n', 'utf8');
  const summaries = {
    regulationId: id,
    source: 'inline-fallback',
    llm: false,
    generatedAt: NOW,
    summaries: chapterSummaries
  };
  fs.writeFileSync(paths.chapterSummariesFile, JSON.stringify(summaries, null, 2) + '\n', 'utf8');
  console.log(
    `Wrote ${id}: articles=${norm.articles.length} recitals=${norm.recitals.length} chapters=${chapters.length}`
  );
}

const ISO_27701 = 'https://www.iso.org/standard/27701';
const ISO_19941 = 'https://www.iso.org/standard/66639.html';
const ISO_23894 = 'https://www.iso.org/standard/77304.html';
const ISO_42001 = 'https://www.iso.org/standard/81230.html';
const ISO_31000 = 'https://www.iso.org/standard/65694.html';
const AICPA_TSC =
  'https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022';
const AICPA_SOC =
  'https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-for-service-organizations';

function buildIso27701() {
  const sources = [
    {
      name: 'ISO — ISO/IEC 27701:2025 catalogue',
      url: ISO_27701,
      description:
        'Official ISO.org catalogue for ISO/IEC 27701:2025 (2nd edition, published 14 October 2025): Privacy information management systems — Requirements and guidance. JTC 1/SC 27; 64 pages; ICS 35.030.',
      documents: [
        { label: 'ISO.org catalogue (ISO/IEC 27701:2025)', url: ISO_27701 },
        { label: 'ISO webstore', url: 'https://www.iso.org/standard/27701.html' }
      ]
    },
    {
      name: 'ISO/IEC JTC 1/SC 27',
      url: 'https://www.iso.org/committee/45306.html',
      description:
        'ISO/IEC joint technical committee for information security, cybersecurity and privacy protection — the committee that developed ISO/IEC 27701.',
      documents: [{ label: 'SC 27 committee page', url: 'https://www.iso.org/committee/45306.html' }]
    }
  ];
  const chapters = [
    chapter(1, 'Scope, references, and terms', '1–3', ISO_27701),
    chapter(2, 'Privacy information management system (clauses 4–10)', '4–10', ISO_27701),
    chapter(3, 'PII controller and processor roles', '11–12', ISO_27701),
    chapter(4, 'Relationship to ISO/IEC 27001 and privacy law', '13–14', ISO_27701)
  ];
  const recitals = [
    recital(
      1,
      'Voluntary international standard, not a law',
      'ISO/IEC 27701:2025 is a voluntary International Standard published by ISO and IEC. It is not a statute, regulation, or court judgment. An organization may choose to implement a Privacy Information Management System (PIMS) and, where a certification scheme exists, seek independent certification. Certification is not the same as legal compliance with the EU GDPR or any other privacy law. Buy the full text from ISO if you need the normative requirements.',
      ISO_27701
    ),
    recital(
      2,
      '2025 edition is a standalone PIMS; 2019 is withdrawn',
      'The ISO.org catalogue lists ISO/IEC 27701:2025 as Edition 2, published 14 October 2025 (stage 60.60), 64 pages, committee ISO/IEC JTC 1/SC 27. The 2019 edition is withdrawn. ISO.org states that the 2025 document is an independent management system standard (MSS): it can be used alone and remains compatible with ISO/IEC 27001. The 2019 edition was commonly implemented as an extension to an ISMS; that dependency is no longer required.',
      ISO_27701
    ),
    recital(
      3,
      'Closest international analogue to the EU GDPR — not a GDPR substitute',
      'This workspace maps ISO/IEC 27701 to the EU GDPR because ISO.org publicly describes the standard as helping organizations demonstrate compliance with global privacy regulations such as the GDPR, and because it addresses PII controllers and PII processors. That mapping is analogical. ISO/IEC 27701 does not copy GDPR articles, does not create data-subject rights, and does not appoint a supervisory authority. Use the GDPR instrument in this app for Regulation (EU) 2016/679.',
      ISO_27701
    ),
    recital(
      4,
      'Copyright: educational overlay only',
      'ISO owns the copyright in ISO/IEC 27701. This corpus is an original educational overlay: public catalogue facts, Harmonized Structure (Annex SL) clause titles that ISO publishes for management-system standards, and original summaries. It is not the paid standard and must not be treated as a substitute for purchasing ISO/IEC 27701:2025.',
      ISO_27701
    ),
    recital(
      5,
      'What a PIMS is (ISO.org public FAQ)',
      'ISO.org’s public FAQ for ISO/IEC 27701 describes a privacy information management system (PIMS) as a structured framework for managing personally identifiable information (PII) responsibly and in line with privacy laws and standards. The catalogue page states the document specifies requirements for establishing, implementing, maintaining and continually improving a PIMS, with guidance to assist implementation, for PII controllers and PII processors holding responsibility and accountability for PII processing, applicable to organizations of all types and sizes.',
      ISO_27701
    )
  ];
  const articles = [
    article(
      1,
      'Clause 1 — Scope (catalogue abstract)',
      'Public ISO.org abstract: ISO/IEC 27701 specifies requirements for establishing, implementing, maintaining and continually improving a privacy information management system (PIMS). Guidance is also provided to assist implementation. The document is intended for personally identifiable information (PII) controllers and PII processors holding responsibility and accountability for PII processing. It is applicable to all types and sizes of organizations, including public and private companies, government entities and not-for-profit organizations. This clause map is educational; the paid standard contains the full normative scope.',
      ISO_27701
    ),
    article(
      2,
      'Clause 2 — Normative references',
      'As a Harmonized Structure management-system standard, ISO/IEC 27701:2025 includes a normative-references clause. ISO.org states the 2025 edition can be used alone and still aligns with existing ISO/IEC 27001 systems. Organizations that already run an information security management system (ISMS) can integrate PIMS processes; organizations without ISO/IEC 27001 can still implement a standalone PIMS. Always check the purchased document for the exact dated references.',
      ISO_27701
    ),
    article(
      3,
      'Clause 3 — Terms and definitions (PII controller and processor)',
      'ISO.org’s public page distinguishes PII controllers and PII processors as the parties that hold responsibility and accountability for processing personally identifiable information. In this educational overlay: a PII controller determines purposes and means of PII processing; a PII processor processes PII on behalf of a controller. These roles are analogous to GDPR controller/processor concepts but are defined inside the ISO/IEC vocabulary, not inside Regulation (EU) 2016/679. Confirm defined terms in the purchased standard and in ISO/IEC 29100 where referenced.',
      ISO_27701
    ),
    article(
      4,
      'Clause 4 — Context of the organization',
      'Harmonized Structure clause 4 (public MSS title: Context of the organization) typically requires the organization to determine internal and external issues, interested parties, and the scope of the management system. For a PIMS, that context includes privacy expectations of individuals whose PII is processed, applicable privacy law (for example the GDPR, CCPA, or UU PDP — none of which this standard replaces), contractual processor duties, and the relationship to any existing ISMS. Educational map only.',
      ISO_27701
    ),
    article(
      5,
      'Clause 5 — Leadership',
      'Harmonized Structure clause 5 (Leadership) typically requires top-management commitment, a privacy policy, and assignment of roles. ISO.org lists “facilitates accountability and evidence-based privacy management” among public benefits of ISO/IEC 27701. In a PIMS, leadership is expected to direct privacy objectives, provide resources, and remain accountable for PII processing whether the organization acts as controller, processor, or both.',
      ISO_27701
    ),
    article(
      6,
      'Clause 6 — Planning',
      'Harmonized Structure clause 6 (Planning) typically covers actions to address risks and opportunities, management-system objectives, and planning of changes. For a PIMS, planning includes privacy-risk identification for PII processing, treating those risks, and setting measurable privacy objectives. ISO.org notes the standard helps organizations manage risks around personally identifiable information. This is a management-system planning clause, not a GDPR data-protection impact assessment article.',
      ISO_27701
    ),
    article(
      7,
      'Clause 7 — Support',
      'Harmonized Structure clause 7 (Support) typically covers resources, competence, awareness, communication, and documented information. A PIMS needs people who understand PII handling, awareness of privacy policy, internal and external communication about privacy, and controlled documented information (policies, records of processing activities analogue, processor contracts analogue). Educational overlay — buy the standard for normative shall-statements.',
      ISO_27701
    ),
    article(
      8,
      'Clause 8 — Operation',
      'Harmonized Structure clause 8 (Operation) typically requires operational planning and control of the processes needed to meet management-system requirements. For a PIMS this is where day-to-day PII processing controls live: collection, use, storage, sharing, retention, deletion, and processor oversight. ISO.org’s public benefits include strengthening data privacy and protection capabilities. Operation is not an EU GDPR Chapter III rights catalogue.',
      ISO_27701
    ),
    article(
      9,
      'Clause 9 — Performance evaluation',
      'Harmonized Structure clause 9 (Performance evaluation) typically covers monitoring, measurement, analysis, evaluation, internal audit, and management review. A PIMS uses these activities to check whether privacy objectives and PII controls work, and to present evidence to leadership and (where used) certification bodies. Evidence-based privacy management is listed on ISO.org as a public benefit of ISO/IEC 27701.',
      ISO_27701
    ),
    article(
      10,
      'Clause 10 — Improvement',
      'Harmonized Structure clause 10 (Improvement) typically covers nonconformity, corrective action, and continual improvement. When a PII incident, audit finding, or complaint shows the PIMS is not effective, the organization is expected to correct the issue and improve the system. ISO.org describes the document as covering establishing, implementing, maintaining and continually improving a PIMS.',
      ISO_27701
    ),
    article(
      11,
      'PII controller responsibilities (educational map)',
      'ISO.org states the standard is intended for PII controllers (and processors) that hold responsibility and accountability for PII processing. In this educational map, controller-side PIMS activities typically include determining processing purposes, implementing privacy by design in the organization’s own processing, handling individual requests according to applicable law, and instructing processors. This overlay does not reproduce ISO annexes. Legal rights of individuals still come from the applicable statute (for example GDPR), not from ISO/IEC 27701.',
      ISO_27701
    ),
    article(
      12,
      'PII processor responsibilities (educational map)',
      'ISO.org also addresses PII processors. In this educational map, processor-side PIMS activities typically include processing only on documented instructions, implementing agreed security and privacy controls, assisting the controller, and not using PII for the processor’s own purposes unless allowed. This is analogous to GDPR Article 28 themes but is a management-system role split, not a statutory contract clause. Confirm processor annexes in the purchased 2025 text.',
      ISO_27701
    ),
    article(
      13,
      'Relationship to ISO/IEC 27001',
      'ISO.org states ISO/IEC 27701 aligns with existing ISO/IEC 27001 systems to streamline implementation, and that the 2025 edition can be used alone as an independent MSS. Organizations may run a combined ISMS+PIMS or a standalone PIMS. Information security (confidentiality, integrity, availability of information) is related to, but not the same as, privacy management of PII. Do not treat ISO/IEC 27001 certification as GDPR compliance, and do not treat ISO/IEC 27701 certification as a legal adequacy decision.',
      ISO_27701
    ),
    article(
      14,
      'Relationship to GDPR and other privacy law',
      'ISO.org publicly lists among benefits: “Helps demonstrate compliance with global privacy regulations such as GDPR.” Demonstration is not equivalence. A PIMS can produce policies, risk records, and audit evidence that a GDPR programme also needs (accountability, security of processing, processor oversight). It does not grant or limit data-subject rights, set administrative fines, or replace a supervisory authority. Use this instrument for the international PIMS analogue; use the GDPR instrument for Regulation (EU) 2016/679.',
      ISO_27701
    )
  ];
  writeCorpus('iso-27701', {
    sources,
    categories: [
      {
        id: 'recitals',
        title: 'Purpose and jurisdiction notes',
        description: 'Voluntary-standard status, 2025 standalone PIMS, GDPR analogue honesty, and copyright limits.',
        sourceUrl: ISO_27701,
        eurLexUrl: ISO_27701
      },
      {
        id: 'chapters',
        title: 'PIMS clause map',
        description: 'Educational map of ISO/IEC 27701:2025 using public catalogue facts and Harmonized Structure titles.',
        sourceUrl: ISO_27701,
        eurLexUrl: ISO_27701
      }
    ],
    chapters,
    recitals,
    articles,
    extractedFrom: 'iso-org-catalogue-27701-2025',
    chapterSummaries: {
      1: 'Public scope: PIMS requirements and guidance for PII controllers and processors; all organization types and sizes (ISO.org catalogue).',
      2: 'Harmonized Structure clauses 4–10 (context, leadership, planning, support, operation, performance evaluation, improvement) applied to a PIMS.',
      3: 'Educational split of PII controller vs PII processor responsibilities as described on ISO.org.',
      4: 'Standalone MSS compatible with ISO/IEC 27001; helps demonstrate — not replace — GDPR and other privacy law.'
    }
  });
}

function buildIso19941() {
  const sources = [
    {
      name: 'ISO — ISO/IEC 19941:2017 catalogue',
      url: ISO_19941,
      description:
        'Official ISO.org catalogue for ISO/IEC 19941:2017 Information technology — Cloud computing — Interoperability and portability. Confirmed 2023; ISO.org states it will be replaced by ISO/IEC 19941-1 (planned publication around November 2026).',
      documents: [
        { label: 'ISO.org catalogue (ISO/IEC 19941:2017)', url: ISO_19941 },
        {
          label: 'ISO/IEC 19941-1 (forthcoming replacement)',
          url: 'https://www.iso.org/standard/86724.html'
        }
      ]
    },
    {
      name: 'ISO — ISO/IEC 17788 and 17789 (related cloud vocabulary and architecture)',
      url: 'https://www.iso.org/standard/60544.html',
      description:
        'Related cloud computing vocabulary (ISO/IEC 17788) and reference architecture (ISO/IEC 17789) that ISO/IEC 19941 uses for common terminology among cloud service customer, provider, and partner.',
      documents: [
        { label: 'ISO/IEC 17788 catalogue', url: 'https://www.iso.org/standard/60544.html' },
        { label: 'ISO/IEC 17789 catalogue', url: 'https://www.iso.org/standard/60545.html' }
      ]
    }
  ];
  const chapters = [
    chapter(1, 'Scope, related standards, and roles', '1–3', ISO_19941),
    chapter(2, 'Interoperability and portability types', '4–6', ISO_19941),
    chapter(3, 'Data and application movement; lock-in', '7–9', ISO_19941),
    chapter(4, 'Life cycle and Data Act analogue note', '10–11', ISO_19941)
  ];
  const recitals = [
    recital(
      1,
      'Voluntary cloud interoperability standard, not a law',
      'ISO/IEC 19941:2017 is a voluntary International Standard on cloud computing interoperability and portability. It is not the EU Data Act (Regulation (EU) 2023/2854), not a switching-fee ban, and not a statutory right to product data. Organizations and cloud providers may use it to agree common language for interoperability and portability. Buy the full text from ISO for the normative types and diagrams.',
      ISO_19941
    ),
    recital(
      2,
      'Confirmed 2023; replacement ISO/IEC 19941-1 expected',
      'ISO.org lists ISO/IEC 19941:2017 as confirmed in 2023 and states the document will be replaced by ISO/IEC 19941-1 (Information technology — Cloud computing — Interoperability and portability — Part 1: Overview), with a catalogue target around November 2026. Until that replacement is published, 19941:2017 remains the current International Standard in this workspace. Check ISO.org for the live stage code.',
      ISO_19941
    ),
    recital(
      3,
      'Closest international analogue to the EU Data Act for cloud switching — not a copy',
      'This workspace maps ISO/IEC 19941 to the EU Data Act because both address cloud interoperability, portability, and reducing lock-in. The Data Act creates binding switching and interoperability duties for data-processing services in the Union. ISO/IEC 19941 creates a shared technical vocabulary of interoperability and portability types for cloud service customers (CSC), cloud service providers (CSP), and cloud service partners (CSN). Use the Data Act instrument for Regulation (EU) 2023/2854.',
      ISO_19941
    ),
    recital(
      4,
      'Copyright: educational overlay only',
      'ISO owns the copyright in ISO/IEC 19941. This corpus uses the public catalogue abstract (interoperability and portability types; common terminology; CSC/CSP/CSN) plus original educational notes. It does not reproduce figures, type taxonomies, or paid clause text.',
      ISO_19941
    )
  ];
  const articles = [
    article(
      1,
      'Clause 1 — Scope (catalogue abstract)',
      'Public ISO.org abstract: ISO/IEC 19941 specifies cloud computing interoperability and portability types, and the relationship of these types. It also provides a common terminology for describing interoperability and portability between cloud services. The document is intended to be used by cloud service customers, cloud service providers, and cloud service partners. This educational overlay does not reproduce the full type catalogue from the paid standard.',
      ISO_19941
    ),
    article(
      2,
      'Relationship to ISO/IEC 17788 and 17789',
      'ISO/IEC 19941 builds on the cloud computing vocabulary in ISO/IEC 17788 and the reference architecture in ISO/IEC 17789. Those related standards define roles such as cloud service customer (CSC), cloud service provider (CSP), and cloud service partner (CSN), and the service capabilities they exchange. Use 19941 for interoperability/portability types; use 17788/17789 for vocabulary and architecture. Catalogue links are on ISO.org.',
      ISO_19941
    ),
    article(
      3,
      'Roles — CSC, CSP, and CSN',
      'Educational map of publicly described cloud roles: the cloud service customer (CSC) consumes cloud services; the cloud service provider (CSP) makes those services available; a cloud service partner (CSN) supports the customer or provider (for example a broker, auditor, or integrator). Interoperability and portability discussions in ISO/IEC 19941 are about how these parties exchange data, applications, and service interfaces without being trapped in a single provider’s stack.',
      ISO_19941
    ),
    article(
      4,
      'Interoperability types (educational)',
      'The public abstract states that the standard specifies types of cloud computing interoperability and the relationship of these types. In this educational overlay, interoperability means the ability of distinct cloud systems or services to exchange information and to use the information that has been exchanged — for example API-level, application-level, or management-plane interoperability. Exact type names and diagrams are in the paid document.',
      ISO_19941
    ),
    article(
      5,
      'Portability types (educational)',
      'The public abstract likewise specifies types of cloud computing portability. In this educational overlay, portability is the ability to move data or applications from one cloud service to another (or between on-premises and cloud) with an agreed level of functional equivalence. Typical public discussion distinguishes data portability from application (workload) portability. This is a technical classification, not an EU Data Act switching right.',
      ISO_19941
    ),
    article(
      6,
      'Common terminology',
      'ISO.org highlights a common terminology so customers, providers, and partners can describe interoperability and portability consistently. Shared terms reduce failed migrations caused by each vendor meaning something different by “open”, “portable”, or “compatible”. The vocabulary sits alongside ISO/IEC 17788. Educational overlay only.',
      ISO_19941
    ),
    article(
      7,
      'Avoiding cloud lock-in (educational purpose)',
      'A practical purpose of discussing interoperability and portability types is to make switching and multi-cloud architectures easier to specify in contracts and architectures. ISO/IEC 19941 does not prohibit exit fees or mandate switching assistance. The EU Data Act does create switching obligations for in-scope data-processing services. Keep that legal/technical split explicit when answering questions.',
      ISO_19941
    ),
    article(
      8,
      'Data portability (educational)',
      'Data portability, in this educational map, concerns moving customer data (and associated metadata) out of one cloud service in a usable form. Buyers typically ask whether export formats are documented, complete, and importable by another CSP. ISO/IEC 19941 classifies portability types; it does not grant a statutory export right. For EU statutory switching and data export from data-processing services, see the Data Act instrument.',
      ISO_19941
    ),
    article(
      9,
      'Application portability (educational)',
      'Application or workload portability concerns moving the software that processes data — containers, functions, or full stacks — between environments. Interoperability of management APIs often determines whether that move is practical. This overlay does not copy ISO type trees. Organizations still need contractual and engineering work on top of the standard’s vocabulary.',
      ISO_19941
    ),
    article(
      10,
      'Forthcoming ISO/IEC 19941-1',
      'ISO.org states ISO/IEC 19941:2017 will be replaced by ISO/IEC 19941-1 (Part 1: Overview), with a catalogue indication around November 2026. When Part 1 is published, this workspace should be updated. Until then, answers should cite 19941:2017 as the current International Standard and note the planned replacement. Do not invent Part 1 clause numbers.',
      ISO_19941
    ),
    article(
      11,
      'Not the EU Data Act',
      'ISO/IEC 19941 is an international technical standard on cloud interoperability and portability types. The EU Data Act is a binding regulation on fair access to and use of data, including switching between data-processing services and interoperability. Mapping them in this product is analogical (cloud portability / switching). They are not the same instrument, and ISO certification is not Data Act compliance.',
      ISO_19941
    )
  ];
  writeCorpus('iso-19941', {
    sources,
    categories: [
      {
        id: 'recitals',
        title: 'Purpose and jurisdiction notes',
        description: 'Voluntary status, 19941-1 replacement, Data Act analogue honesty, copyright.',
        sourceUrl: ISO_19941,
        eurLexUrl: ISO_19941
      },
      {
        id: 'chapters',
        title: 'Interoperability and portability map',
        description: 'Educational map from the ISO.org abstract: types, terminology, CSC/CSP/CSN, lock-in, life cycle.',
        sourceUrl: ISO_19941,
        eurLexUrl: ISO_19941
      }
    ],
    chapters,
    recitals,
    articles,
    extractedFrom: 'iso-org-catalogue-19941-2017',
    chapterSummaries: {
      1: 'Scope from ISO.org: interoperability and portability types and common terminology for CSC, CSP, and CSN; related 17788/17789.',
      2: 'Educational split of interoperability types, portability types, and shared vocabulary.',
      3: 'Data vs application portability and the lock-in problem the vocabulary is meant to make discussable.',
      4: 'ISO/IEC 19941-1 forthcoming replacement; not the EU Data Act.'
    }
  });
}

function buildIso23894() {
  const sources = [
    {
      name: 'ISO — ISO/IEC 23894:2023 catalogue',
      url: ISO_23894,
      description:
        'Official ISO.org catalogue for ISO/IEC 23894:2023 Information technology — Artificial intelligence — Guidance on risk management. Edition 1, published February 2023; JTC 1/SC 42; 26 pages. Guidance overlay on ISO 31000 — not a certifiable AI management system.',
      documents: [
        { label: 'ISO.org catalogue (ISO/IEC 23894:2023)', url: ISO_23894 },
        { label: 'ISO 31000:2018 Risk management — Guidelines', url: ISO_31000 }
      ]
    },
    {
      name: 'ISO — ISO/IEC 42001 (related AIMS)',
      url: ISO_42001,
      description:
        'Related certifiable standard: ISO/IEC 42001 Artificial intelligence management system (AIMS). Distinct from ISO/IEC 23894, which is risk-management guidance rather than an MSS for certification.',
      documents: [{ label: 'ISO.org catalogue (ISO/IEC 42001)', url: ISO_42001 }]
    },
    {
      name: 'ISO/IEC JTC 1/SC 42',
      url: 'https://www.iso.org/committee/6794475.html',
      description: 'ISO/IEC committee for artificial intelligence — developer of ISO/IEC 23894 and ISO/IEC 42001.',
      documents: [{ label: 'SC 42 committee page', url: 'https://www.iso.org/committee/6794475.html' }]
    }
  ];
  const chapters = [
    chapter(1, 'Scope and ISO 31000 relationship', '1–2', ISO_23894),
    chapter(2, 'Context, leadership, and stakeholders', '3–5', ISO_23894),
    chapter(3, 'AI risk process (identify, analyse, treat)', '6–8', ISO_23894),
    chapter(4, 'Monitoring, records, and improvement', '9–10', ISO_23894),
    chapter(5, 'Related ISO/IEC 42001 and EU AI Act note', '11–12', ISO_23894)
  ];
  const recitals = [
    recital(
      1,
      'Guidance on AI risk management, not a law',
      'ISO/IEC 23894:2023 is voluntary guidance on risk management for artificial intelligence. It is not the EU Artificial Intelligence Act (Regulation (EU) 2024/1689), not a prohibited-practices list, and not a high-risk conformity-assessment regime. Organizations may use it to structure AI risk processes. Buy the full text from ISO for the guidance clauses.',
      ISO_23894
    ),
    recital(
      2,
      'ISO 31000 overlay (catalogue and public comparisons)',
      'ISO.org and public OECD comparisons describe ISO/IEC 23894 as guidance that uses ISO 31000 (Risk management — Guidelines) as the foundation and adds AI-specific considerations. ISO 31000’s well-known public process is: communication and consultation; scope, context and criteria; risk assessment (identify, analyse, evaluate); risk treatment; monitoring and review; recording and reporting. ISO/IEC 23894 applies that process to AI systems across their life cycle.',
      ISO_31000
    ),
    recital(
      3,
      'Related ISO/IEC 42001 is the certifiable AIMS',
      'ISO/IEC 42001 is a related but distinct International Standard: an Artificial Intelligence Management System (AIMS) that can be certified. ISO/IEC 23894 is guidance on AI risk management, not that certifiable MSS. This workspace maps 23894 (not 42001) as the AI Act analogue because the user asked for ISO 23894. Mentions of 42001 here are relationship notes only.',
      ISO_42001
    ),
    recital(
      4,
      'Closest international analogue to the EU AI Act — not a copy',
      'This workspace maps ISO/IEC 23894 to the EU AI Act because both address AI risk, governance, and human oversight themes. The AI Act is binding Union law with prohibited practices, high-risk duties, GPAI rules, and market surveillance. ISO/IEC 23894 is committee guidance (JTC 1/SC 42, 26 pages, February 2023) for organizations developing, providing, or using AI. Use the AI Act instrument for Regulation (EU) 2024/1689.',
      ISO_23894
    ),
    recital(
      5,
      'Copyright: educational overlay only',
      'ISO owns the copyright in ISO/IEC 23894. This corpus uses public catalogue facts, the publicly known ISO 31000 process titles, and original educational notes (including OECD-published comparison themes such as governance, stakeholder engagement, human oversight, record-keeping, and re-assessment). It does not reproduce paid guidance paragraphs.',
      ISO_23894
    )
  ];
  const articles = [
    article(
      1,
      'Clause 1 — Scope (catalogue abstract)',
      'Public catalogue description: ISO/IEC 23894 provides guidance on how organizations that develop, produce, deploy or use products, systems and services that utilize artificial intelligence (AI) can manage risk specifically related to AI. It is intended to be used in connection with ISO 31000. Educational overlay — the paid document contains the full scope, exclusions, and examples.',
      ISO_23894
    ),
    article(
      2,
      'Relationship to ISO 31000',
      'ISO 31000:2018 is ISO’s generic risk-management guideline (principles, framework, process). ISO/IEC 23894 is an AI-specific overlay: it does not replace ISO 31000. Public process titles reused here: communication and consultation; establishing scope, context and criteria; risk identification, analysis and evaluation; risk treatment; monitoring and review; recording and reporting. AI adds model behaviour, data quality, and autonomy as risk sources.',
      ISO_31000
    ),
    article(
      3,
      'Organizational context for AI risk',
      'Before treating AI risk, an organization determines the internal and external context: which AI systems it develops or uses, who is affected, which legal regimes apply (for example the EU AI Act in the Union — a different instrument), and what risk criteria (severity, likelihood, human-rights impact) it will use. Context is an ISO 31000 step, specialized here to AI life cycles (design, training, deployment, monitoring, retirement).',
      ISO_23894
    ),
    article(
      4,
      'Leadership and AI governance (educational)',
      'Public comparisons of ISO/IEC 23894 with ISO 31000 note additional emphasis on governance for AI. In this educational map, leadership sets AI risk appetite, assigns accountability for models and data, and integrates AI risk into enterprise risk management. Governance is not an EU AI Act notified-body or CE-marking process.',
      ISO_23894
    ),
    article(
      5,
      'Stakeholder engagement and human oversight (educational)',
      'Public OECD-style comparisons highlight stakeholder engagement and human oversight as AI-specific additions to generic risk management. Affected people, users, and oversight staff need to be considered when identifying AI risk and when treating it (for example retaining meaningful human review of consequential outputs). This is guidance, not the AI Act’s high-risk human-oversight article.',
      ISO_23894
    ),
    article(
      6,
      'AI risk identification',
      'Risk identification asks what could go wrong because of an AI system: unsafe outputs, bias, privacy leakage, security of models and training data, loss of human control, environmental cost, or third-party model dependencies. Identification should cover the AI life cycle, not only production inference. Educational overlay using ISO 31000 process titles.',
      ISO_23894
    ),
    article(
      7,
      'AI risk analysis and evaluation',
      'Analysis estimates likelihood and consequence of identified AI risks; evaluation compares those levels to the organization’s criteria to decide which risks need treatment. AI-specific difficulty includes uncertainty of model behaviour on unseen data and systemic effects when many actors use similar models. Evaluation does not create the AI Act’s high-risk list in Annex III.',
      ISO_23894
    ),
    article(
      8,
      'AI risk treatment',
      'Treatment options follow ISO 31000: avoid, reduce, share, or retain risk. AI treatments commonly include data governance, evaluation and testing, access controls, human oversight, incident response, and contractual allocation with model providers. Residual risk should remain within appetite. This is management guidance, not a statutory conformity assessment.',
      ISO_23894
    ),
    article(
      9,
      'Monitoring, tracking, and record-keeping (educational)',
      'Public comparisons note extra emphasis on monitoring, tracking, and records for AI. Models drift; data pipelines change; new use cases appear. Organizations are expected to monitor deployed AI, keep records that support review, and report risk status to leadership. Records here are risk-management records, not AI Act technical documentation annexes.',
      ISO_23894
    ),
    article(
      10,
      'Continual improvement and re-assessment (educational)',
      'Public comparisons also note re-assessment: AI risk is not a one-time design-time exercise. After incidents, material model updates, or context changes, the organization repeats identification, analysis, evaluation, and treatment. Continual improvement closes the ISO 31000 cycle.',
      ISO_23894
    ),
    article(
      11,
      'Related ISO/IEC 42001 Artificial intelligence management system',
      'ISO/IEC 42001 specifies a certifiable Artificial Intelligence Management System (AIMS). Organizations that want a certifiable MSS for AI should look at 42001. ISO/IEC 23894 remains the risk-management guidance overlay on ISO 31000. They can be used together: 42001 for the management system, 23894 for how to run the risk process. This product does not currently ship a 42001 corpus.',
      ISO_42001
    ),
    article(
      12,
      'Not the EU Artificial Intelligence Act',
      'ISO/IEC 23894 does not prohibit AI practices, does not classify high-risk systems, does not regulate general-purpose AI models, and does not create an EU AI Office. The EU AI Act does those things as binding law. Mapping in this product is analogical (AI risk and governance). Use the AI Act instrument for Regulation (EU) 2024/1689.',
      ISO_23894
    )
  ];
  writeCorpus('iso-23894', {
    sources,
    categories: [
      {
        id: 'recitals',
        title: 'Purpose and jurisdiction notes',
        description: 'Guidance status, ISO 31000 overlay, related ISO/IEC 42001, AI Act analogue honesty, copyright.',
        sourceUrl: ISO_23894,
        eurLexUrl: ISO_23894
      },
      {
        id: 'chapters',
        title: 'AI risk-management map',
        description: 'Educational overlay of ISO 31000 process titles specialized to AI, plus 42001 relationship.',
        sourceUrl: ISO_23894,
        eurLexUrl: ISO_23894
      }
    ],
    chapters,
    recitals,
    articles,
    extractedFrom: 'iso-org-catalogue-23894-2023',
    chapterSummaries: {
      1: 'ISO/IEC 23894:2023 guidance on AI risk management for developers, providers, and users; overlay on ISO 31000.',
      2: 'Context, leadership/governance, stakeholder engagement, and human oversight (educational).',
      3: 'ISO 31000 risk process applied to AI: identify, analyse/evaluate, treat.',
      4: 'Monitoring, records, and re-assessment across the AI life cycle.',
      5: 'Related certifiable ISO/IEC 42001 AIMS; not the EU AI Act.'
    }
  });
}

function buildSoc2() {
  const sources = [
    {
      name: 'AICPA — 2017 Trust Services Criteria with 2022 Points of Focus',
      url: AICPA_TSC,
      description:
        'Official AICPA & CIMA download page for the 2017 Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy, with revised Points of Focus 2022 (TSP section 100). This is attestation criteria, not a statute.',
      documents: [{ label: 'TSC 2017 with 2022 Points of Focus (AICPA download)', url: AICPA_TSC }]
    },
    {
      name: 'AICPA — SOC for Service Organizations',
      url: AICPA_SOC,
      description:
        'Official AICPA landing page for System and Organization Controls (SOC) for Service Organizations, including SOC 2 reports that use the Trust Services Criteria.',
      documents: [{ label: 'SOC for Service Organizations', url: AICPA_SOC }]
    }
  ];
  const chapters = [
    chapter(1, 'Security — Common Criteria (CC1–CC9)', '1–9', AICPA_TSC),
    chapter(2, 'Availability (A1)', '10', AICPA_TSC),
    chapter(3, 'Confidentiality (C1)', '11', AICPA_TSC),
    chapter(4, 'Processing Integrity (PI1)', '12', AICPA_TSC),
    chapter(5, 'Privacy (P1–P8)', '13–20', AICPA_TSC)
  ];
  const recitals = [
    recital(
      1,
      'SOC 2 is an attestation, not a law',
      'SOC 2 is a System and Organization Controls report issued by a CPA under AICPA attestation standards, using the Trust Services Criteria (TSC). It is not a statute, not GDPR, and not an ISO management-system certification. A service organization commissions a SOC 2 report to give customers assurance over controls. This workspace includes SOC 2 because users asked for it as an international analogue alongside ISO privacy, cloud, and AI standards.',
      AICPA_SOC
    ),
    recital(
      2,
      'Type 1 vs Type 2',
      'In public AICPA descriptions, a Type 1 SOC 2 report describes the system and tests whether controls are suitably designed at a point in time. A Type 2 report also tests whether those controls operated effectively over a period. Buyers often prefer Type 2 for ongoing assurance. This overlay does not reproduce examination procedures from the attestation standards.',
      AICPA_SOC
    ),
    recital(
      3,
      'Five TSC categories; Security is the usual core',
      'The AICPA Trust Services Criteria address five categories: Security, Availability, Processing Integrity, Confidentiality, and Privacy. Security (the Common Criteria, CC) is typically in every SOC 2. The other categories are included when they are relevant to the system and the report’s commitments. Criterion titles used in this corpus are the publicly listed TSC names, not the paid Points of Focus tables.',
      AICPA_TSC
    ),
    recital(
      4,
      'Not a GDPR analogue in the legal sense; Privacy category is TSC Privacy',
      'SOC 2 Privacy (P1–P8) is about whether the service organization meets its privacy commitments using TSC Privacy criteria (notice, choice and consent, collection, use/retention/disposal, access, disclosure, quality, monitoring). That is not the EU GDPR. ISO/IEC 27701 is this product’s GDPR analogue. SOC 2 is included as an additional international assurance instrument that customers often ask for next to ISO certifications.',
      AICPA_TSC
    ),
    recital(
      5,
      '2017 TSC with 2022 Points of Focus; copyright AICPA',
      'The current public AICPA download is titled “2017 Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy (with Revised Points of Focus — 2022)” (TSP section 100). AICPA holds copyright. This corpus uses category and criterion names plus original educational summaries. It does not copy Points of Focus, illustrative controls, or examination text. Obtain the TSC from AICPA for engagements.',
      AICPA_TSC
    ),
    recital(
      6,
      'How this sits next to ISO 27701 / 19941 / 23894',
      'ISO/IEC 27701 is a certifiable-style PIMS standard; ISO/IEC 19941 is cloud interoperability vocabulary; ISO/IEC 23894 is AI risk-management guidance; SOC 2 is a CPA attestation over TSC. A company may hold ISO certificates and also issue a SOC 2 report. None of them is EU law. Use the EU instruments in this app for GDPR, the Data Act, and the AI Act.',
      AICPA_SOC
    )
  ];
  const articles = [
    article(
      1,
      'CC1 — Control Environment',
      'Public Trust Services Criteria (TSC) category Security / Common Criteria name: Control Environment. Educational summary: the service organization demonstrates integrity, ethical values, board and management oversight, and a structure that makes security (and other in-scope Trust Services Criteria categories) possible. Without a sound control environment, later access and operations criteria have nothing to hang on. Not a GDPR accountability article.',
      AICPA_TSC
    ),
    article(
      2,
      'CC2 — Communication and Information',
      'Public TSC name: Communication and Information. Educational summary: the organization obtains and internally communicates the information needed to support the functioning of controls, and communicates with external parties (customers, regulators, subprocessors) as needed for the system’s commitments. Relevant to how SOC 2 system descriptions and trust-services commitments are explained to user entities.',
      AICPA_TSC
    ),
    article(
      3,
      'CC3 — Risk Assessment',
      'Public TSC name: Risk Assessment. Educational summary: the organization identifies and assesses risks to achieving its objectives for the in-scope TSC categories (security, and availability, processing integrity, confidentiality, or privacy if included), including fraud and change. This is COSO-aligned risk assessment language used in TSC, not ISO 31000 and not an EU AI Act risk system.',
      AICPA_TSC
    ),
    article(
      4,
      'CC4 — Monitoring Activities',
      'Public TSC name: Monitoring Activities. Educational summary: the organization selects, performs, and evaluates ongoing and separate evaluations to ascertain whether TSC-relevant controls are present and functioning, and communicates deficiencies. SOC 2 Type 2 evidence often draws on this monitoring.',
      AICPA_TSC
    ),
    article(
      5,
      'CC5 — Control Activities',
      'Public TSC name: Control Activities. Educational summary: the organization deploys control activities through policies and procedures that help ensure management directives to mitigate risks are carried out. Later CC6–CC9 specialize this into access, operations, change, and mitigation. Educational name-level overlay only.',
      AICPA_TSC
    ),
    article(
      6,
      'CC6 — Logical and Physical Access Controls',
      'Public TSC name: Logical and Physical Access Controls. Educational summary: access to the system, its data, and supporting infrastructure is authorized, provisioned, reviewed, and revoked; physical access to facilities is likewise restricted. This is the TSC Security criterion customers most often associate with “SOC 2 access control.” It is not ISO/IEC 27001 Annex A and not GDPR Article 32, though themes overlap.',
      AICPA_TSC
    ),
    article(
      7,
      'CC7 — System Operations',
      'Public TSC name: System Operations. Educational summary: the organization manages system capacity, detects and responds to threats and anomalies, and restores the system after incidents so that Security (and other in-scope) commitments continue to be met. Incident response evidence commonly lands here in SOC 2 examinations.',
      AICPA_TSC
    ),
    article(
      8,
      'CC8 — Change Management',
      'Public TSC name: Change Management. Educational summary: infrastructure, data, software, and procedures are changed in a controlled manner — authorized, tested, documented, and reviewed — so that TSC commitments are not broken by unmanaged change. Distinct from ISO/IEC 23894 AI re-assessment, though both care about change.',
      AICPA_TSC
    ),
    article(
      9,
      'CC9 — Risk Mitigation',
      'Public TSC name: Risk Mitigation. Educational summary: the organization identifies, selects, and develops risk-mitigation activities including vendor and business-partner (subservice organization) risk. SOC 2 reports often describe complementary user-entity controls and subservice organizations here or in the system description.',
      AICPA_TSC
    ),
    article(
      10,
      'A1 — Availability',
      'Public TSC category Availability (criterion A1). Educational summary: when Availability is in the SOC 2 scope, the organization maintains, monitors, and evaluates controls so that the system is available for operation and use as committed. Typical themes: capacity, backup, disaster recovery, and availability commitments in customer contracts. Optional category — only in the report if selected.',
      AICPA_TSC
    ),
    article(
      11,
      'C1 — Confidentiality',
      'Public TSC category Confidentiality (criterion C1). Educational summary: when Confidentiality is in scope, confidential information is identified and protected as committed (for example encryption, need-to-know, disposal). Confidentiality in TSC is about information designated confidential, which may or may not be personal data. Privacy is a separate TSC category.',
      AICPA_TSC
    ),
    article(
      12,
      'PI1 — Processing Integrity',
      'Public TSC category Processing Integrity (criterion PI1). Educational summary: when Processing Integrity is in scope, system processing is complete, valid, accurate, timely, and authorized as committed. Relevant to payment, payroll, or other processing services. Not the EU Data Act processing-service switching rules.',
      AICPA_TSC
    ),
    article(
      13,
      'P1 — Privacy criteria related to notice',
      'Public TSC Privacy criterion name (notice and communication of objectives related to privacy). Educational summary: when Privacy is in the SOC 2 scope, the organization provides notice about its privacy practices and objectives. This is TSC Privacy, not GDPR Articles 13–14, though both concern transparency. Use ISO/IEC 27701 or the GDPR instrument for those regimes.',
      AICPA_TSC
    ),
    article(
      14,
      'P2 — Choice and consent',
      'Public TSC Privacy criterion name: Choice and Consent. Educational summary: the organization describes choices available to data subjects (TSC uses “data subjects” in Privacy criteria) and obtains consent where its privacy commitments require it. Not a GDPR lawful-basis catalogue (consent is only one GDPR basis).',
      AICPA_TSC
    ),
    article(
      15,
      'P3 — Collection',
      'Public TSC Privacy criterion name: Collection. Educational summary: personal information is collected consistent with the organization’s privacy notice and commitments, limited to what those commitments allow. Educational name-level overlay; Points of Focus remain AICPA copyrighted.',
      AICPA_TSC
    ),
    article(
      16,
      'P4 — Use, retention, and disposal',
      'Public TSC Privacy criterion name: Use, Retention, and Disposal. Educational summary: personal information is used, retained, and disposed of in accordance with privacy commitments — including limiting secondary use and disposing of information when no longer needed. Analogous in theme to purpose limitation and storage limitation, but TSC is not GDPR.',
      AICPA_TSC
    ),
    article(
      17,
      'P5 — Access',
      'Public TSC Privacy criterion name: Access. Educational summary: the organization provides data subjects with access to their personal information for review and update consistent with privacy commitments. Not the full GDPR Chapter III rights set (erasure, portability, objection, etc.), unless those appear in the organization’s own notice.',
      AICPA_TSC
    ),
    article(
      18,
      'P6 — Disclosure and notification',
      'Public TSC Privacy criterion name: Disclosure and Notification. Educational summary: disclosure of personal information to third parties, and notification of incidents, follow the organization’s privacy commitments and applicable notice. Distinct from GDPR Articles 33–34 breach notification, though a company subject to both must satisfy the law as well as TSC commitments.',
      AICPA_TSC
    ),
    article(
      19,
      'P7 — Quality',
      'Public TSC Privacy criterion name: Quality. Educational summary: the organization collects and maintains personal information that is accurate, complete, and current as needed for the purposes identified in its privacy notice. Theme overlap with data-quality principles in privacy law; TSC remains attestation criteria.',
      AICPA_TSC
    ),
    article(
      20,
      'P8 — Monitoring and enforcement',
      'Public TSC Privacy criterion name: Monitoring and Enforcement. Educational summary: the organization monitors compliance with its privacy commitments and has procedures to address inquiries, complaints, and disputes. Closes the TSC Privacy set. For a certifiable privacy MSS, see ISO/IEC 27701 in this app; for EU law, see GDPR.',
      AICPA_TSC
    )
  ];
  writeCorpus('soc2', {
    sources,
    categories: [
      {
        id: 'recitals',
        title: 'Purpose and jurisdiction notes',
        description: 'Attestation vs law, Type 1/Type 2, five TSC categories, GDPR honesty, 2017/2022 edition, copyright.',
        sourceUrl: AICPA_TSC,
        eurLexUrl: AICPA_SOC
      },
      {
        id: 'chapters',
        title: 'Trust Services Criteria map',
        description: 'Educational map of publicly listed TSC category and criterion names (CC, A, C, PI, P).',
        sourceUrl: AICPA_TSC,
        eurLexUrl: AICPA_SOC
      }
    ],
    chapters,
    recitals,
    articles,
    extractedFrom: 'aicpa-tsc-2017-pof-2022-catalogue',
    chapterSummaries: {
      1: 'Security Common Criteria CC1–CC9 (control environment through risk mitigation) — usual core of every SOC 2.',
      2: 'Availability A1 — optional TSC category for system availability commitments.',
      3: 'Confidentiality C1 — optional TSC category for information designated confidential.',
      4: 'Processing Integrity PI1 — optional TSC category for complete, valid, accurate, timely, authorized processing.',
      5: 'Privacy P1–P8 — optional TSC Privacy criteria (notice through monitoring); not the EU GDPR.'
    }
  });
}

function main() {
  for (const id of INTL_REGULATION_IDS) {
    if (!getRegulation(id) || getRegulation(id).id !== id) {
      throw new Error(`Registry missing ${id} — update lib/regulations.js first`);
    }
  }
  buildIso27701();
  buildIso19941();
  buildIso23894();
  buildSoc2();
}

main();
