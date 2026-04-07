/**
 * GDPR / privacy news topic taxonomy: classification for crawled items and News tab filters.
 * Order matters: first matching topic wins (more specific rows before broader ones in each group).
 */

'use strict';

const NEWS_TOPIC_FALLBACK = 'Other GDPR & data protection topics';

/**
 * @typedef {{ label: string, patterns: RegExp[] }} NewsTopicDef
 * @typedef {{ category: string, topics: NewsTopicDef[] }} NewsTopicGroup
 */

/** @type {NewsTopicGroup[]} */
const NEWS_TOPIC_GROUPS = [
  {
    category: 'Core Rights',
    topics: [
      {
        label: "Children's data and minors",
        patterns: [
          /child'?s (online )?(privacy|data)|children'?s (data|privacy|rights)|data (on|of|relating to) children|minor'?s data|parental consent|age assurance|age verification|article\s*8|offering (of )?services (directly )?to children/i
        ]
      },
      {
        label: 'Direct marketing and communications',
        patterns: [
          /direct marketing|marketing communication|email marketing|promotional (email|sms|message)|soft opt-in|marketing (opt-in|opt-out|preference)|newsletter.*(subscribe|consent|personal data)/i
        ]
      },
      {
        label: 'Access, rectification, and erasure',
        patterns: [
          /right of access|right to access|subject access|data subject access|\bdsar\b|article\s*15|right to rectification|rectification request|article\s*16|right to erasure|right of erasure|article\s*17|data deletion|erasure request|right to be forgotten|to be forgotten/i
        ]
      },
      {
        label: 'Data portability',
        patterns: [/data portability|article\s*20|portable format|structured.*commonly used.*machine-readable/i]
      },
      {
        label: 'Restrictions on rights',
        patterns: [
          /restriction of processing|right to restriction|article\s*18|processing restriction|restricted processing/i
        ]
      },
      {
        label: 'Automated decision-making and profiling',
        patterns: [
          /automated decision|automated individual decision|article\s*22|solely automated|\bprofiling\b.*\b(personal data|data subject|privacy|gdpr)\b|\bprofiling\b.*\b(data protection|supervisory)/i
        ]
      }
    ]
  },
  {
    category: 'AI and Emerging Tech',
    topics: [
      {
        label: 'Facial recognition systems',
        patterns: [/facial recognition|face recognition|facial biometric|face scan.*(privacy|data protection|personal)/i]
      },
      {
        label: 'Virtual voice assistants',
        patterns: [
          /voice assistant|smart speaker|virtual assistant.*(privacy|personal data|data protection)|conversational ai.*(privacy|personal|data)/i
        ]
      },
      {
        label: 'Blockchain data processing',
        patterns: [
          /blockchain.*(personal data|data protection|privacy|gdpr)|distributed ledger.*(personal|privacy|data protection)/i
        ]
      },
      {
        label: 'Pseudonymisation techniques',
        patterns: [/pseudonymisation|pseudonymization|pseudonymised|pseudonymized/i]
      },
      {
        label: 'AI models and privacy principles',
        patterns: [
          /artificial intelligence|machine learning|\bai governance\b|\bai act\b|generative ai|foundation model|large language model|\bllm\b.*(privacy|personal|data protection|gdpr)/i,
          /\bai\b.*\b(privacy|personal data|data protection|gdpr)\b/i
        ]
      },
      {
        label: 'Biometric data and identifiers',
        patterns: [
          /biometric data|biometric identification|biometric template|fingerprint.*(data|scan|personal)|iris (scan|recognition)|voice print|voice biometric|hand geometry/i
        ]
      }
    ]
  },
  {
    category: 'Data Transfers',
    topics: [
      {
        label: 'Standard contractual clauses',
        patterns: [/standard contractual clause|standard contractual clauses|\bsccs?\b(?!\w)/i]
      },
      {
        label: 'Codes of conduct for transfers',
        patterns: [/code of conduct.*(transfer|data protection|gdpr|personal data)|approved code of conduct/i]
      },
      {
        label: 'Derogations for transfers',
        patterns: [/derogation.*(transfer|third countr)|transfer.*derogation|appropriate safeguard/i]
      },
      {
        label: 'Adequacy decisions',
        patterns: [/adequacy decision|adequate level of protection|adequacy finding|commission.*adequacy/i]
      },
      {
        label: 'Territorial scope and transfers',
        patterns: [
          /third countr(y|ies).*transfer|international transfer|transfer of personal data|cross-border.*(data|transfer|flow)|data transfer agreement|schrems|data privacy framework|privacy shield/i,
          /\b(bcr|binding corporate rules)\b/i
        ]
      }
    ]
  },
  {
    category: 'Enforcement and Compliance',
    topics: [
      {
        label: 'Data breach notification',
        patterns: [
          /personal data breach|data breach notification|notify.*supervisory authority|breach.*(72\s*hour|seventy-two)/i,
          /\bdata breach\b.*\b(personal|privacy|notification|authority|ico|edpb)\b/i
        ]
      },
      {
        label: 'Administrative fines calculation',
        patterns: [
          /administrative fine|gdpr fine|monetary penalty notice|penalty notice|infringement.*fine|\bfined\b.*\b(ico|edpb|gdpr|data protection)\b/i
        ]
      },
      {
        label: 'Impact assessments',
        patterns: [
          /data protection impact|\bdpia\b|privacy impact assessment|impact assessment.*(personal data|processing|gdpr)/i
        ]
      },
      {
        label: 'Privacy by design and default',
        patterns: [/privacy by design|data protection by design|data protection by default|by default.*privacy/i]
      },
      {
        label: 'Certification mechanisms',
        patterns: [
          /certification scheme|certification mechanism|certification body.*(data protection)|\biso\s*27701\b|data protection certification/i
        ]
      },
      {
        label: 'Lead authority processes',
        patterns: [
          /lead supervisory authority|lead authority|one-stop-shop|one stop shop|\boss\b.*(gdpr|data protection)|article\s*56/i
        ]
      },
      {
        label: 'Investigations and regulatory inquiries',
        patterns: [
          /investigation.*(data protection|personal data|gdpr|privacy|supervisory|\bico\b|\bedpb\b|\bedps\b)|formal investigation.*(processing|personal|data)|regulatory inquiry.*(data|privacy|gdpr)|inquiry into.*(data protection|personal data|processing|gdpr)/i,
          /\b(supervisory authority|data protection authority|information commissioner).*(investigation|inquiry|probe)/i
        ]
      },
      {
        label: 'Complaints and complaint handling',
        patterns: [
          /complaint(s)? (lodged|filed|against|to)|complaint to (the )?(ico|edpb|supervisory|authority)|complaints? handling|complaints? mechanism|submit(ted)? (a )?complaint/i
        ]
      },
      {
        label: 'Coordinated enforcement and supervisory cooperation',
        patterns: [
          /coordinated enforcement|coordinated investigation|joint (enforcement|investigation|supervisory)|sweep.*(gdpr|privacy|data protection)|multi-authority|cross-border cooperation.*(supervisory|enforcement)/i
        ]
      }
    ]
  },
  {
    category: 'Policy and Litigation',
    topics: [
      {
        label: 'Court judgments and EU case law',
        patterns: [
          /\bcjeu\b|court of justice of the european|preliminary reference|preliminary ruling|european court.*(judgment|ruling)|judgment.*(gdpr|personal data|data protection)|\becj\b.*(data|privacy|gdpr)/i
        ]
      },
      {
        label: 'Consultations and stakeholder input',
        patterns: [
          /public consultation.*(data protection|gdpr|privacy|personal data|processing)|consultation on (the )?(draft|proposed).*(guidelines|guideline|regulation)|stakeholder (event|workshop|meeting|consultation).*(data protection|gdpr|\bedpb\b|\bedps\b)/i
        ]
      },
      {
        label: 'Guidelines and regulatory publications',
        patterns: [
          /\bedpb\b.*(guidelines|guideline|recommendation|statement|opinion)|guidelines.*\bedpb\b|adopts? (the )?(final )?(version )?(of )?(the )?(draft )?guidelines|draft guidelines.*(data protection|gdpr|privacy)|recommendation.*\b(article\s*64|board)\b/i
        ]
      },
      {
        label: 'GDPR reform and legislative developments',
        patterns: [
          /digital omnibus|gdpr.*(omnibus|reform|recast|simplification)|simplification.*(record-keeping|gdpr)|commission.*proposes.*(data protection|privacy|gdpr)|proposal for a.*(regulation|directive).*(data|privacy)|legislative.*(package|proposal).*(data protection|privacy)/i
        ]
      }
    ]
  },
  {
    category: 'Processing Concepts',
    topics: [
      {
        label: 'Controller and processor roles',
        patterns: [
          /\bdata controller\b|\bdata processor\b|joint controller|controller and processor|processor agreement|article\s*28|article\s*26|sub-processor/i
        ]
      },
      {
        label: 'Legitimate interest assessments',
        patterns: [
          /legitimate interests?|legitimate-interest assessment|legitimate interests assessment|\blia\b.*(data protection|gdpr|privacy)|balancing test.*(legitimate interest|gdpr)/i
        ]
      },
      {
        label: 'Consent management',
        patterns: [
          /\bconsent\b.*\b(personal data|processing|gdpr|withdraw|withdrawal|valid)\b|withdraw consent|withdrawal of consent|granular consent/i
        ]
      },
      {
        label: 'Processing records',
        patterns: [/records of processing|processing records|article\s*30|record of processing activities/i]
      },
      {
        label: 'Territorial applicability',
        patterns: [
          /article\s*3|territorial scope.*(gdpr|regulation)|establishment.*(union|eu).*data subject|not established in the union|extra-territorial.*(application|reach|scope)/i
        ]
      },
      {
        label: 'Data Protection Officers',
        patterns: [
          /\bdata protection officer\b|\bdpo\b.*(data|gdpr|privacy|appointment|role|designation)|article\s*37|article\s*38|article\s*39/i
        ]
      },
      {
        label: 'Transparency and information duties',
        patterns: [
          /privacy (notice|policy|statement)|information (to|for) (the )?data subject|transparent.*(processing|information)/i
        ]
      },
      {
        label: 'Cloud services and outsourcing',
        patterns: [
          /cloud (service|provider|hosting)|subprocessor|sub-processor|outsourcing.*(processing|personal data)/i
        ]
      }
    ]
  },
  {
    category: 'Sector-Specific Areas',
    topics: [
      {
        label: 'Connected vehicles and mobility',
        patterns: [
          /connected vehicle|automotive data|vehicle data|mobility data|car data.*(privacy|personal|gdpr)|intelligent transport.*(data|privacy)/i
        ]
      },
      {
        label: 'Video surveillance systems',
        patterns: [/cctv|video surveillance|surveillance camera|camera surveillance/i]
      },
      {
        label: 'Health data in research',
        patterns: [
          /health data|clinical trial.*(data|privacy|personal)|medical research.*(data|patient)|patient data.*(research|clinical|gdpr)/i
        ]
      },
      {
        label: 'Deceptive design patterns',
        patterns: [/dark pattern|deceptive design|manipulative (interface|design)/i]
      },
      {
        label: 'Electronic communications privacy',
        patterns: [
          /\beprivacy\b|e-privacy|electronic communications privacy|\bpecr\b|cookie.*(law|consent|banner)|tracker.*(consent|privacy)/i
        ]
      },
      {
        label: 'Online platforms and social media',
        patterns: [
          /online platform|social media|meta.*(privacy|fine|data)|user data.*(platform|service)|digital (service|platform).*(gatekeeper|users)|\bdsa\b.*(data|privacy|personal)/i
        ]
      },
      {
        label: 'Employment and HR data',
        patterns: [
          /employee data|employee monitoring|workplace.*(privacy|surveillance|monitoring)|\bhr\b.*(data|personal data|privacy|gdpr)|human resources.*(data|privacy)|recruitment.*(data|candidate|privacy|automated)/i
        ]
      },
      {
        label: 'Ad tech and online advertising',
        patterns: [
          /\bad ?tech\b|adtech|advertising (technology|ecosystem)|online advertising|real-time bidding|\brtb\b|programmatic (advertising|ads)/i
        ]
      }
    ]
  },
  {
    category: 'Cybersecurity',
    topics: [
      {
        label: 'Cybersecurity certifications',
        patterns: [
          /cybersecurity certification|cyber security certification|security certification scheme|eu cybersecurity act.*(certif|scheme)/i
        ]
      },
      {
        label: 'Location data handling',
        patterns: [/location data|geolocation|precise geolocation|location tracking.*(personal|privacy|data)/i]
      },
      {
        label: 'Security processing measures',
        patterns: [
          /security of processing|article\s*32|technical and organisational measures|technical and organizational measures|encryption.*(personal data|processing)|security measures.*(personal data|processing)|cyber (attack|incident|threat).*(data|personal|breach)|ransomware|vulnerability disclosure|secure (processing|storage)/i
        ]
      },
      {
        label: 'NIS2 and cyber resilience',
        patterns: [
          /\bnis2\b|nis 2|network and information security|cyber resilience|essential entities|important entities.*(cyber|security)/i
        ]
      }
    ]
  },
  {
    category: 'Oversight Areas',
    topics: [
      {
        label: 'Institutional data protection',
        patterns: [
          /eu institutions.*(data protection)|regulation\s*2018\/1725|\b2018\/1725\b|institutional data protection|\bedps\b.*(institution|eu institution|blog|supervisor)|prior consultation.*(\bedps\b|supervisor)|high risk.*(rights and freedoms|individual)/i
        ]
      },
      {
        label: 'Consistency mechanisms',
        patterns: [/consistency mechanism|consistency opinion|\bedpb\b.*consistency|urgent binding decision/i]
      },
      {
        label: 'Legislative proposals',
        patterns: [
          /legislative proposal|commission proposes|proposed (eu )?regulation|proposal for a regulation|digital services act|\bdma\b.*(eu|european)|digital markets act|european health data space|\behds\b|ai act.*(data|privacy|personal)|data act.*(eu|european)/i
        ]
      },
      {
        label: 'International data protection cooperation',
        patterns: [
          /global privacy assembly|international conference.*(privacy|data protection)|cross-border.*(framework|cooperation).*(privacy|data)|multilateral.*(privacy|data protection)|bilateral.*(adequacy|data)/i
        ]
      },
      {
        /** Catch-all for GDPR-relevant items after keyword inference; no regex (assigned in classifyNewsItemTopic). */
        label: 'Data protection policy and supervisory news',
        patterns: []
      }
    ]
  }
];

