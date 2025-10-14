import { NextRequest, NextResponse } from 'next/server';
import { searchLegalSources, searchMultipleLegalSources } from '@/lib/legal-search';

export async function POST(request: NextRequest) {
  console.log('🔍 Legal sources search API called');
  
  try {
    const body = await request.json();
    const { userAddress, tenantRights, singleRight } = body;
    
    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      );
    }
    
    // Single right search
    if (singleRight) {
      console.log(`📚 Searching for single right: ${singleRight.right}`);
      
      const result = await searchLegalSources(
        userAddress,
        singleRight.right,
        singleRight.description
      );
      
      return NextResponse.json({
        success: true,
        result,
      });
    }
    
    // Multiple rights search
    if (tenantRights && Array.isArray(tenantRights)) {
      console.log(`📚 Searching for ${tenantRights.length} tenant rights`);
      
      const results = await searchMultipleLegalSources(userAddress, tenantRights);
      
      // Convert Map to object for JSON response
      const resultsObject: Record<string, any> = {};
      results.forEach((value, key) => {
        resultsObject[key] = value;
      });
      
      return NextResponse.json({
        success: true,
        results: resultsObject,
      });
    }
    
    return NextResponse.json(
      { error: 'Either singleRight or tenantRights array is required' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('❌ Legal search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search legal sources',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

