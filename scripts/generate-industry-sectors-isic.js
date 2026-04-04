/**
 * Generates public/industry-sectors.json with UN ISIC Rev.4 sections A–U and all official divisions.
 * Run from repo root: node scripts/generate-industry-sectors-isic.js
 * Titles follow ISIC Rev.4 (ILO-compatible industry classification for labour-market statistics).
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'industry-sectors.json');

/** ISIC Rev.4 divisions: code -> official short title (EN). */
const DIVISIONS = [
  [1, 'Crop and animal production, hunting and related service activities', 'A'],
  [2, 'Forestry and logging', 'A'],
  [3, 'Fishing and aquaculture', 'A'],
  [5, 'Mining of coal and lignite', 'B'],
  [6, 'Extraction of crude petroleum and natural gas', 'B'],
  [7, 'Mining of metal ores', 'B'],
  [8, 'Other mining and quarrying', 'B'],
  [9, 'Mining support service activities', 'B'],
  [10, 'Manufacture of food products', 'C'],
  [11, 'Manufacture of beverages', 'C'],
  [12, 'Manufacture of tobacco products', 'C'],
  [13, 'Manufacture of textiles', 'C'],
  [14, 'Manufacture of wearing apparel', 'C'],
  [15, 'Manufacture of leather and related products', 'C'],
  [16, 'Manufacture of wood and of products of wood and cork, except furniture', 'C'],
  [17, 'Manufacture of paper and paper products', 'C'],
  [18, 'Printing and reproduction of recorded media', 'C'],
  [19, 'Manufacture of coke and refined petroleum products', 'C'],
  [20, 'Manufacture of chemicals and chemical products', 'C'],
  [21, 'Manufacture of basic pharmaceutical products and pharmaceutical preparations', 'C'],
  [22, 'Manufacture of rubber and plastic products', 'C'],
  [23, 'Manufacture of other non-metallic mineral products', 'C'],
  [24, 'Manufacture of basic metals', 'C'],
  [25, 'Manufacture of fabricated metal products, except machinery and equipment', 'C'],
  [26, 'Manufacture of computer, electronic and optical products', 'C'],
  [27, 'Manufacture of electrical equipment', 'C'],
  [28, 'Manufacture of machinery and equipment n.e.c.', 'C'],
  [29, 'Manufacture of motor vehicles, trailers and semi-trailers', 'C'],
  [30, 'Manufacture of other transport equipment', 'C'],
  [31, 'Manufacture of furniture', 'C'],
  [32, 'Other manufacturing', 'C'],
  [33, 'Repair and installation of machinery and equipment', 'C'],
  [35, 'Electricity, gas, steam and air conditioning supply', 'D'],
  [36, 'Water collection, treatment and supply', 'E'],
  [37, 'Sewerage', 'E'],
  [38, 'Waste collection, treatment and disposal activities; materials recovery', 'E'],
  [39, 'Remediation activities and other waste management service activities', 'E'],
  [41, 'Construction of buildings', 'F'],
  [42, 'Civil engineering', 'F'],
  [43, 'Specialised construction activities', 'F'],
  [45, 'Wholesale and retail trade and repair of motor vehicles and motorcycles', 'G'],
  [46, 'Wholesale trade, except of motor vehicles and motorcycles', 'G'],
  [47, 'Retail trade, except of motor vehicles and motorcycles', 'G'],
  [49, 'Land transport and transport via pipelines', 'H'],
  [50, 'Water transport', 'H'],
  [51, 'Air transport', 'H'],
  [52, 'Warehousing and support activities for transportation', 'H'],
  [53, 'Postal and courier activities', 'H'],
  [55, 'Accommodation', 'I'],
  [56, 'Food and beverage service activities', 'I'],
  [58, 'Publishing activities', 'J'],
  [59, 'Motion picture, video and television programme production, sound recording and music publishing', 'J'],
  [60, 'Programming and broadcasting activities', 'J'],
  [61, 'Telecommunications', 'J'],
  [62, 'Computer programming, consultancy and related activities', 'J'],
  [63, 'Information service activities and other information service activities', 'J'],
  [64, 'Financial service activities, except insurance and pension funding', 'K'],
  [65, 'Insurance, reinsurance and pension funding, except compulsory social security', 'K'],
  [66, 'Activities auxiliary to financial services and insurance activities', 'K'],
  [68, 'Real estate activities', 'L'],
  [69, 'Legal and accounting activities', 'M'],
  [70, 'Activities of head offices; management consultancy activities', 'M'],
  [71, 'Architectural and engineering activities; technical testing and analysis', 'M'],
  [72, 'Scientific research and development', 'M'],
  [73, 'Advertising and market research', 'M'],
  [74, 'Other professional, scientific and technical activities', 'M'],
  [75, 'Veterinary activities', 'M'],
  [77, 'Rental and leasing activities', 'N'],
  [78, 'Employment activities', 'N'],
  [79, 'Travel agency, tour operator reservation service and related activities', 'N'],
  [80, 'Security and investigation activities', 'N'],
  [81, 'Services to buildings and landscape activities', 'N'],
  [82, 'Office administrative, office support and other business support activities', 'N'],
  [84, 'Public administration and defence; compulsory social security', 'O'],
  [85, 'Education', 'P'],
  [86, 'Human health activities', 'Q'],
  [87, 'Residential care activities', 'Q'],
  [88, 'Social work activities without accommodation', 'Q'],
  [90, 'Creative, arts and entertainment activities', 'R'],
  [91, 'Libraries, archives, museums and other cultural activities', 'R'],
  [92, 'Gambling and betting activities', 'R'],
  [93, 'Sports activities and amusement and recreation activities', 'R'],
  [94, 'Activities of membership organisations', 'S'],
  [95, 'Repair of computers and personal and household goods', 'S'],
  [96, 'Other personal service activities', 'S'],
  [97, 'Activities of households as employers of domestic personnel', 'T'],
  [98, 'Undifferentiated goods- and services-producing activities of private households for own use', 'T'],
  [99, 'Activities of extraterritorial organisations and bodies', 'U']
];