/** Used when regex + keyword inference still do not pick a leaf; only if hasGdprRelevanceForInference(blob). */
const UMBRELLA_TOPIC_LABEL = 'Data protection policy and supervisory news';

/**
 * Weighted keyword fallback when no regex matches. Longer / more specific phrases score higher.
 * Order is tie-break (first max wins). Requires hasGdprRelevanceForInference(blob) inside inferTopicFromKeywordScores.
 */
const TOPIC_INFERENCE_RULES = [
  { label: "Children's data and minors", category: 'Core Rights', w: [
    ['age verification', 4], ['parental consent', 4], ['children', 3], ['child', 2], ['minor', 3], ['school', 2], ['under 16', 3], ['under 18', 3]
  ]},
  { label: 'Direct marketing and communications', category: 'Core Rights', w: [
    ['direct marketing', 4], ['email marketing', 3], ['promotional email', 3], ['marketing communication', 3], ['soft opt-in', 3], ['newsletter', 2]
  ]},
  { label: 'Access, rectification, and erasure', category: 'Core Rights', w: [
    ['subject access', 4], ['data subject access', 4], ['right of access', 3], ['right to erasure', 4], ['right to rectification', 3], ['dsar', 3], ['article 15', 2], ['article 17', 2]
  ]},
  { label: 'Data portability', category: 'Core Rights', w: [['data portability', 4], ['article 20', 2], ['portable format', 3]] },
  { label: 'Restrictions on rights', category: 'Core Rights', w: [['restriction of processing', 4], ['article 18', 2], ['restricted processing', 3]] },
  { label: 'Automated decision-making and profiling', category: 'Core Rights', w: [
    ['automated decision', 4], ['solely automated', 3], ['article 22', 2], ['profiling', 2], ['hiring process', 2], ['recruitment', 1]
  ]},
  { label: 'Facial recognition systems', category: 'AI and Emerging Tech', w: [['facial recognition', 4], ['face recognition', 4], ['facial biometric', 3]] },
  { label: 'Virtual voice assistants', category: 'AI and Emerging Tech', w: [['voice assistant', 3], ['smart speaker', 2], ['virtual assistant', 2]] },
  { label: 'Blockchain data processing', category: 'AI and Emerging Tech', w: [['blockchain', 2], ['distributed ledger', 2]] },
  { label: 'Pseudonymisation techniques', category: 'AI and Emerging Tech', w: [['pseudonymisation', 4], ['pseudonymization', 4], ['pseudonymised', 3]] },
  { label: 'AI models and privacy principles', category: 'AI and Emerging Tech', w: [
    ['artificial intelligence', 3], ['machine learning', 2], ['generative ai', 3], ['foundation model', 2], ['large language model', 3], ['ai act', 2], ['ai governance', 3]
  ]},
  { label: 'Biometric data and identifiers', category: 'AI and Emerging Tech', w: [
    ['biometric data', 4], ['biometric identification', 3], ['fingerprint', 2], ['iris', 2], ['voice biometric', 3]
  ]},
  { label: 'Standard contractual clauses', category: 'Data Transfers', w: [['standard contractual clause', 4], ['standard contractual clauses', 4], ['sccs', 3], ['scc', 3]] },
  { label: 'Codes of conduct for transfers', category: 'Data Transfers', w: [['code of conduct', 2], ['approved code', 3]] },
  { label: 'Derogations for transfers', category: 'Data Transfers', w: [['derogation', 2], ['appropriate safeguard', 3]] },
  { label: 'Adequacy decisions', category: 'Data Transfers', w: [['adequacy decision', 4], ['adequacy finding', 3], ['adequate level', 2]] },
  { label: 'Territorial scope and transfers', category: 'Data Transfers', w: [
    ['international transfer', 3], ['cross-border', 2], ['third country', 3], ['binding corporate rules', 3], ['bcr', 2], ['schrems', 3], ['data transfer', 2]
  ]},
  { label: 'Data breach notification', category: 'Enforcement and Compliance', w: [
    ['personal data breach', 4], ['data breach', 3], ['notify the supervisory', 3], ['72 hour', 2], ['72-hour', 2]
  ]},
  { label: 'Administrative fines calculation', category: 'Enforcement and Compliance', w: [
    ['administrative fine', 4], ['monetary penalty', 4], ['penalty notice', 3], ['gdpr fine', 4], ['infringement', 2], ['fined', 2]
  ]},
  { label: 'Impact assessments', category: 'Enforcement and Compliance', w: [
    ['data protection impact', 4], ['dpia', 4], ['privacy impact assessment', 4], ['impact assessment', 2]
  ]},
  { label: 'Privacy by design and default', category: 'Enforcement and Compliance', w: [['privacy by design', 4], ['data protection by design', 3], ['by default', 1]] },
  { label: 'Certification mechanisms', category: 'Enforcement and Compliance', w: [['certification scheme', 3], ['iso 27701', 3], ['data protection certification', 3]] },
  { label: 'Lead authority processes', category: 'Enforcement and Compliance', w: [
    ['lead supervisory', 3], ['one-stop-shop', 3], ['one stop shop', 3], ['lead authority', 2], ['article 56', 2]
  ]},
  { label: 'Investigations and regulatory inquiries', category: 'Enforcement and Compliance', w: [
    ['investigation', 2], ['regulatory inquiry', 3], ['formal investigation', 4], ['inquiry into', 2]
  ]},
  { label: 'Complaints and complaint handling', category: 'Enforcement and Compliance', w: [['complaint', 2], ['complaints', 2], ['lodged a complaint', 3]] },
  { label: 'Coordinated enforcement and supervisory cooperation', category: 'Enforcement and Compliance', w: [
    ['coordinated enforcement', 4], ['coordinated investigation', 3], ['joint investigation', 3], ['sweep', 2]
  ]},
  { label: 'Court judgments and EU case law', category: 'Policy and Litigation', w: [
    ['cjeu', 4], ['court of justice', 3], ['preliminary reference', 3], ['preliminary ruling', 3], ['european court', 2]
  ]},
  { label: 'Consultations and stakeholder input', category: 'Policy and Litigation', w: [
    ['public consultation', 3], ['stakeholder', 2], ['consultation on', 2]
  ]},
  { label: 'Guidelines and regulatory publications', category: 'Policy and Litigation', w: [
    ['edpb', 4], ['guidelines', 3], ['guideline', 2], ['recommendation', 2], ['final version', 1], ['draft guidelines', 3], ['board adopts', 2]
  ]},
  { label: 'GDPR reform and legislative developments', category: 'Policy and Litigation', w: [
    ['omnibus', 3], ['gdpr reform', 4], ['simplification', 2], ['digital omnibus', 4], ['legislative proposal', 2], ['commission proposes', 2]
  ]},
  { label: 'Controller and processor roles', category: 'Processing Concepts', w: [
    ['data controller', 3], ['data processor', 3], ['joint controller', 3], ['processor agreement', 3], ['article 28', 2]
  ]},
  { label: 'Legitimate interest assessments', category: 'Processing Concepts', w: [['legitimate interest', 3], ['balancing test', 2], ['lia', 1]] },
  { label: 'Consent management', category: 'Processing Concepts', w: [['withdraw consent', 3], ['consent', 1], ['granular consent', 3]] },
  { label: 'Processing records', category: 'Processing Concepts', w: [['records of processing', 3], ['article 30', 2], ['processing activities', 2]] },
  { label: 'Territorial applicability', category: 'Processing Concepts', w: [['territorial scope', 3], ['article 3', 2], ['extra-territorial', 2]] },
  { label: 'Data Protection Officers', category: 'Processing Concepts', w: [['data protection officer', 4], ['dpo', 3], ['article 37', 2]] },
  { label: 'Transparency and information duties', category: 'Processing Concepts', w: [['privacy notice', 3], ['privacy policy', 2], ['information to data subjects', 3]] },
  { label: 'Cloud services and outsourcing', category: 'Processing Concepts', w: [['cloud provider', 3], ['cloud service', 2], ['subprocessor', 3], ['sub-processor', 3], ['outsourcing', 2]] },
  { label: 'Connected vehicles and mobility', category: 'Sector-Specific Areas', w: [['connected vehicle', 3], ['vehicle data', 2], ['automotive data', 2]] },
  { label: 'Video surveillance systems', category: 'Sector-Specific Areas', w: [['cctv', 2], ['video surveillance', 3], ['surveillance camera', 2]] },
  { label: 'Health data in research', category: 'Sector-Specific Areas', w: [['health data', 3], ['clinical trial', 2], ['patient data', 2]] },
  { label: 'Deceptive design patterns', category: 'Sector-Specific Areas', w: [['dark pattern', 4], ['deceptive design', 3]] },
  { label: 'Electronic communications privacy', category: 'Sector-Specific Areas', w: [['e-privacy', 2], ['eprivacy', 2], ['cookie', 1], ['pecr', 2]] },
  { label: 'Online platforms and social media', category: 'Sector-Specific Areas', w: [['social media', 2], ['online platform', 2], ['gatekeeper', 2]] },
  { label: 'Employment and HR data', category: 'Sector-Specific Areas', w: [['employee data', 3], ['workplace', 2], ['human resources', 2], ['recruitment', 2]] },
  { label: 'Ad tech and online advertising', category: 'Sector-Specific Areas', w: [['ad tech', 3], ['adtech', 3], ['online advertising', 2], ['programmatic', 2]] },
  { label: 'Cybersecurity certifications', category: 'Cybersecurity', w: [['cybersecurity certification', 4], ['security certification', 2]] },
  { label: 'Location data handling', category: 'Cybersecurity', w: [['location data', 3], ['geolocation', 3], ['location tracking', 2]] },
  { label: 'Security processing measures', category: 'Cybersecurity', w: [
    ['security of processing', 3], ['article 32', 2], ['technical and organisational', 2], ['encryption', 2], ['ransomware', 2], ['cyber attack', 2]
  ]},
  { label: 'NIS2 and cyber resilience', category: 'Cybersecurity', w: [['nis2', 4], ['nis 2', 3], ['cyber resilience', 3]] },
  { label: 'Institutional data protection', category: 'Oversight Areas', w: [
    ['edps', 4], ['2018/1725', 4], ['eu institutions', 2], ['prior consultation', 3], ['supervisory', 2]
  ]},
  { label: 'Consistency mechanisms', category: 'Oversight Areas', w: [['consistency', 3], ['consistency opinion', 4], ['urgent binding', 3]] },
  { label: 'Legislative proposals', category: 'Oversight Areas', w: [
    ['digital services act', 2], ['digital markets act', 2], ['european health data space', 2], ['commission', 1], ['press release', 1], ['proposal for', 2]
  ]},
  { label: 'International data protection cooperation', category: 'Oversight Areas', w: [
    ['global privacy', 3], ['international conference', 2], ['multilateral', 2], ['cross-border cooperation', 2]
  ]}
];

