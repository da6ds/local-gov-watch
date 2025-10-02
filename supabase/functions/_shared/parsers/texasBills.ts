import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { politeFetch, loadHTML, safeText, normalizeDate, createExternalId, IngestStats, addError, extractKeywordTags } from '../helpers.ts';

const CAPITOL_TEXAS_GOV = 'capitol.texas.gov';
const MAX_REQ_PER_MIN = 6;
const BILLS_PAGE_LIMIT = parseInt(Deno.env.get('BILL_LIST_PAGE_LIMIT') || '2');
const PDF_MAX_MB = parseInt(Deno.env.get('PDF_MAX_MB') || '15');

let lastRequestTime = 0;
let requestCount = 0;

async function rateLimit() {
  const now = Date.now();
  if (now - lastRequestTime < 60000) {
    requestCount++;
    if (requestCount >= MAX_REQ_PER_MIN) {
      const waitTime = 60000 - (now - lastRequestTime) + Math.random() * 350 + 250; // 250-600ms jitter
      console.log(`Rate limit reached for ${CAPITOL_TEXAS_GOV}, waiting ${Math.round(waitTime)}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      requestCount = 0;
      lastRequestTime = Date.now();
    }
  } else {
    requestCount = 1;
    lastRequestTime = now;
  }
}

async function politeFetchTexas(url: string, options: any = {}, stats?: IngestStats): Promise<Response> {
  await rateLimit();
  
  const startTime = Date.now();
  let retries = 0;
  
  try {
    const response = await politeFetch(url, {
      ...options,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...options.headers,
      },
    });

    const elapsed = Date.now() - startTime;

    // Capture diagnostics
    if (stats) {
      stats.httpStatus = response.status;
      stats.finalUrl = response.url;
      stats.method = options.method || 'GET';
      stats.elapsedMs = elapsed;
      stats.retryCount = retries;
    }

    // Enhanced logging for non-2xx responses
    if (!response.ok) {
      const bodySnippet = await response.clone().text().then(t => t.substring(0, 200));
      if (stats) {
        stats.responseSnippet = bodySnippet;
      }
      console.error(`HTTP ${response.status} from ${url}`, {
        status: response.status,
        statusText: response.statusText,
        finalUrl: response.url,
        elapsed,
        bodySnippet,
      });
    }

    return response;
  } catch (error) {
    if (stats) {
      stats.httpStatus = 0;
      stats.responseSnippet = error instanceof Error ? error.message : String(error);
      stats.elapsedMs = Date.now() - startTime;
    }
    throw error;
  }
}

async function checkRobotsTxt(stats: IngestStats): Promise<boolean> {
  try {
    const robotsUrl = `https://${CAPITOL_TEXAS_GOV}/robots.txt`;
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'LocalGovWatch/1.0 (+https://localgov.watch/about)' }
    });
    
    stats.robotsChecked = true;
    
    if (response.ok) {
      const robotsTxt = await response.text();
      // Simple check - in production use a proper robots.txt parser
      const disallowAll = robotsTxt.includes('User-agent: *') && robotsTxt.includes('Disallow: /');
      stats.robotsAllowed = !disallowAll;
      console.log(`Robots.txt check: ${stats.robotsAllowed ? 'allowed' : 'restricted'}`);
      return stats.robotsAllowed;
    }
    
    stats.robotsAllowed = true; // No robots.txt = allowed
    return true;
  } catch (error) {
    console.warn('Could not check robots.txt, proceeding cautiously');
    stats.robotsChecked = false;
    stats.robotsAllowed = true;
    return true;
  }
}

interface BillData {
  external_id: string;
  title: string;
  status: string;
  introduced_at: string | null;
  last_action_at: string | null;
  doc_url: string;
  pdf_url: string | null;
  summary: string | null;
  full_text: string | null;
  tags: string[];
  source?: string;
}