const SECTIONS = [
  ['GENERAL', 'General — no sector-specific framing', null, '', 'Default: balanced GDPR Q&A without industry emphasis.'],
  ['A', 'A — Agriculture, forestry and fishing', 'A', 'agriculture forestry fishing farming crops livestock aquaculture rural food primary sector', 'UN ISIC Rev.4 Section A (divisions 01–03); ILO-compatible primary-sector / rural employment groupings.'],
  ['B', 'B — Mining and quarrying', 'B', 'mining quarrying extraction minerals oil gas natural resources site safety', 'UN ISIC Rev.4 Section B (divisions 05–09).'],
  ['C', 'C — Manufacturing', 'C', 'manufacturing industry factory production supply chain industrial processing', 'UN ISIC Rev.4 Section C (divisions 10–33).'],
  ['D', 'D — Electricity, gas, steam and air conditioning supply', 'D', 'energy utility electricity gas power grid critical infrastructure', 'UN ISIC Rev.4 Section D (division 35).'],
  ['E', 'E — Water supply; sewerage, waste management and remediation', 'E', 'water waste sewage environmental remediation utilities municipal', 'UN ISIC Rev.4 Section E (divisions 36–39).'],
  ['F', 'F — Construction', 'F', 'construction building civil engineering contractors site workers subcontractor', 'UN ISIC Rev.4 Section F (divisions 41–43).'],
  ['G', 'G — Wholesale and retail trade', 'G', 'retail wholesale commerce e-commerce customer loyalty card payment POS shopper', 'UN ISIC Rev.4 Section G (divisions 45–47).'],
  ['H', 'H — Transportation and storage', 'H', 'transport logistics shipping aviation rail road freight warehouse mobility passenger data', 'UN ISIC Rev.4 Section H (divisions 49–53).'],
  ['I', 'I — Accommodation and food service activities', 'I', 'hospitality hotel restaurant catering tourism guest booking', 'UN ISIC Rev.4 Section I (divisions 55–56).'],
  ['J', 'J — Information and communication', 'J', 'ICT software telecom internet publishing broadcasting digital services SaaS platform', 'UN ISIC Rev.4 Section J (divisions 58–63); strong overlap with online services under GDPR.'],
  ['K', 'K — Financial and insurance activities', 'K', 'bank insurance fintech payment credit investment AML financial data', 'UN ISIC Rev.4 Section K (divisions 64–66); intersects with sector-specific EU/EEA financial rules alongside GDPR.'],
  ['L', 'L — Real estate activities', 'L', 'real estate property letting leasing facility management landlord tenant', 'UN ISIC Rev.4 Section L (division 68).'],
  ['M', 'M — Professional, scientific and technical activities', 'M', 'consulting legal accounting engineering R&D technical services professional services', 'UN ISIC Rev.4 Section M (divisions 69–75).'],
  ['N', 'N — Administrative and support service activities', 'N', 'outsourcing HR agency call center facilities employment activities support services', 'UN ISIC Rev.4 Section N (divisions 77–82); often involves processor / joint-controller scenarios.'],
  ['O', 'O — Public administration and defence; compulsory social security', 'O', 'government public sector defence military law enforcement social security public authority', 'UN ISIC Rev.4 Section O (division 84); Chapter 2 GDPR exclusions for purely public tasks may apply in some Member States — cite sources only.'],
  ['P', 'P — Education', 'P', 'school university training students children pupil records edtech', 'UN ISIC Rev.4 Section P (division 85).'],
  ['Q', 'Q — Human health and social work activities', 'Q', 'healthcare hospital clinic medical patient health data social care nursing GDPR health', 'UN ISIC Rev.4 Section Q (divisions 86–88); often overlaps with special-category data in GDPR.'],
  ['R', 'R — Arts, entertainment and recreation', 'R', 'media sports culture gaming events entertainment creative industries', 'UN ISIC Rev.4 Section R (divisions 90–93).'],
  ['S', 'S — Other service activities', 'S', 'personal services repair membership organisations miscellaneous services', 'UN ISIC Rev.4 Section S (divisions 94–96).'],
  ['T', 'T — Activities of households as employers; undifferentiated goods and services', 'T', 'domestic employer household staff private employment', 'UN ISIC Rev.4 Section T (divisions 97–98).'],
  ['U', 'U — Activities of extraterritorial organisations and bodies', 'U', 'international organisation embassy extraterritorial IO NGO treaty', 'UN ISIC Rev.4 Section U (division 99).']
];

function divisionSearchTerms(code, title, section) {
  const t = title.toLowerCase();
  const base = `isic ${String(code).padStart(2, '0')} division ${code} section ${section} personal data processing`;
  const words = t.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3).slice(0, 12);
  return `${base} ${words.join(' ')}`.trim();
}

const out = [];

for (const s of SECTIONS) {
  out.push({
    id: s[0],
    label: s[1],
    isicSection: s[2],
    isicDivision: null,
    searchTerms: s[3],
    framework: s[4]
  });
}

for (const [code, title, section] of DIVISIONS) {
  const dd = String(code).padStart(2, '0');
  out.push({
    id: `ISIC-${dd}`,
    label: `${dd} — ${title}`,
    isicSection: section,
    isicDivision: dd,
    searchTerms: divisionSearchTerms(code, title, section),
    framework: `UN ISIC Rev.4 Division ${dd} (Section ${section}); ILO-compatible industry detail.`
  });
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('Wrote', out.length, 'entries to', OUT);