const MIN_TOPIC_INFERENCE_SCORE = 3;

function hasGdprRelevanceForInference(blob) {
  const b = String(blob || '');
  if (
    /\b(gdpr|personal data|data subject|regulation \(eu\) 2016\/679|regulation 2016\/679|supervisory authority|data protection authority|information commissioner)\b/i.test(
      b
    )
  ) {
    return true;
  }
  if (/\b(edpb|edps)\b/i.test(b)) return true;
  if (/\bico\b/i.test(b) && /\b(data|privacy|gdpr|protection|personal|information commissioner)\b/i.test(b)) return true;
  if (/\b(data protection|privacy)\b/i.test(b) && /\b(personal|gdpr|processing|lawful)\b/i.test(b)) return true;
  return false;
}

function inferTopicFromKeywordScores(blob) {
  const low = String(blob || '').toLowerCase();
  if (!hasGdprRelevanceForInference(low)) return null;
  let best = null;
  let bestScore = 0;
  for (const rule of TOPIC_INFERENCE_RULES) {
    let s = 0;
    for (const [term, weight] of rule.w) {
      if (low.includes(term)) s += weight;
    }
    if (s > bestScore) {
      bestScore = s;
      best = { topic: rule.label, topicCategory: rule.category };
    }
  }
  if (best && bestScore >= MIN_TOPIC_INFERENCE_SCORE) return best;
  return null;
}

