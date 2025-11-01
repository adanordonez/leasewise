/**
 * Create a URL with text fragment to scroll to and highlight specific text
 * Uses the same technique as Google's "scroll to text" feature
 * 
 * Example: https://example.com#:~:text=specific%20text%20to%20highlight
 * 
 * NOTE: Text fragments work in Chrome, Edge, Safari 16.4+
 * They may NOT work on some government sites that block them
 */

/**
 * Encode text for URL fragment - more careful encoding
 */
function encodeTextFragment(text: string): string {
  // Clean up the text - be MORE aggressive to match page content
  const cleaned = text
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\r\n\t]/g, ' ') // Remove line breaks and tabs
    .replace(/[""'']/g, '') // Remove smart quotes
    .replace(/[^\w\s.,-]/g, '') // Keep only alphanumeric, spaces, and basic punctuation
    .trim();
  
  // Take a smaller snippet for better matching (20-30 words)
  const words = cleaned.split(' ').filter(w => w.length > 0);
  const fragment = words.slice(0, 25).join(' ');
  
  // console.log('🔗 Text fragment:', fragment.slice(0, 100));
  
  // URL encode - DON'T double-encode
  return encodeURIComponent(fragment);
}

/**
 * Create a URL with text fragment that will scroll to and highlight the text
 * Uses START,END format for better matching
 * 
 * @param baseUrl - The base URL of the page
 * @param textToHighlight - The text to scroll to and highlight
 * @returns URL with text fragment
 */
export function createTextFragmentUrl(baseUrl: string, textToHighlight: string): string {
  if (!textToHighlight || textToHighlight.length < 10) {
    // console.log('⚠️ Text too short for fragment, returning base URL');
    return baseUrl; // Text too short, return base URL
  }
  
  try {
    // Use START,END format for better matching
    // Extract first 10-15 words and last 10-15 words
    const words = textToHighlight
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]/g, ' ')
      .split(' ')
      .filter(w => w.length > 0);
    
    if (words.length < 5) {
      // console.log('⚠️ Not enough words for fragment');
      return baseUrl;
    }
    
    // Get start text (first 10 words) and end text (last 10 words)
    const startWords = words.slice(0, Math.min(10, words.length));
    const endWords = words.length > 15 ? words.slice(-10) : null;
    
    const startText = startWords.join(' ');
    const encodedStart = encodeTextFragment(startText);
    
    // console.log('🔗 Creating text fragment URL');
    // console.log('   Start text:', startText.slice(0, 60) + '...');
    
    // Create text fragment URL with START,END for precision
    const url = new URL(baseUrl);
    
    if (endWords && endWords.length > 0) {
      const endText = endWords.join(' ');
      const encodedEnd = encodeTextFragment(endText);
      // console.log('   End text:', endText.slice(0, 60) + '...');
      url.hash = `:~:text=${encodedStart},${encodedEnd}`;
    } else {
      url.hash = `:~:text=${encodedStart}`;
    }
    
    const finalUrl = url.toString();
    // console.log('✅ Fragment URL created:', finalUrl.slice(0, 150) + '...');
    
    return finalUrl;
  } catch (error) {
    console.error('❌ Error creating text fragment URL:', error);
    return baseUrl;
  }
}

/**
 * Create a text fragment URL with start and end text for more precision
 * 
 * @param baseUrl - The base URL of the page
 * @param startText - Text to start highlighting from
 * @param endText - Text to end highlighting at
 * @returns URL with precise text fragment
 */
export function createPreciseTextFragmentUrl(
  baseUrl: string,
  startText: string,
  endText?: string
): string {
  if (!startText || startText.length < 10) {
    return baseUrl;
  }
  
  const encodedStart = encodeTextFragment(startText.slice(0, 100));
  
  if (endText && endText.length >= 10) {
    const encodedEnd = encodeTextFragment(endText.slice(0, 100));
    const url = new URL(baseUrl);
    url.hash = `:~:text=${encodedStart},${encodedEnd}`;
    return url.toString();
  }
  
  const url = new URL(baseUrl);
  url.hash = `:~:text=${encodedStart}`;
  return url.toString();
}

/**
 * Extract statute number from text for better URL fragment
 * Example: "765 ILCS 715/1" from longer text
 */
export function extractStatuteForFragment(statuteText: string, statuteNumber?: string): string {
  if (statuteNumber) {
    // Try to find the statute number in the text and get surrounding context
    const index = statuteText.indexOf(statuteNumber);
    if (index !== -1) {
      // Get 50 chars before and 150 chars after the statute number
      const start = Math.max(0, index - 50);
      const end = Math.min(statuteText.length, index + statuteNumber.length + 150);
      return statuteText.slice(start, end);
    }
  }
  
  // Otherwise, use first 200 characters
  return statuteText.slice(0, 200);
}

