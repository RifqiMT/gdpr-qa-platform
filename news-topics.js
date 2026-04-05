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
          /security of processing|article\s*32|technical and organisational measures|technical and organizational measures|encryption.*(personal data|processing)/i
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
          /eu institutions.*(data protection)|regulation\s*2018\/1725|\b2018\/1725\b|institutional data protection|\bedps\b.*(institution|eu institution)/i
        ]
      },
      {
        label: 'Consistency mechanisms',
        patterns: [/consistency mechanism|consistency opinion|\bedpb\b.*consistency|urgent binding decision/i]
      },
      {
        label: 'Legislative proposals',
        patterns: [
          /legislative proposal|commission proposes|proposed (eu )?regulation|proposal for a regulation|digital services act|\bdma\b.*(eu|european)|digital markets act|european health data space|\behds\b/i
        ]
      }
    ]
  }
];

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
      for (const re of t.patterns) {
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