export async function parseTexasBills(
  supabaseUrl: string,
  supabaseKey: string,
  sourceId: string,
  jurisdictionId: string,
  stats: IngestStats
): Promise<void> {
  console.log('=== Texas Bills Connector (Hardened) ===');
  console.log(`Config: Rate=${MAX_REQ_PER_MIN}/min, PageLimit=${BILLS_PAGE_LIMIT}, PDF_MAX=${PDF_MAX_MB}MB`);

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Check robots.txt
  await checkRobotsTxt(stats);
  
  let bills: BillData[] = [];
  const selectors: string[] = [];
  
  try {
    // Strategy A: Direct listing scrape
    console.log('Strategy A: Attempting direct listing scrape...');
    bills = await strategyA_DirectListing(stats, selectors);
    
    if (bills.length > 0) {
      console.log(`✓ Strategy A succeeded: ${bills.length} bills parsed`);
      stats.status = 'success';
    }
  } catch (error) {
    console.error('Strategy A failed:', error);
    addError(stats, `Strategy A: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Strategy B: Form/Detail fallback
  if (bills.length === 0) {
    try {
      console.log('Strategy B: Attempting detail page fallback...');
      bills = await strategyB_DetailFallback(stats);
      
      if (bills.length > 0) {
        console.log(`✓ Strategy B succeeded: ${bills.length} bills parsed`);
        stats.status = 'success';
      }
    } catch (error) {
      console.error('Strategy B failed:', error);
      addError(stats, `Strategy B: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Strategy C: Emergency fixture
  if (bills.length === 0) {
    console.warn('⚠ Strategies A & B failed, using emergency fixture');
    bills = await strategyC_EmergencyFixture();
    stats.status = 'degraded';
    console.log(`✓ Strategy C (fixture): ${bills.length} bills loaded`);
  }
  
  stats.selectors = selectors;
  stats.fetched = bills.length;
  
  // Log first 3 bill samples
  if (bills.length > 0) {
    stats.parsedSamples = bills.slice(0, 3).map(b => `${b.external_id}: ${b.title.substring(0, 50)}...`);
    console.log('First 3 bills:', stats.parsedSamples);
  }
  
  // Upsert bills into database
  for (const bill of bills) {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('legislation')
        .select('id, updated_at')
        .eq('external_id', bill.external_id)
        .eq('jurisdiction_id', jurisdictionId)
        .maybeSingle();

      if (fetchError) {
        addError(stats, `Fetch error for ${bill.external_id}: ${fetchError.message}`);
        continue;
      }

      const legislationData = {
        jurisdiction_id: jurisdictionId,
        source_id: sourceId,
        external_id: bill.external_id,
        title: bill.title,
        summary: bill.summary,
        status: bill.status,
        introduced_at: bill.introduced_at,
        doc_url: bill.doc_url,
        pdf_url: bill.pdf_url,
        full_text: bill.full_text,
        tags: bill.tags,
      };

      if (existing) {
        await supabase
          .from('legislation')
          .update(legislationData)
          .eq('id', existing.id);
        stats.updatedCount++;
      } else {
        await supabase
          .from('legislation')
          .insert(legislationData);
        stats.newCount++;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addError(stats, `Error upserting ${bill.external_id}: ${errorMsg}`);
    }
  }

  console.log(`=== Summary: ${stats.newCount} new, ${stats.updatedCount} updated, ${stats.errorCount} errors ===`);
}

// Strategy A: Direct listing page scrape
async function strategyA_DirectListing(stats: IngestStats, selectors: string[]): Promise<BillData[]> {
  const bills: BillData[] = [];
  
  // Try multiple known listing URLs
  const listingUrls = [
    'https://capitol.texas.gov/Reports/Report.aspx?LegSess=89R&ID=houserecentactivity',
    'https://capitol.texas.gov/Reports/Report.aspx?LegSess=89R&ID=senaterecentactivity',
    'https://capitol.texas.gov/Search/BillSearchResults.aspx?NSP=1&SPL=True',
  ];
  
  for (const listingUrl of listingUrls) {
    try {
      console.log(`Trying: ${listingUrl}`);
      const response = await politeFetchTexas(listingUrl, {}, stats);
      
      if (!response.ok) {
        console.log(`HTTP ${response.status}, trying next URL...`);
        continue;
      }

      const html = await response.text();
      const $ = await loadHTML(html);
      
      // Try multiple selector patterns
      const selectorPatterns = [
        { sel: 'table.billtable tr', bill: 'td:nth-child(1)', title: 'td:nth-child(2)', action: 'td:nth-child(3)' },
        { sel: '#results table tr', bill: 'td:nth-child(1)', title: 'td:nth-child(2)', action: 'td:nth-child(4)' },
        { sel: 'tr.billrow', bill: '.billnumber', title: '.billtitle', action: '.lastaction' },
      ];
      
      for (const pattern of selectorPatterns) {
        const rows = $(pattern.sel);
        selectors.push(pattern.sel);
        console.log(`  Selector "${pattern.sel}": ${rows.length} rows`);
        
        if (rows.length > 1) { // More than just header
          rows.each((i, row) => {
            if (i === 0 || bills.length >= BILLS_PAGE_LIMIT * 20) return; // Skip header & limit
            
            try {
              const $row = $(row);
              const billNum = safeText($row.find(pattern.bill).text());
              const title = safeText($row.find(pattern.title).text());
              const lastAction = safeText($row.find(pattern.action).text());
              const detailLink = $row.find('a').first().attr('href');
              
              if (billNum && title && billNum.match(/^(HB|SB|HJR|SJR)\d+$/i)) {
                bills.push({
                  external_id: billNum.toUpperCase(),
                  title,
                  status: deriveStatus(lastAction),
                  introduced_at: null,
                  last_action_at: normalizeDate(lastAction)?.toISOString() || null,
                  doc_url: detailLink?.startsWith('http') ? detailLink : `https://capitol.texas.gov${detailLink || '/'}`,
                  pdf_url: null,
                  summary: null,
                  full_text: null,
                  tags: extractKeywordTags(title + ' ' + lastAction),
                });
              }
            } catch (error) {
              stats.errorCount++;
            }
          });
          
          if (bills.length > 0) {
            console.log(`  ✓ Parsed ${bills.length} bills from this page`);
            return bills; // Success!
          }
        }
      }
    } catch (error) {
      console.error(`Error with ${listingUrl}:`, error);
    }
  }
  
  return bills;
}

// Strategy B: Detail page fallback for known bill IDs
async function strategyB_DetailFallback(stats: IngestStats): Promise<BillData[]> {
  const bills: BillData[] = [];
  
  // Common bill patterns for current session
  const billPatterns = [
    'HB1', 'HB2', 'HB3', 'HB4', 'HB5', 'HB6', 'HB7', 'HB8', 'HB9', 'HB10',
    'SB1', 'SB2', 'SB3', 'SB4', 'SB5', 'SB6', 'SB7', 'SB8', 'SB9', 'SB10',
    'HB100', 'HB200', 'HB500', 'HB1000',
    'SB100', 'SB200', 'SB500', 'SB1000',
  ];

  console.log(`Attempting to fetch ${Math.min(billPatterns.length, 30)} known bill IDs...`);

  for (const billNum of billPatterns.slice(0, 30)) {
    try {
      const detailUrl = `https://capitol.texas.gov/BillLookup/History.aspx?LegSess=89R&Bill=${billNum}`;
      const response = await politeFetchTexas(detailUrl, {}, stats);
      
      if (response.ok) {
        const html = await response.text();
        const $ = await loadHTML(html);
        
        const title = safeText($('.bill-title, h2.caption, .billcaption').first().text()) || 
                     safeText($('span[id*="Caption"]').first().text());
        const lastAction = safeText($('.billhistory tr, .actions tr').last().find('td').first().text());
        
        if (title && title.length > 10) {
          bills.push({
            external_id: billNum,
            title,
            status: deriveStatus(lastAction),
            introduced_at: null,
            last_action_at: normalizeDate(lastAction)?.toISOString() || null,
            doc_url: detailUrl,
            pdf_url: null,
            summary: null,
            full_text: null,
            tags: extractKeywordTags(title),
          });
          
          if (bills.length >= 10) break; // Got enough
        }
      }
    } catch (error) {
      stats.errorCount++;
    }
  }
  
  return bills;
}

// Strategy C: Emergency fixture fallback
async function strategyC_EmergencyFixture(): Promise<BillData[]> {
  try {
    const fixtureUrl = new URL('../fixtures/texas_bills.json', import.meta.url);
    const response = await fetch(fixtureUrl);
    const fixtureBills = await response.json() as Array<{
      external_id: string;
      title: string;
      summary?: string;
      status: string;
      introduced_at?: string;
      last_action_at?: string;
      doc_url: string;
      tags?: string[];
    }>;
    
    return fixtureBills.map(fb => ({
      external_id: fb.external_id,
      title: fb.title,
      summary: fb.summary || null,
      status: fb.status,
      introduced_at: fb.introduced_at || null,
      last_action_at: fb.last_action_at || null,
      doc_url: fb.doc_url,
      pdf_url: null,
      full_text: null,
      tags: fb.tags || [],
      source: 'fixture',
    }));
  } catch (error) {
    console.error('Failed to load fixture:', error);
    return [];
  }
}

function deriveStatus(lastAction: string): string {
  if (!lastAction) return 'introduced';
  
  const action = lastAction.toLowerCase();
  if (action.includes('signed by governor') || action.includes('became law')) {
    return 'effective';
  } else if (action.includes('passed') || action.includes('enacted')) {
    return 'passed';
  } else if (action.includes('filed') || action.includes('introduced') || action.includes('prefiled')) {
    return 'introduced';
  } else if (action.includes('committee') || action.includes('referred')) {
    return 'pending';
  } else if (action.includes('failed') || action.includes('vetoed') || action.includes('withdrawn')) {
    return 'withdrawn';
  }
  return 'introduced';
}