function newsTopicSearchBlob(item) {
  const title = String((item && item.title) || '');
  const snippet = String((item && item.snippet) || '');
  const url = String((item && item.url) || '');
  return `${title} ${snippet} ${url}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * First matching topic in group order (specific topics listed before broader ones).
 * @returns {{ topic: string, topicCategory: string }}
 */
function classifyNewsItemTopic(item) {
  const b = newsTopicSearchBlob(item);
  if (!b) {
    return { topic: NEWS_TOPIC_FALLBACK, topicCategory: 'General' };
  }
  for (const g of NEWS_TOPIC_GROUPS) {
    for (const t of g.topics) {
      const patterns = t.patterns || [];
      for (const re of patterns) {
        try {
          if (re.test(b)) {
            return { topic: t.label, topicCategory: g.category };
          }
        } catch {
          /* ignore bad pattern */
        }
      }
    }
  }
  const inferred = inferTopicFromKeywordScores(b);
  if (inferred) return inferred;
  if (hasGdprRelevanceForInference(b)) {
    return { topic: UMBRELLA_TOPIC_LABEL, topicCategory: 'Oversight Areas' };
  }
  return { topic: NEWS_TOPIC_FALLBACK, topicCategory: 'General' };
}

function assignNewsTopicFields(item) {
  if (!item || typeof item !== 'object') return item;
  const { topic, topicCategory } = classifyNewsItemTopic(item);
  return { ...item, topic, topicCategory };
}

function pickRicherTopic(existingTopic, incomingTopic) {
  const et = String(existingTopic || '').trim();
  const it = String(incomingTopic || '').trim();
  if (it && it !== NEWS_TOPIC_FALLBACK) return it;
  if (et && et !== NEWS_TOPIC_FALLBACK) return et;
  return it || et || NEWS_TOPIC_FALLBACK;
}

function mergeNewsItemTopicFields(existing, incoming) {
  const et = String((existing && existing.topic) || '').trim();
  const it = String((incoming && incoming.topic) || '').trim();
  const ec = String((existing && existing.topicCategory) || '').trim();
  const ic = String((incoming && incoming.topicCategory) || '').trim();
  const topic = pickRicherTopic(et, it);
  let topicCategory = '';
  if (topic === it && ic) topicCategory = ic;
  else if (topic === et && ec) topicCategory = ec;
  else topicCategory = ic || ec;
  return { topic, topicCategory };
}

/** API + UI: category headings and leaf labels, plus catch-all group. */
function getTopicTaxonomyForClient() {
  const groups = NEWS_TOPIC_GROUPS.map((g) => ({
    category: g.category,
    topics: g.topics.map((t) => ({ label: t.label }))
  }));
  groups.push({ category: 'General', topics: [{ label: NEWS_TOPIC_FALLBACK }] });
  return {
    groups,
    fallbackTopic: NEWS_TOPIC_FALLBACK
  };
}

function getFlatTopicLabelsInOrder() {
  const out = [];
  for (const g of NEWS_TOPIC_GROUPS) {
    for (const t of g.topics) {
      out.push(t.label);
    }
  }
  out.push(NEWS_TOPIC_FALLBACK);
  return out;
}

/**
 * When the main GDPR gate misses niche phrasing, keep items that clearly match a taxonomy topic
 * plus a data-protection anchor term (same sources; broader recall).
 */
function newsBlobMatchesTopicAnchor(normalizedBlob) {
  const b = String(normalizedBlob || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (b.length < 14) return false;
  const dp =
    /\b(personal data|data protection|privacy|\bgdpr\b|data subject|supervisory authorit|information commissioner|\bedpb\b|\bedps\b)\b/.test(
      b
    );
  if (!dp) return false;
  for (const g of NEWS_TOPIC_GROUPS) {
    for (const t of g.topics) {
      for (const re of t.patterns) {
        try {
          if (re.test(b)) return true;
        } catch {
          /* ignore */
        }
      }
    }
  }
  return false;
}

module.exports = {
  NEWS_TOPIC_FALLBACK,
  NEWS_TOPIC_GROUPS,
  newsTopicSearchBlob,
  classifyNewsItemTopic,
  assignNewsTopicFields,
  mergeNewsItemTopicFields,
  getTopicTaxonomyForClient,
  getFlatTopicLabelsInOrder,
  newsBlobMatchesTopicAnchor
};
