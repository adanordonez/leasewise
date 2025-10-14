/**
 * Generate a Google Street View Static API URL for a given address
 * @param address The property address
 * @param size Image size in format "WIDTHxHEIGHT" (default: "600x400")
 * @returns Street View image URL or null if API key not available
 */
export function getStreetViewUrl(
  address: string,
  size: string = '600x400'
): string | null {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Maps API key not found. Street View URL cannot be generated.');
    return null;
  }

  if (!address) {
    console.warn('Address is required to generate Street View URL.');
    return null;
  }

  const encodedAddress = encodeURIComponent(address);
  
  // Street View Static API parameters:
  // - size: Image dimensions
  // - location: Address or lat/lng
  // - fov: Field of view (90 is standard, wider view)
  // - pitch: Camera angle (0 is horizontal, positive is up, negative is down)
  // - heading: Camera direction (0-360, 0/360 is North)
  const url = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${encodedAddress}&key=${apiKey}&fov=90&pitch=0`;
  
  return url;
}

/**
 * Check if Street View is available for a given address
 * @param address The property address
 * @returns Promise<boolean> indicating if Street View is available
 */
export async function checkStreetViewAvailability(address: string): Promise<boolean> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || !address) {
    return false;
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodedAddress}&key=${apiKey}`;
    
    const response = await fetch(metadataUrl);
    const data = await response.json();
    
    // Status will be "OK" if Street View is available
    return data.status === 'OK';
  } catch (error) {
    console.error('Error checking Street View availability:', error);
    return false;
  }
}

/**
 * Get Street View image as base64 for embedding in PDFs
 * @param address The property address
 * @param size Image size
 * @returns Promise<string | null> Base64 encoded image or null
 */
export async function getStreetViewBase64(
  address: string,
  size: string = '600x400'
): Promise<string | null> {
  const url = getStreetViewUrl(address, size);
  
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to fetch Street View image:', response.statusText);
      return null;
    }

    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching Street View image:', error);
    return null;
  }
}

