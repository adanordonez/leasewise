import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface VerifiedJustiaUrl {
  lawType: string;
  statute: string;
  originalUrl: string;
  workingUrl: string;
  isWorking: boolean;
}

/**
 * Test if a URL returns a valid page (not 404)
 */
async function testUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow'
    });
    return response.ok; // 200-299 status codes
  } catch (error) {
    return false;
  }
}

/**
 * Use OpenAI web search to find the ACTUAL working Justia URL
 */
async function findWorkingJustiaUrl(
  lawType: string,
  statute: string,
  state: string
): Promise<string> {
  // console.log(`🔍 Searching for working Justia URL: ${lawType} (${statute})`);

  try {
    // Use OpenAI's web search to find the actual Justia page
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a legal research assistant. Find the EXACT Justia.com URL for the given statute.`
        },
        {
          role: 'user',
          content: `Find the Justia.com URL for this ${state} law:
          
Law Type: ${lawType}
Statute: ${statute}
State: ${state}

Search Justia.com for this specific statute and return ONLY the exact URL.
If you can't find the specific statute page, return the general ${state} codes page.

Return ONLY the URL, nothing else.`
        }
      ],
      tools: [
        {
          type: 'web_search',
        }
      ],
      temperature: 0.1,
    });

    const content = completion.choices[0].message.content || '';
    
    // Extract URL from response
    const urlMatch = content.match(/(https?:\/\/law\.justia\.com[^\s<>"]+)/i);
    
    if (urlMatch) {
      const foundUrl = urlMatch[1];
      // console.log(`   Found: ${foundUrl}`);
      
      // Test if it works
      const works = await testUrl(foundUrl);
      if (works) {
        // console.log(`   ✅ URL verified working!`);
        return foundUrl;
      } else {
        // console.log(`   ❌ URL doesn't work, using fallback`);
      }
    }
  } catch (error) {
    console.error(`   ❌ Search failed:`, error);
  }

  // Fallback: general state codes page
  const stateCode = state.toLowerCase().replace(/\s+/g, '');
  const fallbackUrl = `https://law.justia.com/codes/${stateCode}/`;
  // console.log(`   Using fallback: ${fallbackUrl}`);
  return fallbackUrl;
}

/**
 * Verify and fix all Justia URLs by actually testing them
 */
export async function verifyJustiaUrlsWithWebSearch(
  legalInfo: Array<{
    lawType: string;
    statute?: string;
    sourceUrl: string;
  }>,
  state: string
): Promise<Array<VerifiedJustiaUrl>> {
  // console.log(`\n🔍 Verifying ${legalInfo.length} Justia URLs with web search for ${state}...\n`);

  const results: VerifiedJustiaUrl[] = [];

  for (const info of legalInfo) {
    // console.log(`📋 ${info.lawType}`);
    
    // First, test the current URL
    const currentWorks = await testUrl(info.sourceUrl);
    
    if (currentWorks) {
      // console.log(`   ✅ Current URL works!`);
      results.push({
        lawType: info.lawType,
        statute: info.statute || '',
        originalUrl: info.sourceUrl,
        workingUrl: info.sourceUrl,
        isWorking: true
      });
    } else {
      // console.log(`   ❌ Current URL broken, searching for working one...`);
      
      // Search for the actual working URL
      const workingUrl = await findWorkingJustiaUrl(
        info.lawType,
        info.statute || info.lawType,
        state
      );
      
      results.push({
        lawType: info.lawType,
        statute: info.statute || '',
        originalUrl: info.sourceUrl,
        workingUrl: workingUrl,
        isWorking: false // Was broken, had to find new one
      });
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // const workingCount = results.filter(r => r.isWorking).length;
  // const fixedCount = results.length - workingCount;

  // console.log(`\n📊 URL Verification Summary:`);
  // console.log(`   ✅ Working URLs: ${workingCount}`);
  // console.log(`   🔧 Fixed URLs: ${fixedCount}`);
  // console.log(`   📝 Total: ${results.length}\n`);

  return results;
}

/**
 * Apply verified URLs to legal info
 */
export function applyVerifiedUrlsFromSearch<T extends { lawType: string; sourceUrl: string }>(
  legalInfo: T[],
  verifiedUrls: VerifiedJustiaUrl[]
): T[] {
  return legalInfo.map(info => {
    const verified = verifiedUrls.find(v => v.lawType === info.lawType);
    if (verified) {
      return {
        ...info,
        sourceUrl: verified.workingUrl
      };
    }
    return info;
  });
}

