import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔑 Mapbox token API called');
    // Try new secure token first, fallback to old token for migration
    let mapboxToken = process.env.MAPBOX_TOKEN; // Server-side only, no NEXT_PUBLIC_
    
    if (!mapboxToken) {
      console.log('⚠️ MAPBOX_TOKEN not found, trying NEXT_PUBLIC_MAPBOX_TOKEN as fallback');
      mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    }
    
    console.log('🔑 Mapbox token exists:', !!mapboxToken);
    console.log('🔑 Mapbox token preview:', mapboxToken ? `${mapboxToken.substring(0, 10)}...` : 'undefined');
    
    if (!mapboxToken) {
      console.log('❌ No Mapbox token configured');
      return NextResponse.json(
        { error: 'Mapbox token not configured. Please set MAPBOX_TOKEN environment variable.' },
        { status: 500 }
      );
    }

    // Return only the token for map initialization
    // This is still exposed to client, but it's a public token designed for client use
    console.log('✅ Returning Mapbox token to client');
    return NextResponse.json({
      token: mapboxToken
    });

  } catch (error) {
    console.error('Error getting Mapbox token:', error);
    return NextResponse.json(
      { error: 'Failed to get Mapbox token' },
      { status: 500 }
    );
  }
}
