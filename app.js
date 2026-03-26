// ─────────────────────────────────────────────
// FIREBASE IMPORTS
// ─────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut,
         onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, setDoc,
         getDocs, updateDoc, onSnapshot,
         serverTimestamp, orderBy, query } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// ─────────────────────────────────────────────
// FIREBASE INIT
// ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBzvsvj2kud5MZVE0erVsshFbXoN3I-NJE",
  authDomain: "biz-audit-ai.firebaseapp.com",
  projectId: "biz-audit-ai",
  storageBucket: "biz-audit-ai.firebasestorage.app",
  messagingSenderId: "169138128801",
  appId: "1:169138128801:web:70cfc91f8f641373c32de0"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

// ─────────────────────────────────────────────
// PHASES DATA (SAME AS ORIGINAL)
// ─────────────────────────────────────────────
const PHASES = [
  {
    color: '#2563eb', name: 'Business discovery',
    desc: 'Identify and document the business entirely from public search results before opening any tool.',
    steps: [
      {
        name: 'Find and confirm the business on Google',
        hint: 'Search the exact business name to see what Google already knows about them.',
        checks: ['Type the exact business name into Google — does a knowledge panel appear?','Open Google Maps — is there a pin with reviews and photos?','Check whether "Permanently closed" appears','Note the top 3 search result URLs'],
        example: 'Search "Al-Fatah Superstore Lahore". A knowledge panel appears showing 4.1 stars, 312 reviews. No "permanently closed" label. Top results: their website, a Facebook page, and a Yelp listing.',
        tools: ['Google Search', 'Google Maps'],
        output: 'Business status and search footprint recorded',
        fields: [
          { key: 'status', label: 'Business Status', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Not Found / Closed','Unclear','Active & Confirmed','N/A'] },
          { key: 'notes', label: 'Observations', type: 'textarea', placeholder: 'Describe the Knowledge Panel, Maps presence, and top search URLs…', rows: 3 }
        ]
      },
      {
        name: 'Record every publicly visible data point',
        hint: 'In one single pass, copy everything Google surfaces before clicking any link.',
        checks: ['Exact business name as shown on Maps','Full address including neighborhood','Phone number on the panel','Website URL','Category label','Star rating and total review count','Hours of operation','Number of photos in the panel strip'],
        example: '"Yasmin Boutique Lahore": 23 MM Alam Road, Gulberg III. 0300-1234567. No website. Women\'s clothing store. 3.8★ / 47 reviews. 11am–9pm daily. 8 photos.',
        tools: ['Google Maps', 'Google Search'],
        output: 'All 8 baseline data points recorded',
        fields: [
          { key: 'business_name', label: 'Business Name (exact, as on Maps)', type: 'textarea', placeholder: 'Exact name…', rows: 1 },
          { key: 'address', label: 'Full Address', type: 'textarea', placeholder: 'Full address including area…', rows: 1 },
          { key: 'phone', label: 'Phone Number', type: 'textarea', placeholder: '0300-…', rows: 1 },
          { key: 'website', label: 'Website URL', type: 'textarea', placeholder: 'https://… (or "none listed")', rows: 1 },
          { key: 'category', label: 'Category & Star Rating', type: 'textarea', placeholder: 'e.g. Women\'s clothing store — 3.8★, 47 reviews', rows: 1 },
          { key: 'hours', label: 'Hours of Operation', type: 'textarea', placeholder: 'e.g. 11am–9pm daily', rows: 1 },
          { key: 'photo_count', label: 'Photo count in panel', type: 'textarea', placeholder: 'e.g. 8 photos', rows: 1 },
          { key: 'notes', label: 'Anything else visible', type: 'textarea', placeholder: 'Posts, Q&A, booking button…', rows: 2 }
        ]
      }
    ]
  },
  {
    color: '#0f9d58', name: 'Google Business Profile',
    desc: 'Everything here is audited from the public Maps listing — no GBP dashboard or owner login needed.',
    steps: [
      {
        name: 'Check if the listing is claimed or unclaimed',
        hint: 'An unclaimed listing has an "Own this business?" link visible at the bottom of the panel.',
        checks: ['Scroll to the bottom of the Maps panel — does "Own this business?" appear?','If claimed: is there a verified checkmark?','Search the business name + city — do two separate map pins appear?'],
        example: '"Karachi Bites Restaurant" on Maps shows "Own this business?" — UNCLAIMED. The business cannot respond to reviews, update hours, or add photos.',
        tools: ['Google Maps'],
        output: 'Claim status recorded',
        fields: [
          { key: 'claimed', label: 'Claim Status', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Unclaimed ⚠️','Unverified','Claimed ✓','N/A'] },
          { key: 'duplicates', label: 'Duplicate listings found?', type: 'textarea', placeholder: 'Yes / No — describe if found', rows: 1 },
          { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional observations…', rows: 2 }
        ]
      },
      {
        name: 'NAP consistency across 5 sources',
        hint: 'Name, Address, Phone must be identical on every platform. Even small differences hurt local ranking.',
        checks: ['Copy the NAP exactly from Google Maps','Check Yelp — does address format match exactly?','Check Facebook — does phone match character-for-character?','Check Apple Maps (maps.apple.com)','Visit their website footer'],
        example: 'Google: "Shop 4, Liberty Market, Lahore." Yelp: "Liberty Market Lahore." Facebook: "4 Liberty Market, Lahore, Punjab." — 3 different formats.',
        tools: ['Google Maps', 'Yelp', 'Facebook', 'Apple Maps', 'Website'],
        output: 'NAP from each platform recorded verbatim',
        fields: [
          { key: 'status', label: 'NAP Consistency', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Inconsistent','Minor Issues','Consistent','N/A'] },
          { key: 'nap_google', label: 'Google Maps NAP (exact)', type: 'textarea', placeholder: 'Name / Address / Phone as shown…', rows: 1 },
          { key: 'nap_yelp', label: 'Yelp NAP (exact)', type: 'textarea', placeholder: 'Name / Address / Phone — or "not found"', rows: 1 },
          { key: 'nap_facebook', label: 'Facebook NAP (exact)', type: 'textarea', placeholder: 'Name / Address / Phone — or "not found"', rows: 1 },
          { key: 'nap_apple', label: 'Apple Maps NAP (exact)', type: 'textarea', placeholder: 'Name / Address / Phone — or "not found"', rows: 1 },
          { key: 'nap_website', label: 'Website footer NAP (exact)', type: 'textarea', placeholder: 'Name / Address / Phone — or "not found"', rows: 1 }
        ]
      },
      {
        name: 'Categories, attributes, and GBP description',
        hint: 'Review how the listing describes itself — all visible from the public Maps panel.',
        checks: ['What is the primary category shown?','Click "See more" — secondary categories?','Is a business description visible? Copy it verbatim.','Any attributes shown? (Women-owned, wheelchair accessible, delivery)'],
        example: 'A dental clinic listed under "Doctor" instead of "Dentist." Description: "We provide dental services." — no city, no specialisations.',
        tools: ['Google Maps'],
        output: 'Category, description, and attributes captured verbatim',
        fields: [
          { key: 'status', label: 'GBP Completeness', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Poor','Needs Work','Good','N/A'] },
          { key: 'category', label: 'Primary category shown', type: 'textarea', placeholder: 'e.g. "Doctor"', rows: 1 },
          { key: 'secondary_cats', label: 'Secondary categories (if any)', type: 'textarea', placeholder: 'List all shown, or "none"', rows: 1 },
          { key: 'gbp_description', label: 'GBP description (copy verbatim)', type: 'textarea', placeholder: 'Exact text from Maps, or "none"', rows: 3 },
          { key: 'attributes', label: 'Attributes visible', type: 'textarea', placeholder: 'e.g. Women-owned, Delivery — or "none shown"', rows: 1 }
        ]
      },
      {
        name: 'Photos audit',
        hint: 'Count and assess every photo visible publicly on their Maps listing.',
        checks: ['Click the photo strip — how many total?','Owner-uploaded vs customer photos?','What do photos show: interior, exterior, products, team?','Check top 2 competitors — photo counts?'],
        example: 'A restaurant: 6 photos, all customer-taken, dim and blurry. Competitor 1: 94 photos. Competitor 2: 47 photos.',
        tools: ['Google Maps'],
        output: 'Photo count, quality notes, competitor comparison',
        fields: [
          { key: 'status', label: 'Photo Health', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Critical (<10)','Needs Work','Good','N/A'] },
          { key: 'total_photos', label: 'Total photo count', type: 'textarea', placeholder: 'e.g. 6', rows: 1 },
          { key: 'owner_photos', label: 'Owner vs customer photos', type: 'textarea', placeholder: 'e.g. 0 owner / 6 customer', rows: 1 },
          { key: 'photo_types', label: 'What the photos show', type: 'textarea', placeholder: 'e.g. 4 food, 2 exterior — no interior, no team', rows: 1 },
          { key: 'competitor_photos', label: 'Competitor photo counts', type: 'textarea', placeholder: 'Competitor A: 94 | Competitor B: 47', rows: 1 }
        ]
      },
      {
        name: 'Reviews — volume, rating, recency, response rate',
        hint: 'Analyze all publicly visible reviews without any account access.',
        checks: ['Total review count','Average star rating — below 4.0 is a red flag','Click "Most recent" — when was the last review?','Scroll 15-20 reviews — recurring complaints?','Owner response rate?'],
        example: 'A beauty salon: 23 reviews, 3.6★. Last review 4 months ago. Three reviews mention "long wait times." Owner responded to 2 of 23 — both 5-star.',
        tools: ['Google Maps'],
        output: 'Review stats and observation notes',
        fields: [
          { key: 'status', label: 'Review Health', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Critical (<3.9)','Needs Work','Good (4.0+)','N/A'] },
          { key: 'rating', label: 'Star rating', type: 'textarea', placeholder: 'e.g. 3.6', rows: 1 },
          { key: 'review_count', label: 'Total review count', type: 'textarea', placeholder: 'e.g. 23', rows: 1 },
          { key: 'last_review', label: 'Most recent review date', type: 'textarea', placeholder: 'e.g. 4 months ago', rows: 1 },
          { key: 'response_rate', label: 'Owner responses out of total', type: 'textarea', placeholder: 'e.g. 2 of 23 (both 5-star, negatives ignored)', rows: 1 },
          { key: 'review_themes', label: 'Recurring themes in reviews', type: 'textarea', placeholder: 'Positive: … | Negative: …', rows: 2 }
        ]
      }
    ]
  },
  {
    color: '#e37400', name: 'Website audit',
    desc: 'Every tool used here is free and public-facing. No login or owner access required.',
    steps: [
      {
        name: 'First impressions and homepage clarity',
        hint: 'Open the website as a first-time visitor. Can you understand who they are in 5 seconds?',
        checks: ['Does the headline state what they do and where?','Visible phone number or CTA above the fold?','Open on mobile — does it display correctly?','Does the copyright year suggest active maintenance?'],
        example: 'herbaldoc.pk on mobile shows a desktop-only layout. Headline reads "Welcome to Our Website." Phone buried 3 clicks away. Footer says 2019.',
        tools: ['Browser (mobile)'],
        output: 'Homepage data captured verbatim',
        fields: [
          { key: 'status', label: 'First Impression', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Poor','Needs Work','Good','N/A'] },
          { key: 'url', label: 'Website URL', type: 'textarea', placeholder: 'https://…', rows: 1 },
          { key: 'current_headline', label: 'Current homepage headline (copy verbatim)', type: 'textarea', placeholder: 'Exact H1 or main headline text…', rows: 1 },
          { key: 'cta_above_fold', label: 'CTA / phone visible above fold?', type: 'textarea', placeholder: 'Yes / No — describe what is visible', rows: 1 },
          { key: 'mobile_display', label: 'Mobile display', type: 'textarea', placeholder: 'e.g. Broken / works fine / no mobile menu', rows: 1 },
          { key: 'copyright_year', label: 'Copyright year in footer', type: 'textarea', placeholder: 'e.g. 2019', rows: 1 }
        ]
      },
      {
        name: 'Performance — run PageSpeed Insights',
        hint: 'Go to pagespeed.web.dev, enter the URL, and run for mobile.',
        checks: ['Mobile score: below 50 = critical, 50–89 = needs work, 90+ = good','Desktop score','Top 3 "Opportunities" listed','LCP — over 4s on mobile is a ranking issue'],
        example: 'Karachi law firm: Mobile 23/100. Desktop 51/100. Top opportunity: eliminate render-blocking resources — saves 3.1s. LCP: 8.2s.',
        tools: ['PageSpeed Insights (pagespeed.web.dev)'],
        output: 'PageSpeed scores and issues recorded',
        fields: [
          { key: 'status', label: 'Performance Grade', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Critical (<50)','Needs Work','Good (90+)','N/A'] },
          { key: 'mobile_score', label: 'Mobile score', type: 'textarea', placeholder: 'e.g. 23', rows: 1 },
          { key: 'desktop_score', label: 'Desktop score', type: 'textarea', placeholder: 'e.g. 51', rows: 1 },
          { key: 'lcp', label: 'LCP', type: 'textarea', placeholder: 'e.g. 8.2s', rows: 1 },
          { key: 'top_issues', label: 'Top opportunities from PageSpeed', type: 'textarea', placeholder: '1. Eliminate render-blocking — saves 3.1s\n2. …\n3. …', rows: 3 }
        ]
      },
      {
        name: 'SEO basics — check from the browser',
        hint: 'The most critical on-page SEO elements can be verified in under 5 minutes.',
        checks: ['Right-click → View Source → check <title> — includes business name and city?','Find meta description — present and under 160 chars?','Clear H1 heading?','site:domain.com — how many pages indexed?'],
        example: 'Restaurant: Title = "Home — Welcome." Meta description missing. 3 pages indexed. H1 = "Food is Life."',
        tools: ['Browser View Source', 'Google Search (site: command)'],
        output: 'Current SEO tags recorded verbatim',
        fields: [
          { key: 'status', label: 'SEO Health', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Critical','Needs Work','Good','N/A'] },
          { key: 'title_tag', label: 'Current <title> tag (copy verbatim)', type: 'textarea', placeholder: 'e.g. "Home — Welcome"', rows: 1 },
          { key: 'meta_desc', label: 'Current meta description (copy verbatim)', type: 'textarea', placeholder: 'Exact text, or "missing"', rows: 2 },
          { key: 'h1', label: 'Current H1 (copy verbatim)', type: 'textarea', placeholder: 'e.g. "Food is Life"', rows: 1 },
          { key: 'indexed_pages', label: 'Indexed pages (site: command)', type: 'textarea', placeholder: 'e.g. 3 pages indexed', rows: 1 }
        ]
      },
      {
        name: 'Technical check — SSL, sitemap, errors',
        hint: 'Three quick public checks revealing major problems invisible to the owner.',
        checks: ['Does URL show https://?','Visit domain.com/sitemap.xml — 404?','Visit domain.com/robots.txt — blocks everything?','Click 3-4 internal links — any 404s?'],
        example: 'A Lahore home services site: http:// only. sitemap.xml = 404. robots.txt has "Disallow: /" — Google cannot index a single page.',
        tools: ['Browser', 'SSL Labs (ssllabs.com/ssltest)'],
        output: 'Technical check results recorded',
        fields: [
          { key: 'ssl', label: 'SSL (https)', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['No HTTPS ⚠️','Mixed Content','Secure ✓','N/A'] },
          { key: 'sitemap', label: 'sitemap.xml status', type: 'textarea', placeholder: '404 / exists and valid', rows: 1 },
          { key: 'robots', label: 'robots.txt status', type: 'textarea', placeholder: '"Disallow: /" blocks all / normal', rows: 1 },
          { key: 'broken_links', label: 'Broken links found', type: 'textarea', placeholder: 'Contact page → 404 / none found', rows: 1 }
        ]
      },
      {
        name: 'Design and trust signals',
        hint: 'Assess whether the site makes a stranger want to trust and contact this business.',
        checks: ['Real customer testimonials or review screenshots?','About section with real team photos (not stock)?','Certifications, awards, years in business?','Pricing visible?','Platform (use Wappalyzer)?'],
        example: 'A private school: no teacher photos, no parent testimonials, no fee structure. Competitor: real classroom photos, parent quotes, O-Level results, "Book a Tour" button.',
        tools: ['Browser', 'Wappalyzer (free Chrome extension)'],
        output: 'Trust signals inventory recorded',
        fields: [
          { key: 'status', label: 'Trust Signal Score', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Very Weak','Needs Work','Strong','N/A'] },
          { key: 'platform', label: 'Platform / CMS (Wappalyzer)', type: 'textarea', placeholder: 'e.g. WordPress with Avada theme', rows: 1 },
          { key: 'testimonials', label: 'Testimonials present?', type: 'textarea', placeholder: 'Yes / No / Stock quotes only', rows: 1 },
          { key: 'about_photos', label: 'Real team / about photos?', type: 'textarea', placeholder: 'Yes / No / Stock photos only', rows: 1 },
          { key: 'credentials', label: 'Certifications / awards visible?', type: 'textarea', placeholder: 'Yes — list them / No', rows: 1 },
          { key: 'pricing', label: 'Pricing visible?', type: 'textarea', placeholder: 'Yes / No / "Contact for price"', rows: 1 }
        ]
      }
    ]
  },
  {
    color: '#7c3aed', name: 'LLM visibility (GEO)',
    desc: 'Test how the business appears when real people ask AI assistants about their service category.',
    steps: [
      {
        name: 'Test on ChatGPT',
        hint: 'Run two types of searches and record the results before they change.',
        checks: ['Search "best [service] in [city]" — does this business appear?','Search the exact business name — does ChatGPT know anything?','Note which competitors appear instead'],
        example: '"Best physiotherapy clinics in Lahore" lists 5 clinics. Rehab Plus — not mentioned despite 4.3★ on Google.',
        tools: ['ChatGPT (chat.openai.com)'],
        output: 'ChatGPT result data recorded',
        fields: [
          { key: 'status', label: 'ChatGPT Visibility', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Not Found','Mentioned','Listed','N/A'] },
          { key: 'query_1', label: 'Query 1 used', type: 'textarea', placeholder: 'e.g. "best physiotherapy clinics in Lahore"', rows: 1 },
          { key: 'result_1', label: 'Query 1 result', type: 'textarea', placeholder: 'Did this business appear? What was said?', rows: 2 },
          { key: 'query_2', label: 'Query 2 (business name)', type: 'textarea', placeholder: 'e.g. "Rehab Plus Lahore"', rows: 1 },
          { key: 'result_2', label: 'Query 2 result', type: 'textarea', placeholder: 'Did ChatGPT know anything about them?', rows: 2 },
          { key: 'competitors_llm', label: 'Competitors listed instead', type: 'textarea', placeholder: 'List all competitors that appeared', rows: 2 }
        ]
      },
      {
        name: 'Test on Google Gemini',
        hint: 'Gemini draws from Google\'s own GBP data — results differ meaningfully from ChatGPT.',
        checks: ['Run the same queries on Gemini','Does Gemini pull from GBP data?','Does an AI Overview appear in regular Google Search for their business name?'],
        example: '"Wedding photographers in Karachi": 4 listed. One appears because GBP has 200+ reviews and Schema markup. Business with 18 reviews ignored.',
        tools: ['Google Gemini (gemini.google.com)', 'Google Search (AI Overviews)'],
        output: 'Gemini result data recorded',
        fields: [
          { key: 'status', label: 'Gemini Visibility', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Not Found','Mentioned','Listed','N/A'] },
          { key: 'gemini_result', label: 'Gemini result', type: 'textarea', placeholder: 'Did this business appear? What was said?', rows: 2 },
          { key: 'ai_overview', label: 'AI Overview on Google Search?', type: 'textarea', placeholder: 'Yes — describe it / No', rows: 1 },
          { key: 'gemini_competitors', label: 'Competitors Gemini listed', type: 'textarea', placeholder: 'List all that appeared', rows: 2 }
        ]
      },
      {
        name: 'Test on Perplexity — check sources cited',
        hint: 'Perplexity shows its sources — this reveals which websites are treated as authorities.',
        checks: ['Run "best [service] in [city]" on Perplexity','Look at the numbered sources below the answer','Is the business website cited?','Which directories appear for competitors?'],
        example: '"Best accountants in Islamabad": cites Zameen.com, Pakistan Today, ICAP.org. Audited firm not cited.',
        tools: ['Perplexity (perplexity.ai)'],
        output: 'Perplexity sources and visibility recorded',
        fields: [
          { key: 'status', label: 'Perplexity Visibility', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Not Found','Mentioned','Listed','N/A'] },
          { key: 'business_cited', label: 'Is this business cited?', type: 'textarea', placeholder: 'Yes / No', rows: 1 },
          { key: 'sources_cited', label: 'All sources Perplexity cited', type: 'textarea', placeholder: '1. ICAP.org  2. Pakistan Today  3. Zameen.com…', rows: 3 },
          { key: 'competitors_cited', label: 'Competitors cited and from which source', type: 'textarea', placeholder: 'Competitor A via ICAP.org…', rows: 2 }
        ]
      }
    ]
  },
  {
    color: '#0891b2', name: 'Local SEO & citations',
    desc: 'Map the full public citation footprint by manually checking each major directory.',
    steps: [
      {
        name: 'Directory presence check',
        hint: 'Check every major directory for this business. No login needed.',
        checks: ['Yelp: listed? Accurate? Owner responded?','Apple Maps: correct address and phone?','Bing Maps: listed correctly?','Facebook Business Page: complete?','Industry-specific: TripAdvisor, Marham, Zameen, PakWheels'],
        example: 'Karachi restaurant: Google — 4.1★. Yelp — not found. Apple Maps — old disconnected phone. Bing — correct. Facebook — no address.',
        tools: ['Yelp', 'Apple Maps', 'Bing Maps', 'Facebook', 'Industry directories'],
        output: 'Directory status per platform',
        fields: [
          { key: 'status', label: 'Citation Health', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Many Gaps','Partial','Good','N/A'] },
          { key: 'yelp', label: 'Yelp', type: 'textarea', placeholder: 'Found / Not found / Found with errors: …', rows: 1 },
          { key: 'apple_maps', label: 'Apple Maps', type: 'textarea', placeholder: 'Found / Not found / Found with errors: …', rows: 1 },
          { key: 'bing', label: 'Bing Maps', type: 'textarea', placeholder: 'Found / Not found / Found with errors: …', rows: 1 },
          { key: 'facebook_biz', label: 'Facebook Business Page', type: 'textarea', placeholder: 'Found / Not found / Found with errors: …', rows: 1 },
          { key: 'industry_dirs', label: 'Industry-specific directories', type: 'textarea', placeholder: 'TripAdvisor: … | Marham: … | Zameen: …', rows: 2 }
        ]
      },
      {
        name: 'Domain authority check',
        hint: 'Use free public tools to understand how much authority their website has.',
        checks: ['moz.com/domain-analysis — note Domain Authority (DA)','ahrefs.com/website-authority-checker — note Domain Rating (DR)','Total referring domains — under 10 is very weak','Run one competitor for comparison'],
        example: 'Lahore IT company: DA 8, DR 6, 4 referring domains. Competitor A: DA 22, DR 19, 31 domains.',
        tools: ['Moz Domain Analysis (moz.com/domain-analysis)', 'Ahrefs Authority Checker (free)'],
        output: 'Authority numbers for this business and one competitor',
        fields: [
          { key: 'status', label: 'Domain Authority', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Very Low (<15)','Moderate','Strong','N/A'] },
          { key: 'da', label: 'Domain Authority (Moz)', type: 'textarea', placeholder: 'e.g. 8', rows: 1 },
          { key: 'dr', label: 'Domain Rating (Ahrefs)', type: 'textarea', placeholder: 'e.g. 6', rows: 1 },
          { key: 'referring_domains', label: 'Referring domains count', type: 'textarea', placeholder: 'e.g. 4', rows: 1 },
          { key: 'competitor_da', label: 'Competitor authority (for comparison)', type: 'textarea', placeholder: 'Competitor A: DA 22 | DR 19 | 31 domains', rows: 1 }
        ]
      },
      {
        name: 'Keyword visibility check',
        hint: 'See what search terms they currently rank for using free public tools.',
        checks: ['Ubersuggest.com — enter domain — view top keywords','Top 5 keywords and positions?','Keywords at positions 4–15 — closest to page 1','Appear in local 3-pack?'],
        example: 'A tutoring centre ranks for 18 keywords, all at position 20+. They rank position 11 for "O-level tutor Rawalpindi" — one optimization round from page 1.',
        tools: ['Ubersuggest (free tier)', 'Google Search (manual)'],
        output: 'Top keywords and positions recorded',
        fields: [
          { key: 'status', label: 'Keyword Visibility', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Invisible','Low','Visible','N/A'] },
          { key: 'top_keywords', label: 'Top keywords they rank for', type: 'textarea', placeholder: '1. "business name" (pos 3)\n2. "service city" (pos 11)…', rows: 3 },
          { key: 'threepak', label: 'Appear in local 3-pack?', type: 'textarea', placeholder: 'Yes / No — what keyword did you check?', rows: 1 },
          { key: 'branded_serp', label: 'Own first page for business name?', type: 'textarea', placeholder: 'Yes — what appears / No — what competes?', rows: 1 }
        ]
      }
    ]
  },
  {
    color: '#db2777', name: 'Social media audit',
    desc: 'Assessed from public-facing profiles only — no account access required.',
    steps: [
      {
        name: 'Find all profiles and record data',
        hint: 'Search the business name on every platform and document what you find.',
        checks: ['Facebook: page exists? All fields complete?','Instagram: business account? Bio, website?','LinkedIn: company page?','TikTok: any presence?','YouTube: any channel?'],
        example: 'A Lahore boutique: Facebook — 2,300 followers, no website link, no address. Instagram — 890 followers, bio says only "Boutique" with no location or link.',
        tools: ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'YouTube'],
        output: 'Platform-by-platform profile data recorded',
        fields: [
          { key: 'status', label: 'Social Presence', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Very Weak','Partial','Strong','N/A'] },
          { key: 'facebook', label: 'Facebook', type: 'textarea', placeholder: 'Exists / Not found | Followers: X | Website: Yes/No | Address: Yes/No', rows: 2 },
          { key: 'instagram', label: 'Instagram', type: 'textarea', placeholder: 'Exists / Not found | Followers: X | Bio: (copy it) | Website: Yes/No', rows: 2 },
          { key: 'linkedin', label: 'LinkedIn', type: 'textarea', placeholder: 'Exists / Not found | Followers: X', rows: 1 },
          { key: 'tiktok', label: 'TikTok', type: 'textarea', placeholder: 'Exists / Not found | Followers: X', rows: 1 },
          { key: 'youtube', label: 'YouTube', type: 'textarea', placeholder: 'Exists / Not found | Subscribers: X | Videos: X', rows: 1 }
        ]
      },
      {
        name: 'Content quality and posting frequency',
        hint: 'Scroll through the last 30 days of posts on each active platform.',
        checks: ['Most recent post date?','Content types: photos, videos, reels, stories, text?','Engagement rate: (likes + comments) ÷ followers × 100','Any content clearly outperforming the rest?'],
        example: 'Last 30 days: 3 Instagram posts. 0.9% engagement. 6 months ago a reel got 340 likes — 38% engagement.',
        tools: ['Instagram', 'Facebook', 'TikTok'],
        output: 'Posting frequency, engagement data, best content type',
        fields: [
          { key: 'status', label: 'Content Health', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Inactive/Poor','Inconsistent','Active & Good','N/A'] },
          { key: 'last_post', label: 'Date of most recent post', type: 'textarea', placeholder: 'e.g. 6 weeks ago', rows: 1 },
          { key: 'monthly_posts', label: 'Approx posts per month per platform', type: 'textarea', placeholder: 'Facebook: 2/mo | Instagram: 3/mo', rows: 1 },
          { key: 'engagement', label: 'Estimated engagement rate', type: 'textarea', placeholder: 'Instagram: 0.9% | Facebook: 1.2%', rows: 1 },
          { key: 'content_types', label: 'Content types used', type: 'textarea', placeholder: 'mostly static photos, occasional reels', rows: 1 },
          { key: 'best_post', label: 'Best-performing post observed', type: 'textarea', placeholder: 'What was it? Likes/comments? When?', rows: 2 }
        ]
      }
    ]
  },
  {
    color: '#b45309', name: 'Brand identity',
    desc: 'Assess visual and messaging consistency from public touchpoints — no internal files needed.',
    steps: [
      {
        name: 'Logo and visual consistency across platforms',
        hint: 'Compare the logo and brand colors across every platform.',
        checks: ['Same logo on website, GBP, Facebook, Instagram, Maps?','Use ColorZilla — sample the main brand color','Use Fontanello — what font is on the website?'],
        example: 'Islamabad bakery: website uses pale pink serif. Instagram profile photo is a blurry cake. Facebook uses a different logo in blue and white.',
        tools: ['Browser', 'ColorZilla (Chrome extension)', 'Fontanello (Chrome extension)'],
        output: 'Brand visual data per platform',
        fields: [
          { key: 'status', label: 'Visual Consistency', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Inconsistent','Partial','Consistent','N/A'] },
          { key: 'brand_color', label: 'Primary brand color (hex from ColorZilla)', type: 'textarea', placeholder: 'e.g. #F2C4CE', rows: 1 },
          { key: 'brand_font', label: 'Website font (from Fontanello)', type: 'textarea', placeholder: 'e.g. Playfair Display / Lato', rows: 1 },
          { key: 'logo_website', label: 'Logo on website', type: 'textarea', placeholder: 'Describe it / "not found"', rows: 1 },
          { key: 'logo_gbp', label: 'Logo on GBP / Maps', type: 'textarea', placeholder: 'Describe / "not found" / "different"', rows: 1 },
          { key: 'logo_social', label: 'Logo on social media', type: 'textarea', placeholder: 'Facebook: … | Instagram: … | same/different?', rows: 1 }
        ]
      },
      {
        name: 'Messaging consistency across platforms',
        hint: 'Copy their business descriptions from 3 sources and record them verbatim.',
        checks: ['Copy GBP description from Google Maps','Copy Facebook "About" section text','Copy website homepage headline + first paragraph','Note: does any version mention the city?'],
        example: 'GBP: "Law firm providing legal services." Facebook: "We are experienced lawyers." Website: "Justice, Integrity, Excellence." None mention Karachi.',
        tools: ['Google Maps', 'Facebook', 'Browser'],
        output: 'Verbatim descriptions from each platform recorded',
        fields: [
          { key: 'status', label: 'Messaging Clarity', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Very Weak','Vague','Clear & Strong','N/A'] },
          { key: 'gbp_desc_brand', label: 'GBP description (copy verbatim)', type: 'textarea', placeholder: 'Exact text from Maps…', rows: 2 },
          { key: 'facebook_about', label: 'Facebook About text (copy verbatim)', type: 'textarea', placeholder: 'Exact text from Facebook…', rows: 2 },
          { key: 'website_headline', label: 'Website headline + first para (copy verbatim)', type: 'textarea', placeholder: 'Exact H1 + first para…', rows: 3 },
          { key: 'city_mentioned', label: 'Does any description mention the city?', type: 'textarea', placeholder: 'Yes — which ones / No', rows: 1 }
        ]
      }
    ]
  },
  {
    color: '#059669', name: 'Reputation & reviews',
    desc: 'Compile a full public reputation picture across every platform where customers leave feedback.',
    steps: [
      {
        name: 'Multi-platform review audit',
        hint: 'Check every platform where customers typically leave reviews.',
        checks: ['Google Maps: stars, count, recency, response rate','Yelp: any reviews? Owner responded?','Facebook: recommendations enabled?','TripAdvisor, Marham, PakWheels, Zameen as applicable'],
        example: 'A Murree hotel: Google — 4.2★, 180 reviews. TripAdvisor — 3.1★, 47 reviews. Zero TripAdvisor responses. TripAdvisor is the first result when you search the hotel.',
        tools: ['Google Maps', 'Yelp', 'Facebook', 'TripAdvisor'],
        output: 'Stars and review counts per platform',
        fields: [
          { key: 'status', label: 'Reputation Health', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Damaging','Needs Work','Positive','N/A'] },
          { key: 'google_rep', label: 'Google Maps', type: 'textarea', placeholder: '★ rating | review count | response rate: X of Y', rows: 1 },
          { key: 'yelp_rep', label: 'Yelp', type: 'textarea', placeholder: '★ rating | count | response rate — or "not found"', rows: 1 },
          { key: 'facebook_rep', label: 'Facebook', type: 'textarea', placeholder: '★ rating | recommendations — or "not found"', rows: 1 },
          { key: 'tripadvisor_rep', label: 'TripAdvisor', type: 'textarea', placeholder: '★ rating | count | response rate — or "N/A"', rows: 1 },
          { key: 'other_rep', label: 'Other platforms', type: 'textarea', placeholder: 'Platform: ★ | count | notes', rows: 2 }
        ]
      },
      {
        name: 'Sentiment themes from reviews',
        hint: 'Read 15-20 reviews across all platforms and record what customers actually say.',
        checks: ['Top 3 praise themes','Top 3 complaint themes','Percentage of reviews with owner responses?','Are negative reviews getting responses?'],
        example: 'DHA Karachi salon: Positive — friendly staff, good colour work, clean. Negative — long waits, price changed at checkout. Response rate: 2 of 20.',
        tools: ['Google Maps', 'TripAdvisor', 'Yelp'],
        output: 'Sentiment themes and response rate data',
        fields: [
          { key: 'status', label: 'Sentiment Score', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Mostly Negative','Mixed','Mostly Positive','N/A'] },
          { key: 'praise', label: 'Top praise themes', type: 'textarea', placeholder: '1. Friendly staff (6×)\n2. Good colour work\n3. Clean environment', rows: 2 },
          { key: 'complaints', label: 'Top complaint themes', type: 'textarea', placeholder: '1. Long waits (4 reviews)\n2. Price changed at checkout', rows: 2 },
          { key: 'owner_responds_negative', label: 'Owner responds to negative reviews?', type: 'textarea', placeholder: 'Yes / No / Sometimes', rows: 1 }
        ]
      },
      {
        name: 'Competitor review benchmark',
        hint: 'Record numbers for the top 2 competitors side by side.',
        checks: ['Find top 2 competitors from Google Maps','Record count, rating, last review date for each','What are competitors praised for that this business is not?'],
        example: '3 Lahore bakeries: Subject — 34 reviews, 3.9★. Competitor A — 312 reviews, 4.5★. Competitor B — 156 reviews, 4.3★.',
        tools: ['Google Maps'],
        output: 'Competitor review numbers recorded',
        fields: [
          { key: 'status', label: 'Competitive Position', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Far Behind','Behind','Competitive','N/A'] },
          { key: 'this_biz_rep', label: 'This business', type: 'textarea', placeholder: 'e.g. 34 reviews, 3.9★, last review 2 months ago', rows: 1 },
          { key: 'comp_a_rep', label: 'Competitor A (name + numbers)', type: 'textarea', placeholder: 'Name: … | reviews: … | rating: …', rows: 1 },
          { key: 'comp_b_rep', label: 'Competitor B (name + numbers)', type: 'textarea', placeholder: 'Name: … | reviews: … | rating: …', rows: 1 },
          { key: 'comp_praised', label: 'What competitors are praised for that this business is not', type: 'textarea', placeholder: 'Competitor A: praised for speed…', rows: 2 }
        ]
      }
    ]
  },
  {
    color: '#6d28d9', name: 'Competitor intelligence',
    desc: 'Map the competitive landscape from public search results and Maps — no paid tools required.',
    steps: [
      {
        name: 'Identify top 3–5 competitors from Google',
        hint: 'The businesses in the 3-pack are stealing leads every day.',
        checks: ['Google "[service] in [city]" — who appears in the local 3-pack?','Scroll organic results — competitor websites on page 1?','Which competitors run Google Ads?'],
        example: '"AC repair Lahore" 3-pack: CoolTech 4.6★ 203 reviews, Arctic Air 4.4★ 87 reviews. Audited business FrostFix — not in 3-pack.',
        tools: ['Google Search', 'Google Maps'],
        output: 'Competitor list with names, ratings, reviews, URLs',
        fields: [
          { key: 'status', label: 'Competitive Gap', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Invisible','Not in 3-pack','In 3-pack','N/A'] },
          { key: 'search_query', label: 'Search query used', type: 'textarea', placeholder: 'e.g. "AC repair service Lahore"', rows: 1 },
          { key: 'threepak_biz', label: '3-pack businesses (name, stars, reviews, website)', type: 'textarea', placeholder: '1. CoolTech Services — 4.6★ — 203 reviews — cooltech.pk\n2. …', rows: 3 },
          { key: 'organic_biz', label: 'Organic page 1 competitor websites', type: 'textarea', placeholder: 'URLs ranking organically', rows: 2 },
          { key: 'running_ads', label: 'Competitors running Google Ads', type: 'textarea', placeholder: 'Name: … / "none visible"', rows: 1 }
        ]
      },
      {
        name: 'Competitor website observations',
        hint: 'Visit each competitor website and note what you observe.',
        checks: ['Does any competitor have a blog?','More indexed pages?','Competitor PageSpeed score?','Trust signals competitors show?','Competitor DA (Moz)?'],
        example: 'CoolTech Services: blog with 14 articles. PageSpeed mobile 71. 22 indexed pages.',
        tools: ['Browser', 'Google Search (site: command)', 'PageSpeed Insights', 'Moz free'],
        output: 'Competitor website observations recorded',
        fields: [
          { key: 'status', label: 'Website Gap', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Far Behind','Behind','Competitive','N/A'] },
          { key: 'comp_blog', label: 'Competitors with blogs / content', type: 'textarea', placeholder: 'Competitor A: 14 articles…', rows: 2 },
          { key: 'comp_indexed', label: 'Competitor indexed pages vs this business', type: 'textarea', placeholder: 'Comp A: 22 pages | This business: 4 pages', rows: 1 },
          { key: 'comp_pagespeed', label: 'Competitor PageSpeed (one check)', type: 'textarea', placeholder: 'Competitor A mobile: 71', rows: 1 },
          { key: 'comp_da', label: 'Competitor DA (Moz)', type: 'textarea', placeholder: 'Competitor A: DA 22', rows: 1 },
          { key: 'comp_trust', label: 'Trust signals on competitor sites', type: 'textarea', placeholder: 'What do they show that this business does not?', rows: 2 }
        ]
      },
      {
        name: 'Facebook Ad Library — competitor ads',
        hint: 'The Facebook Ad Library is public and shows every active ad any business runs right now.',
        checks: ['Go to facebook.com/ads/library — no login needed','Set country to Pakistan, search each competitor','How many ads? Offers and messaging used?','Running 30+ days = profitable'],
        example: 'CoolTech Services: 3 active ads. "AC Installation Rs.8,999 — Book this week" running 47 days.',
        tools: ['Facebook Ad Library (facebook.com/ads/library)'],
        output: 'Competitor ad activity recorded',
        fields: [
          { key: 'status', label: 'Ad Activity Gap', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Competitors Advertising','Minimal','None Running','N/A'] },
          { key: 'comp_a_ads', label: 'Competitor A ads', type: 'textarea', placeholder: 'Active ads count | Offer/hook | Running how long?', rows: 2 },
          { key: 'comp_b_ads', label: 'Competitor B ads', type: 'textarea', placeholder: 'Active ads count | Offer/hook | Running how long?', rows: 2 },
          { key: 'this_biz_ads', label: 'This business ads', type: 'textarea', placeholder: 'Number of active ads / "0 ads running"', rows: 1 }
        ]
      }
    ]
  },
  {
    color: '#0284c7', name: 'Operations signals',
    desc: 'Infer the state of their operations and tools from publicly observable signals only.',
    steps: [
      {
        name: 'Booking and contact friction',
        hint: 'Go through the actual process of contacting this business. Count every step.',
        checks: ['Starting from Google Maps, how many clicks to reach phone/booking?','Contact form — how many required fields?','Online booking tool?','WhatsApp link on website or GBP?'],
        example: 'Lahore tutoring centre: 5 clicks, 7 mandatory fields, form broken. Competitor: click GBP → WhatsApp → chat opens. 2 clicks.',
        tools: ['Browser', 'Mobile phone'],
        output: 'Step-by-step contact journey recorded',
        fields: [
          { key: 'status', label: 'Contact Friction', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['High Friction','Moderate','Easy','N/A'] },
          { key: 'contact_steps', label: 'Steps to contact from Maps', type: 'textarea', placeholder: 'Step 1: Maps → Step 2: website → …', rows: 3 },
          { key: 'whatsapp', label: 'WhatsApp link present?', type: 'textarea', placeholder: 'On website: Yes/No | On GBP: Yes/No', rows: 1 },
          { key: 'booking_tool', label: 'Online booking tool?', type: 'textarea', placeholder: 'Yes (tool name) / No / "Book now" goes to phone only', rows: 1 },
          { key: 'fb_autoreply', label: 'Facebook auto-reply?', type: 'textarea', placeholder: 'Yes / No / Not tested', rows: 1 }
        ]
      },
      {
        name: 'Tech stack identification',
        hint: 'Identify what platform and tools the website is built on.',
        checks: ['Wappalyzer — what CMS?','Live chat widget?','Email newsletter signup?','View Page Source → search "googletagmanager"','Facebook Pixel installed?'],
        example: 'Healthcare clinic: WordPress / Avada 2016. No live chat. No email signup. No Google Tag Manager. No Facebook Pixel.',
        tools: ['Wappalyzer (Chrome extension)', 'Browser View Source'],
        output: 'Tech stack snapshot recorded',
        fields: [
          { key: 'status', label: 'Tech Stack Health', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['No Tracking','Minimal','Well-instrumented','N/A'] },
          { key: 'cms', label: 'CMS / Platform', type: 'textarea', placeholder: 'e.g. WordPress with Avada theme', rows: 1 },
          { key: 'analytics', label: 'Google Analytics / Tag Manager?', type: 'textarea', placeholder: 'Installed / Not installed', rows: 1 },
          { key: 'fb_pixel', label: 'Facebook Pixel?', type: 'textarea', placeholder: 'Installed / Not installed', rows: 1 },
          { key: 'live_chat', label: 'Live chat widget?', type: 'textarea', placeholder: 'Tool name / "none"', rows: 1 },
          { key: 'email_signup', label: 'Email newsletter signup?', type: 'textarea', placeholder: 'Yes / No', rows: 1 }
        ]
      }
    ]
  },
  {
    color: '#be185d', name: 'Content gap analysis',
    desc: 'Identify content opportunities using free public research tools.',
    steps: [
      {
        name: 'Keyword and question research',
        hint: 'Find the questions potential customers are searching.',
        checks: ['AnswerThePublic — questions for their service?','Google "People Also Ask" for their service + city','Google autocomplete phrases?','Competitors publishing content for these questions?'],
        example: 'AnswerThePublic "eye specialist": "how much does an eye test cost in Pakistan," "which eye doctor is best for children." Competitor ranks #3 for "Eye test cost Lahore 2024" — ~400 visits/month.',
        tools: ['AnswerThePublic (free)', 'Google autocomplete + PAA', 'Ubersuggest (free)'],
        output: 'Content questions and competitor ranking data recorded',
        fields: [
          { key: 'status', label: 'Content Opportunity', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['Zero Content','Minimal','Active','N/A'] },
          { key: 'paa_questions', label: '"People Also Ask" questions found', type: 'textarea', placeholder: '1. "How much does [service] cost in [city]?"\n2. …', rows: 4 },
          { key: 'autocomplete', label: 'Google autocomplete phrases found', type: 'textarea', placeholder: '"[service] near me", "[service] price Pakistan"…', rows: 2 },
          { key: 'comp_content', label: 'Competitors ranking for these questions', type: 'textarea', placeholder: 'Competitor A ranks #3 for "eye test cost Lahore"', rows: 2 },
          { key: 'this_biz_content', label: 'Does this business have content answering these?', type: 'textarea', placeholder: 'Yes — describe / No — none', rows: 1 }
        ]
      },
      {
        name: 'Video presence on YouTube and TikTok',
        hint: 'Check whether competitors are winning with video in this category.',
        checks: ['Search "[service] [city]" on YouTube — competitor videos?','Same search on TikTok?','Does this business have any video?'],
        example: 'YouTube "furniture shop Lahore": competitor has 23 videos. Most viewed — "How our sofas are made" — 14,000 views, ranks #1. Business has zero video.',
        tools: ['YouTube', 'TikTok', 'Instagram'],
        output: 'Video presence data recorded',
        fields: [
          { key: 'status', label: 'Video Presence', type: 'rating', options: ['critical','needs-work','good','na'], labels: ['No Video','Minimal','Active','N/A'] },
          { key: 'this_biz_video', label: 'This business video presence', type: 'textarea', placeholder: 'YouTube: X | TikTok: X | Reels: X — or "none"', rows: 1 },
          { key: 'youtube_results', label: 'YouTube results for their category', type: 'textarea', placeholder: 'Competitor A: 23 videos — top video 14k views', rows: 2 },
          { key: 'tiktok_results', label: 'TikTok results for their category', type: 'textarea', placeholder: 'Who appears? View counts?', rows: 2 }
        ]
      }
    ]
  }
];

// ─────────────────────────────────────────────
// LLM SYSTEM PROMPT
// ─────────────────────────────────────────────
const LLM_SYSTEM_PROMPT = `You are a senior digital marketing strategist...`; // (same as original)

// ─────────────────────────────────────────────
// RATING COLORS
// ─────────────────────────────────────────────
const RATING_COLORS = {
  'critical': '#dc2626', 'needs-work': '#f59e0b', 'good': '#16a34a', 'na': '#8b949e'
};

// ─────────────────────────────────────────────
// APP STATE
// ─────────────────────────────────────────────
let currentPhase = 0;
let currentBusinessId = null;
let currentBizName = '';
let checked = {};
let findings = {};
const saveTimers = {};
let dashboardUnsub = null;

function resetAuditState() {
  currentPhase = 0;
  checked = {};
  findings = {};
  PHASES.forEach((p, pi) => p.steps.forEach((s, si) => {
    checked[`${pi}-${si}`] = false;
    findings[`${pi}-${si}`] = { fields: {}, savedAt: null };
  }));
}

// ─────────────────────────────────────────────
// SCREEN MANAGEMENT
// ─────────────────────────────────────────────
function showScreen(name) {
  ['screen-loading','screen-login','screen-dashboard','screen-audit'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === `screen-${name}`) ? '' : 'none';
  });
}

// ─────────────────────────────────────────────
// AUTH (same as original)
// ─────────────────────────────────────────────
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  errEl.style.display = 'none';
  errEl.classList.remove('visible');

  if (!email || !password) {
    showLoginError('Please enter your email and password.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Sign In';
    const msgs = {
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    };
    showLoginError(msgs[e.code] || 'Sign in failed. Please try again.');
  }
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.style.display = 'block';
  el.classList.add('visible');
}

async function handleSignOut() {
  if (dashboardUnsub) { dashboardUnsub(); dashboardUnsub = null; }
  await signOut(auth);
}

// ─────────────────────────────────────────────
// AUTH STATE LISTENER
// ─────────────────────────────────────────────
onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById('dash-user-email').textContent = user.email;
    showScreen('dashboard');
    loadDashboard();
  } else {
    if (dashboardUnsub) { dashboardUnsub(); dashboardUnsub = null; }
    showScreen('login');
    document.getElementById('login-btn').disabled = false;
    document.getElementById('login-btn').textContent = 'Sign In';
  }
});

// ─────────────────────────────────────────────
// DASHBOARD (same as original)
// ─────────────────────────────────────────────
function loadDashboard() {
  const grid = document.getElementById('businesses-grid');
  grid.innerHTML = '<div class="businesses-loading">Loading businesses…</div>';

  if (dashboardUnsub) dashboardUnsub();

  const q = query(collection(db, 'businesses'), orderBy('createdAt', 'desc'));
  dashboardUnsub = onSnapshot(q, snapshot => {
    if (snapshot.empty) {
      grid.innerHTML = `
        <div class="businesses-empty">
          <p>No businesses yet.<br>Click <strong>+ New Business</strong> to start your first audit.</p>
        </div>`;
      return;
    }
    const totalSteps = PHASES.reduce((a, p) => a + p.steps.length, 0);
    grid.innerHTML = '';
    snapshot.docs.forEach(docSnap => {
      const d = docSnap.data();
      const done = d.completedSteps || 0;
      const pct = Math.round(done / totalSteps * 100);
      const updated = d.updatedAt ? new Date(d.updatedAt.toDate()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
      const card = document.createElement('div');
      card.className = 'biz-card';
      card.innerHTML = `
        <div>
          <div class="biz-card-name">${escapeHtml(d.name)}</div>
          <div class="biz-card-meta">Last updated: ${updated}</div>
        </div>
        <div class="biz-card-progress-wrap">
          <div class="biz-card-progress-label">
            <span>Progress</span>
            <span>${done} / ${totalSteps} steps</span>
          </div>
          <div class="biz-card-bar"><div class="biz-card-bar-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="biz-card-arrow">→</div>`;
      card.addEventListener('click', () => openBusiness(docSnap.id, d.name));
      grid.appendChild(card);
    });
  }, err => {
    grid.innerHTML = `<div class="businesses-empty"><p>Error loading businesses: ${err.message}</p></div>`;
  });
}

// ─────────────────────────────────────────────
// NEW BUSINESS MODAL (same as original)
// ─────────────────────────────────────────────
function openNewBusinessModal() {
  const overlay = document.getElementById('new-biz-overlay');
  document.getElementById('new-biz-name').value = '';
  document.getElementById('new-biz-error').style.display = 'none';
  document.getElementById('create-biz-btn').disabled = false;
  document.getElementById('create-biz-btn').textContent = 'Create & Start Audit';
  overlay.style.display = 'flex';
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });
  setTimeout(() => document.getElementById('new-biz-name').focus(), 80);
}

function closeNewBusinessModal() {
  const overlay = document.getElementById('new-biz-overlay');
  overlay.style.opacity = '0';
  setTimeout(() => { overlay.style.display = 'none'; }, 200);
}

function handleNewBizOverlayClick(e) {
  if (e.target === document.getElementById('new-biz-overlay')) closeNewBusinessModal();
}

async function createNewBusiness() {
  const name = document.getElementById('new-biz-name').value.trim();
  const errEl = document.getElementById('new-biz-error');
  const btn = document.getElementById('create-biz-btn');

  errEl.style.display = 'none';
  if (!name) { errEl.textContent = 'Please enter a business name.'; errEl.style.display = 'block'; return; }

  btn.disabled = true;
  btn.textContent = 'Creating…';

  try {
    const totalSteps = PHASES.reduce((a, p) => a + p.steps.length, 0);
    const docRef = await addDoc(collection(db, 'businesses'), {
      name,
      completedSteps: 0,
      totalSteps,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    closeNewBusinessModal();
    openBusiness(docRef.id, name);
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Create & Start Audit';
    errEl.textContent = 'Error creating business: ' + e.message;
    errEl.style.display = 'block';
  }
}

// ─────────────────────────────────────────────
// OPEN BUSINESS (enter audit screen)
// ─────────────────────────────────────────────
async function openBusiness(bizId, bizName) {
  currentBusinessId = bizId;
  currentBizName = bizName;
  resetAuditState();

  document.getElementById('topbar-biz-name').textContent = bizName;
  document.getElementById('global-save-status').textContent = 'Loading…';
  showScreen('audit');

  try {
    const stepsSnap = await getDocs(collection(db, 'businesses', bizId, 'steps'));
    stepsSnap.forEach(s => {
      const data = s.data();
      const key = s.id;
      if (key in checked) {
        checked[key] = data.checked || false;
        findings[key] = {
          fields: data.fields || {},
          savedAt: data.savedAt || null
        };
      }
    });
  } catch (e) {
    console.error('Error loading steps:', e);
  }

  renderSidebar();
  renderMain();
  updateProgress();
  document.getElementById('global-save-status').textContent = 'All changes saved to cloud';
  addAutoAuditUI();
}

function backToDashboard() {
  showScreen('dashboard');
  currentBusinessId = null;
  currentBizName = '';
}

// ─────────────────────────────────────────────
// FIRESTORE SAVE
// ─────────────────────────────────────────────
async function saveStepToFirestore(pi, si) {
  if (!currentBusinessId) return;
  const key = `${pi}-${si}`;
  const data = {
    checked: checked[key] || false,
    fields: (findings[key] && findings[key].fields) || {},
    savedAt: findings[key] && findings[key].savedAt ? findings[key].savedAt : null
  };
  await setDoc(doc(db, 'businesses', currentBusinessId, 'steps', key), data);
  await updateDoc(doc(db, 'businesses', currentBusinessId), {
    updatedAt: serverTimestamp(),
    completedSteps: doneSteps()
  });
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function totalSteps() { return Object.keys(checked).length; }
function doneSteps() { return Object.values(checked).filter(Boolean).length; }
function phaseDone(pi) { return PHASES[pi].steps.filter((_, si) => checked[`${pi}-${si}`]).length; }
function stepHasNotes(pi, si) {
  const f = findings[`${pi}-${si}`];
  return f && f.fields && Object.values(f.fields).some(v => v && String(v).trim() !== '');
}
function countAllFindings() {
  let n = 0;
  PHASES.forEach((p, pi) => p.steps.forEach((s, si) => { if (stepHasNotes(pi, si)) n++; }));
  return n;
}
function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function ratingSelectedStyle(val) { const c = RATING_COLORS[val] || '#8b949e'; return `background:${c};border-color:${c};color:#fff`; }
function ratingUnselectedStyle(val) { const c = RATING_COLORS[val] || '#8b949e'; return `background:#fff;color:${c};border-color:${c}40`; }

// ─────────────────────────────────────────────
// PROGRESS
// ─────────────────────────────────────────────
function updateProgress() {
  const d = doneSteps(), t = totalSteps();
  document.getElementById('done-count').textContent = d;
  document.getElementById('total-count').textContent = t;
  document.getElementById('overall-bar').style.width = (t ? Math.round(d / t * 100) : 0) + '%';
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
function renderSidebar() {
  let h = '<div class="sidebar-section-label">Phases</div>';
  PHASES.forEach((p, pi) => {
    const pd = phaseDone(pi), pt = p.steps.length;
    const hasNotes = PHASES[pi].steps.some((_, si) => stepHasNotes(pi, si));
    h += `
      <div class="nav-item${pi === currentPhase ? ' active' : ''}" onclick="switchPhase(${pi})">
        <div class="nav-num">${String(pi + 1).padStart(2, '0')}</div>
        <div class="nav-info"><div class="nav-label">${p.name}</div><div class="nav-count">${pd}/${pt}</div></div>
        <div class="nav-has-notes${hasNotes ? ' filled' : ''}"></div>
      </div>
      <div class="nav-pbar"><div class="nav-pfill" style="width:${Math.round(pd / pt * 100)}%;background:${p.color}"></div></div>`;
  });
  document.getElementById('sidebar').innerHTML = h;
}

// ─────────────────────────────────────────────
// FINDINGS FIELDS
// ─────────────────────────────────────────────
function renderFindingsFields(s, pi, si) {
  const savedFields = (findings[`${pi}-${si}`] && findings[`${pi}-${si}`].fields) || {};
  let h = '';
  s.fields.forEach(field => {
    h += `<div class="finding-field"><div class="finding-field-label">${escapeHtml(field.label)}</div>`;
    if (field.type === 'rating') {
      h += `<div class="finding-rating">`;
      field.options.forEach((opt, idx) => {
        const sel = savedFields[field.key] === opt;
        h += `<button class="rating-btn${sel ? ' selected' : ''}" data-val="${opt}" data-step="${pi}-${si}" data-field="${field.key}" style="${sel ? ratingSelectedStyle(opt) : ratingUnselectedStyle(opt)}" onclick="setRating(${pi},${si},'${field.key}','${opt}',this)">${escapeHtml(field.labels[idx])}</button>`;
      });
      h += `</div>`;
    } else {
      h += `<textarea class="finding-textarea" id="field-${pi}-${si}-${field.key}" placeholder="${escapeHtml(field.placeholder || '')}" rows="${field.rows || 3}" oninput="onFieldInput(${pi},${si},'${field.key}',this)" style="min-height:${(field.rows || 3) * 24 + 18}px">${escapeHtml(savedFields[field.key] || '')}</textarea>`;
    }
    h += `</div>`;
  });
  return h;
}

// ─────────────────────────────────────────────
// MAIN RENDER
// ─────────────────────────────────────────────
function renderMain() {
  const p = PHASES[currentPhase], pd = phaseDone(currentPhase), pt = p.steps.length;
  let h = `
    <div class="phase-header-row">
      <div class="phase-tag" style="background:${p.color}18;color:${p.color}">Phase ${currentPhase + 1} of ${PHASES.length}</div>
      <div class="phase-step-count"><span id="phase-done-num">${pd}</span> / ${pt} steps done</div>
    </div>
    <h1 class="phase-title">${p.name}</h1>
    <p class="phase-desc">${p.desc}</p>
    <div class="phase-progress-bar"><div class="phase-progress-fill" id="phase-progress-fill" style="width:${pt ? Math.round(pd / pt * 100) : 0}%;background:${p.color}"></div></div>`;

  p.steps.forEach((s, si) => {
    const key = `${currentPhase}-${si}`, done = checked[key], hasNotes = stepHasNotes(currentPhase, si);
    const f = findings[key], firstNote = f && f.fields ? Object.values(f.fields).find(v => v && String(v).trim()) : '';
    h += `
      <div class="step-card${done ? ' done' : ''}${hasNotes ? ' has-notes' : ''}" id="card-${si}" style="--ph-color:${p.color}">
        <div class="step-header">
          <div class="checkbox${done ? ' checked' : ''}" onclick="toggleCheck(${si})" id="chk-${si}">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><polyline points="1.5,5.5 4.5,8.5 9.5,2.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="step-body">
            <div class="step-name">${escapeHtml(s.name)}</div>
            <div class="step-hint">${escapeHtml(s.hint)}</div>
            <div class="step-note-preview${hasNotes ? ' visible' : ''}" id="preview-${si}">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2h8v7a1 1 0 01-1 1H3a1 1 0 01-1-1V2z" stroke="#16a34a" stroke-width="1.3"/><path d="M4 5h4M4 7h2" stroke="#16a34a" stroke-width="1.3" stroke-linecap="round"/></svg>
              <span style="color:#16a34a;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px">${firstNote ? escapeHtml(String(firstNote).substring(0, 80)) + (String(firstNote).length > 80 ? '…' : '') : 'Findings recorded'}</span>
            </div>
          </div>
          <button class="info-btn" onclick="openGuidelineModal(${currentPhase},${si})" title="View step guidelines">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 7v4.5M8 5.2v.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="step-findings-wrap">
          <div class="findings-header">
            <div class="findings-title" style="color:${p.color}">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h10v9a1 1 0 01-1 1H3a1 1 0 01-1-1V2z" stroke="${p.color}" stroke-width="1.4"/><path d="M4 6h6M4 8.5h4" stroke="${p.color}" stroke-width="1.4" stroke-linecap="round"/><rect x="5" y="1" width="4" height="2" rx="0.5" stroke="${p.color}" stroke-width="1.4"/></svg>
              Record Your Findings
            </div>
            <div class="save-status" id="save-status-${si}">
              <span class="si"></span><span id="save-text-${si}">${f && f.savedAt ? 'Saved to cloud' : 'Not saved yet'}</span>
            </div>
          </div>
          <div class="findings-fields">${renderFindingsFields(s, currentPhase, si)}</div>
        </div>
      </div>`;
  });

  const isLast = currentPhase === PHASES.length - 1;
  h += `
    <div class="footer-nav">
      <button class="btn btn-ghost" onclick="switchPhase(${currentPhase - 1})" style="${currentPhase === 0 ? 'visibility:hidden' : ''}">← Previous phase</button>
      <button class="btn btn-primary" onclick="${isLast ? 'openModal()' : 'switchPhase(' + (currentPhase + 1) + ')'}">${isLast ? 'Export for AI Report →' : 'Next phase →'}</button>
    </div>`;

  document.getElementById('main').innerHTML = '<div class="main-inner">' + h + '</div>';
  document.getElementById('main').scrollTop = 0;
  p.steps.forEach((s, si) => { if (findings[`${currentPhase}-${si}`] && findings[`${currentPhase}-${si}`].savedAt) setSaveStatus(si, 'saved', 'Saved to cloud'); });
}

// ─────────────────────────────────────────────
// FIELD HANDLERS
// ─────────────────────────────────────────────
function onFieldInput(pi, si, fieldKey, el) {
  const key = `${pi}-${si}`;
  if (!findings[key]) findings[key] = { fields: {}, savedAt: null };
  findings[key].fields[fieldKey] = el.value;
  setSaveStatus(si, 'saving', 'Saving…');
  clearTimeout(saveTimers[key]);
  saveTimers[key] = setTimeout(async () => {
    findings[key].savedAt = new Date().toISOString();
    try {
      await saveStepToFirestore(pi, si);
      setSaveStatus(si, 'saved', 'Saved to cloud');
      updateNotePreview(pi, si);
      renderSidebar();
      flashGlobalSave();
    } catch (e) {
      console.error('Save failed:', e);
      setSaveStatus(si, 'error', 'Save failed — check connection');
      flashGlobalSaveError(e.message);
    }
  }, 700);
}

function setRating(pi, si, fieldKey, val, btn) {
  const key = `${pi}-${si}`;
  if (!findings[key]) findings[key] = { fields: {}, savedAt: null };
  const desel = findings[key].fields[fieldKey] === val;
  findings[key].fields[fieldKey] = desel ? '' : val;
  document.querySelectorAll(`[data-step="${pi}-${si}"][data-field="${fieldKey}"]`).forEach(b => {
    const sel = !desel && b.dataset.val === val;
    b.classList.toggle('selected', sel);
    b.style.cssText = sel ? ratingSelectedStyle(b.dataset.val) : ratingUnselectedStyle(b.dataset.val);
  });
  setSaveStatus(si, 'saving', 'Saving…');
  clearTimeout(saveTimers[key]);
  saveTimers[key] = setTimeout(async () => {
    findings[key].savedAt = new Date().toISOString();
    try {
      await saveStepToFirestore(pi, si);
      setSaveStatus(si, 'saved', 'Saved to cloud');
      updateNotePreview(pi, si);
      renderSidebar();
      flashGlobalSave();
    } catch (e) {
      setSaveStatus(si, 'error', 'Save failed — check connection');
      flashGlobalSaveError(e.message);
    }
  }, 400);
}

function setSaveStatus(si, state, text) {
  const el = document.getElementById(`save-status-${si}`), tx = document.getElementById(`save-text-${si}`);
  if (!el || !tx) return;
  el.className = `save-status ${state}`; tx.textContent = text;
}

function updateNotePreview(pi, si) {
  const hn = stepHasNotes(pi, si);
  const card = document.getElementById(`card-${si}`), prev = document.getElementById(`preview-${si}`);
  if (!card || !prev) return;
  card.classList.toggle('has-notes', hn); prev.classList.toggle('visible', hn);
  if (hn) {
    const f = findings[`${pi}-${si}`]; const fn = f && f.fields ? Object.values(f.fields).find(v => v && String(v).trim() !== '') : '';
    const sp = prev.querySelector('span'); if (sp && fn) { const s = String(fn); sp.textContent = s.substring(0, 80) + (s.length > 80 ? '…' : ''); }
  }
}

function flashGlobalSave() {
  const el = document.getElementById('global-save-status');
  if (!el) return;
  el.style.color = '';
  el.textContent = 'Saved to cloud';
  clearTimeout(window._globalSaveTimer);
  window._globalSaveTimer = setTimeout(() => { if (el) { el.style.color = ''; el.textContent = 'All changes saved to cloud'; } }, 2000);
}

function flashGlobalSaveError(msg) {
  const el = document.getElementById('global-save-status');
  if (!el) return;
  el.style.color = '#dc2626';
  el.textContent = 'Save failed: ' + (msg || 'unknown error');
  clearTimeout(window._globalSaveTimer);
  window._globalSaveTimer = setTimeout(() => { if (el) { el.style.color = ''; el.textContent = 'All changes saved to cloud'; } }, 6000);
}

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────
function switchPhase(i) {
  if (i < 0 || i >= PHASES.length) return;
  currentPhase = i; renderSidebar(); renderMain(); const m = document.getElementById('main'); if (m) m.scrollTop = 0;
}

function toggleCheck(si) {
  const key = `${currentPhase}-${si}`;
  checked[key] = !checked[key];
  document.getElementById(`card-${si}`).classList.toggle('done', checked[key]);
  document.getElementById(`chk-${si}`).classList.toggle('checked', checked[key]);
  updateProgress(); renderSidebar();
  const pd = phaseDone(currentPhase), pt = PHASES[currentPhase].steps.length;
  const dn = document.getElementById('phase-done-num'), fi = document.getElementById('phase-progress-fill');
  if (dn) dn.textContent = pd;
  if (fi) fi.style.width = (pt ? Math.round(pd / pt * 100) : 0) + '%';
  if (!findings[key]) findings[key] = { fields: {}, savedAt: null };
  saveStepToFirestore(currentPhase, si).catch(e => { flashGlobalSaveError(e.message); });
}

// ─────────────────────────────────────────────
// GUIDELINE MODAL
// ─────────────────────────────────────────────
function openGuidelineModal(pi, si) {
  const p = PHASES[pi], s = p.steps[si];
  const modal = document.getElementById('guideline-modal');
  const color = p.color;

  document.getElementById('guideline-title').textContent = s.name;
  document.getElementById('guideline-phase').textContent = p.name;

  document.getElementById('guideline-body').innerHTML = `
    <div class="guide-section">
      <div class="guide-label">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 2.5h10M1.5 5.5h7M1.5 8.5h8.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>
        What to check
      </div>
      <ul class="guide-checklist">${s.checks.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
    </div>
    <div class="guide-section">
      <div class="guide-label">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="${color}" stroke-width="1.5"/><path d="M6.5 4v3.5M6.5 9v.3" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>
        Real-world example
      </div>
      <div class="guide-example" style="border-left:3px solid ${color};background:${color}0d">
        <div class="guide-example-label" style="color:${color}">Example scenario</div>
        <div class="guide-example-text">${escapeHtml(s.example)}</div>
      </div>
    </div>
    <div class="guide-section">
      <div class="guide-label">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="2.5" width="10" height="8" rx="1.5" stroke="${color}" stroke-width="1.5"/><path d="M4.5 6.5h4M4.5 8.5h2" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>
        Tools to use
      </div>
      <div class="guide-tools">${s.tools.map(t => `<span class="tag-tool">${escapeHtml(t)}</span>`).join('')}</div>
    </div>
    <div class="guide-section">
      <div class="guide-label">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><polyline points="1.5,6.5 4.5,9.5 11,3" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        What to record
      </div>
      <div class="guide-output">
        <div class="output-icon"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="1.5,6 4.5,9 10.5,2.5" stroke="#15803d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div class="output-text">${escapeHtml(s.output)}</div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  modal.style.opacity = '0';
  requestAnimationFrame(() => { modal.style.opacity = '1'; modal.classList.add('visible'); });
}

function closeGuidelineModal() {
  const modal = document.getElementById('guideline-modal');
  modal.style.opacity = '0';
  modal.classList.remove('visible');
  setTimeout(() => { modal.style.display = 'none'; }, 200);
}

function handleGuidelineOverlayClick(e) {
  if (e.target === document.getElementById('guideline-modal')) closeGuidelineModal();
}

// ─────────────────────────────────────────────
// MODAL — FINDINGS
// ─────────────────────────────────────────────
let activeTab = 'summary';
function openModal() {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-sub').textContent = `Audit findings for ${currentBizName}`;
  overlay.style.display = 'flex';
  overlay.style.opacity = '0';
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    overlay.classList.add('visible');
  });
  switchTab(activeTab);
}
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.style.opacity = '0';
  overlay.classList.remove('visible');
  setTimeout(() => { overlay.style.display = 'none'; }, 200);
}
function handleOverlayClick(e) { if (e.target === document.getElementById('modal-overlay')) closeModal(); }
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.modal-tab').forEach((t, i) => t.classList.toggle('active', ['summary', 'all', 'export'][i] === tab));
  document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  if (tab === 'summary') renderSummaryTab(); else if (tab === 'all') renderAllTab(); else renderExportTab();
}

// ─────────────────────────────────────────────
// SUMMARY TAB
// ─────────────────────────────────────────────
function renderSummaryTab() {
  const total = PHASES.reduce((a, p) => a + p.steps.length, 0), done = doneSteps(), filled = countAllFindings();
  let crits = 0;
  PHASES.forEach((p, pi) => p.steps.forEach((s, si) => { const f = findings[`${pi}-${si}`]; if (f && f.fields) Object.values(f.fields).forEach(v => { if (v === 'critical') crits++; }); }));
  let h = `
    <div class="summary-grid">
      <div class="summary-stat"><div class="summary-stat-num">${done}/${total}</div><div class="summary-stat-label">Steps completed</div></div>
      <div class="summary-stat"><div class="summary-stat-num">${filled}</div><div class="summary-stat-label">Steps with data</div></div>
      <div class="summary-stat"><div class="summary-stat-num" style="color:#dc2626">${crits}</div><div class="summary-stat-label">Critical flags</div></div>
    </div>
    <div style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;padding:10px 14px;background:var(--main-bg);border-radius:6px;border:1px solid var(--border-light)">
      <strong>Business:</strong> ${escapeHtml(currentBizName)} &nbsp;·&nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">`;
  PHASES.forEach((p, pi) => {
    const pd = phaseDone(pi), pt = p.steps.length, pf = PHASES[pi].steps.filter((_, si) => stepHasNotes(pi, si)).length;
    let pc = 0; p.steps.forEach((s, si) => { const f = findings[`${pi}-${si}`]; if (f && f.fields) Object.values(f.fields).forEach(v => { if (v === 'critical') pc++; }); });
    h += `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:${p.color}08;border:1px solid ${p.color}20;border-radius:6px;cursor:pointer" onclick="closeModal();switchPhase(${pi})">
      <div style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0"></div>
      <div style="flex:1;font-size:13px;font-weight:500;color:var(--text-primary)">${p.name}</div>
      <div style="font-size:11px;color:var(--text-tertiary)">${pf} filled</div>
      ${pc > 0 ? `<div style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#fee2e2;color:#dc2626">${pc} critical</div>` : ''}
      <div style="font-size:11px;color:var(--text-tertiary)">${pd}/${pt} ✓</div>
    </div>`;
  });
  h += `</div>`;
  document.getElementById('tab-summary').innerHTML = h;
}

// ─────────────────────────────────────────────
// ALL FINDINGS TAB
// ─────────────────────────────────────────────
function renderAllTab() {
  let h = '', hasAny = false;
  PHASES.forEach((p, pi) => {
    const steps = PHASES[pi].steps.map((s, si) => ({ s, si, f: findings[`${pi}-${si}`] })).filter(({ f }) => f && f.fields && Object.values(f.fields).some(v => v && String(v).trim()));
    if (!steps.length) return; hasAny = true;
    h += `<div class="phase-findings-group"><div class="phase-findings-header"><div class="phase-dot" style="background:${p.color}"></div><div class="phase-findings-name">${p.name}</div><div style="font-size:11px;color:var(--text-tertiary);margin-left:auto">${steps.length}/${p.steps.length} steps</div></div>`;
    steps.forEach(({ s, si, f }) => {
      h += `<div class="finding-entry"><div class="finding-entry-step">${String(si + 1).padStart(2, '0')} — ${escapeHtml(s.name)}</div>`;
      s.fields.forEach(field => {
        const val = f.fields[field.key]; if (!val || !String(val).trim()) return;
        if (field.type === 'rating') { const m = { 'critical': 'critical', 'needs-work': 'needs-work', 'good': 'good' }; const lbl = field.labels[field.options.indexOf(val)] || val; h += `<span class="finding-entry-rating ${m[val] || ''}">${escapeHtml(field.label)}: ${escapeHtml(lbl)}</span> `; }
        else { h += `<div style="margin-top:6px"><div style="font-size:10px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">${escapeHtml(field.label)}</div><div class="finding-entry-notes" style="white-space:pre-wrap">${escapeHtml(String(val))}</div></div>`; }
      });
      h += `</div>`;
    });
    h += `</div>`;
  });
  if (!hasAny) h = `<div class="empty-state"><svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="8" y="6" width="24" height="28" rx="2" stroke="#8c959f" stroke-width="1.5"/><path d="M14 14h12M14 19h12M14 24h7" stroke="#8c959f" stroke-width="1.5" stroke-linecap="round"/></svg><p>No data recorded yet.<br>Open the Details panel for any step and fill in your findings.</p></div>`;
  document.getElementById('tab-all').innerHTML = h;
}

// ─────────────────────────────────────────────
// EXPORT TAB
// ─────────────────────────────────────────────
function renderExportTab() {
  const exportData = {
    _instructions: { llm_prompt: LLM_SYSTEM_PROMPT },
    meta: {
      business: currentBizName,
      audit_date: new Date().toISOString().split('T')[0],
      steps_completed: doneSteps(),
      steps_total: totalSteps(),
      fields_filled: countAllFindings(),
      generated_by: 'BizAudit Cold Prospect Framework'
    },
    audit_data: PHASES.map((p, pi) => ({
      phase_id: pi + 1, phase_name: p.name,
      steps: p.steps.map((s, si) => {
        const key = `${pi}-${si}`, f = findings[key], raw = {};
        if (f && f.fields) s.fields.forEach(field => { const v = f.fields[field.key]; if (v && String(v).trim()) raw[field.key] = v; });
        return { step_id: si + 1, step_name: s.name, completed: checked[key] || false, data: raw };
      })
    }))
  };
  const json = JSON.stringify(exportData, null, 2);
  document.getElementById('tab-export').innerHTML = `
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 16px;margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;color:#15803d;margin-bottom:6px;display:flex;align-items:center;gap:6px">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="1.5,7 5.5,11 12.5,2" stroke="#15803d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Ready to generate your full report with AI
      </div>
      <div style="font-size:12px;color:#166534;line-height:1.65">
        Copy the JSON below and paste it into <strong>ChatGPT</strong>, <strong>Claude</strong>, or any AI. It will generate two full reports — one for your internal team (with sitemap, page plan, SEO, social strategy, app recommendations, and 30-60-90 roadmap) and one for the client — all specific to <strong>${escapeHtml(currentBizName)}</strong>.
      </div>
    </div>
    <div class="export-code" id="export-json">${escapeHtml(json)}</div>
    <div class="export-actions">
      <button class="btn-copy" id="copy-btn" onclick="copyExport()">📋 Copy JSON</button>
      <button class="btn-copy" onclick="downloadExport('${escapeHtml(currentBizName.replace(/[^a-z0-9]/gi, '_'))}')">⬇ Download .json</button>
    </div>`;
}

function copyExport() {
  const text = document.getElementById('export-json')?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-btn');
    if (btn) { btn.textContent = '✓ Copied!'; btn.classList.add('success'); setTimeout(() => { btn.textContent = '📋 Copy JSON'; btn.classList.remove('success'); }, 2500); }
  }).catch(() => alert('Copy failed — please select and copy manually.'));
}

function downloadExport(slug) {
  const text = document.getElementById('export-json')?.textContent || '{}';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = `BizAudit_${slug}_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

// ─────────────────────────────────────────────
// AUTO-AUDIT FEATURE
// ─────────────────────────────────────────────
function addAutoAuditUI() {
  if (document.getElementById('auto-audit-section')) return;
  const mainInner = document.querySelector('.main-inner');
  if (!mainInner) return;

  const autoSection = document.createElement('div');
  autoSection.id = 'auto-audit-section';
  autoSection.className = 'auto-audit-section';
  autoSection.innerHTML = `
    <div class="auto-header">
      <span class="auto-icon">🤖</span>
      <span class="auto-title">Quick Auto-Audit</span>
      <span class="auto-badge">Beta</span>
    </div>
    <div class="auto-inputs">
      <input type="text" id="auto-website" placeholder="Website URL (e.g., https://example.com)">
      <input type="text" id="auto-maps" placeholder="Google Maps URL (optional)">
    </div>
    <div class="auto-actions">
      <button id="run-auto-btn" class="btn btn-primary">🚀 Auto-Fill from URLs</button>
      <button id="hide-auto-btn" class="btn btn-ghost">Hide</button>
    </div>
    <div id="auto-status" class="auto-status"></div>
  `;

  mainInner.insertBefore(autoSection, mainInner.firstChild);

  document.getElementById('run-auto-btn').addEventListener('click', runSimpleAutoAudit);
  document.getElementById('hide-auto-btn').addEventListener('click', () => {
    autoSection.style.display = 'none';
  });
}

async function runSimpleAutoAudit() {
  const websiteUrl = document.getElementById('auto-website').value.trim();
  const mapsUrl = document.getElementById('auto-maps').value.trim();
  const statusDiv = document.getElementById('auto-status');

  if (!websiteUrl && !mapsUrl) {
    statusDiv.innerHTML = '<span style="color:#dc2626">❌ Please enter at least a website or Google Maps URL</span>';
    statusDiv.className = 'auto-status error';
    return;
  }

  statusDiv.innerHTML = '<span style="color:#2563eb">🔄 Running auto-audit... This may take a few seconds</span>';
  statusDiv.className = 'auto-status loading';

  const results = {};

  if (websiteUrl) {
    try {
      statusDiv.innerHTML = '<span style="color:#2563eb">🌐 Fetching website data...</span>';
      const websiteData = await fetchWebsiteData(websiteUrl);
      results.website = websiteData;
    } catch (e) {
      console.error('Website fetch failed:', e);
      results.websiteError = e.message;
    }
  }

  if (mapsUrl) {
    try {
      statusDiv.innerHTML = '<span style="color:#2563eb">📍 Fetching Google Maps data...</span>';
      const mapsData = await fetchMapsData(mapsUrl);
      results.maps = mapsData;
    } catch (e) {
      console.error('Maps fetch failed:', e);
      results.mapsError = e.message;
    }
  }

  if (results.website && !results.websiteError) {
    autoFillWebsiteFindings(results.website);
  }

  if (results.maps && !results.mapsError) {
    autoFillMapsFindings(results.maps);
  }

  statusDiv.innerHTML = '<span style="color:#16a34a">✅ Auto-audit complete! Data has been filled. Review and adjust as needed.</span>';
  statusDiv.className = 'auto-status success';

  renderMain();
  renderSidebar();

  setTimeout(() => {
    if (statusDiv) statusDiv.innerHTML = '';
  }, 5000);
}

async function fetchWebsiteData(url) {
  const results = {};

  try {
    const psUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`;
    const response = await fetch(psUrl);
    const data = await response.json();

    if (data.lighthouseResult) {
      results.pagespeed = {
        score: Math.round(data.lighthouseResult.categories.performance.score * 100),
        lcp: data.lighthouseResult.audits['largest-contentful-paint']?.displayValue || 'N/A',
        cls: data.lighthouseResult.audits['cumulative-layout-shift']?.displayValue || 'N/A'
      };
    }
  } catch (e) {
    console.error('PageSpeed failed:', e);
  }

  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const htmlResponse = await fetch(proxyUrl);
    const html = await htmlResponse.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    results.meta = {
      title: doc.querySelector('title')?.innerText || '',
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      h1: doc.querySelector('h1')?.innerText || ''
    };

    results.ssl = url.startsWith('https') ? 'good' : 'critical';

    if (html.includes('wp-content')) results.cms = 'WordPress';
    else if (html.includes('shopify')) results.cms = 'Shopify';
    else results.cms = 'Unknown';

    const phonePattern = /(03\d{2}[-.\s]?\d{7})|(\+92[-.\s]?\d{3}[-.\s]?\d{7})/;
    const phoneMatch = html.match(phonePattern);
    if (phoneMatch) results.phone = phoneMatch[0];

  } catch (e) {
    console.error('HTML fetch failed (CORS likely):', e);
    results.htmlError = 'CORS blocked - manual entry needed';
  }

  return results;
}

async function fetchMapsData(url) {
  const placeIdMatch = url.match(/place\/([^\/]+)/);
  if (!placeIdMatch) {
    return { error: 'Could not extract place ID from URL', manual_link: url };
  }

  const placeId = decodeURIComponent(placeIdMatch[1]);

  return {
    requires_key: true,
    place_id: placeId,
    instructions: 'To auto-fill Google Maps data, a Google Places API key is required. Click the link to open Maps manually.',
    manual_link: url
  };
}

function autoFillWebsiteFindings(websiteData) {
  if (websiteData.pagespeed) {
    const key = '2-1';
    if (!findings[key]) findings[key] = { fields: {} };
    findings[key].fields = {
      ...findings[key].fields,
      status: websiteData.pagespeed.score >= 90 ? 'good' : (websiteData.pagespeed.score >= 50 ? 'needs-work' : 'critical'),
      mobile_score: websiteData.pagespeed.score,
      lcp: websiteData.pagespeed.lcp,
      top_issues: 'Auto-detected from PageSpeed'
    };
    findings[key].auto_filled = true;
  }

  if (websiteData.meta) {
    const key = '2-2';
    if (!findings[key]) findings[key] = { fields: {} };
    findings[key].fields = {
      ...findings[key].fields,
      title_tag: websiteData.meta.title || 'Not found',
      meta_desc: websiteData.meta.description || 'Not found',
      h1: websiteData.meta.h1 || 'Not found',
      indexed_pages: 'Check manually via site: command'
    };
    findings[key].auto_filled = true;
  }

  if (websiteData.ssl) {
    const key = '2-3';
    if (!findings[key]) findings[key] = { fields: {} };
    findings[key].fields = {
      ...findings[key].fields,
      ssl: websiteData.ssl,
      sitemap: 'Check manually',
      robots: 'Check manually'
    };
    findings[key].auto_filled = true;
  }

  if (websiteData.cms) {
    const key = '2-4';
    if (!findings[key]) findings[key] = { fields: {} };
    findings[key].fields = {
      ...findings[key].fields,
      platform: websiteData.cms,
      testimonials: 'Check manually',
      about_photos: 'Check manually'
    };
    findings[key].auto_filled = true;
  }

  if (websiteData.phone) {
    const key = '1-1';
    if (!findings[key]) findings[key] = { fields: {} };
    findings[key].fields = {
      ...findings[key].fields,
      nap_website: `Phone: ${websiteData.phone}`
    };
    findings[key].auto_filled = true;
  }
}

function autoFillMapsFindings(mapsData) {
  if (mapsData.error) {
    const key = '0-1';
    if (!findings[key]) findings[key] = { fields: {} };
    findings[key].fields = {
      ...findings[key].fields,
      notes: `Google Maps URL provided. Click to open: ${mapsData.manual_link || ''}`
    };
    return;
  }

  if (mapsData.requires_key) {
    const key = '0-1';
    if (!findings[key]) findings[key] = { fields: {} };
    findings[key].fields = {
      ...findings[key].fields,
      notes: `Google Maps place ID: ${mapsData.place_id}. Add Google Places API key for auto-fill. Open manually: ${mapsData.manual_link}`
    };
  }
}

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('login-email').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('login-password').focus();
  });
  document.getElementById('new-biz-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') createNewBusiness();
  });
});

// ─────────────────────────────────────────────
// EXPOSE FUNCTIONS TO HTML
// ─────────────────────────────────────────────
window.handleLogin = handleLogin;
window.handleSignOut = handleSignOut;
window.openNewBusinessModal = openNewBusinessModal;
window.closeNewBusinessModal = closeNewBusinessModal;
window.handleNewBizOverlayClick = handleNewBizOverlayClick;
window.createNewBusiness = createNewBusiness;
window.backToDashboard = backToDashboard;
window.switchPhase = switchPhase;
window.toggleCheck = toggleCheck;
window.setRating = setRating;
window.onFieldInput = onFieldInput;
window.openModal = openModal;
window.closeModal = closeModal;
window.handleOverlayClick = handleOverlayClick;
window.switchTab = switchTab;
window.copyExport = copyExport;
window.downloadExport = downloadExport;
window.openGuidelineModal = openGuidelineModal;
window.closeGuidelineModal = closeGuidelineModal;
window.handleGuidelineOverlayClick = handleGuidelineOverlayClick;
