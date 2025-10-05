import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // First, get all laws
    const { data: laws, error: lawsError } = await supabase
      .from('laws')
      .select('*')
      .order('state', { ascending: true })
      .order('city', { ascending: true })
      .order('topic', { ascending: true });

    if (lawsError) {
      console.error('Error fetching laws:', lawsError);
      return NextResponse.json(
        { error: 'Failed to fetch laws' },
        { status: 500 }
      );
    }

    // Then, get all law sources
    const { data: lawSources, error: sourcesError } = await supabase
      .from('law_sources')
      .select('*')
      .order('state', { ascending: true })
      .order('city', { ascending: true });

    if (sourcesError) {
      console.log('Sources table not found or error fetching sources:', sourcesError);
      // Return laws without sources if sources table doesn't exist
      return NextResponse.json({ success: true, laws });
    }

    // Create a map of sources by state and city
    const sourcesMap = new Map();
    lawSources.forEach(source => {
      const key = `${source.state}-${source.city}`;
      sourcesMap.set(key, source);
    });

    // Transform the data to match the expected format
    const transformedLaws = laws.map(law => {
      const key = `${law.state}-${law.city}`;
      const sources = sourcesMap.get(key);
      
      if (!sources) {
        return law;
      }

      // Convert sources to the expected format
      const lawSources = [];
      
      if (sources.uniform_landlord_tenant_law) {
        lawSources.push({
          source_type: 'uniform_law',
          source_text: sources.uniform_landlord_tenant_law,
          source_url: isUrl(sources.uniform_landlord_tenant_law) ? sources.uniform_landlord_tenant_law : undefined,
          display_order: 1
        });
      }
      
      if (sources.source_1_statute_code) {
        lawSources.push({
          source_type: 'statute',
          source_text: sources.source_1_statute_code,
          source_url: isUrl(sources.source_1_statute_code) ? sources.source_1_statute_code : undefined,
          display_order: 2
        });
      }
      
      if (sources.text_source_2) {
        lawSources.push({
          source_type: 'source_2',
          source_text: sources.text_source_2,
          source_url: isUrl(sources.text_source_2) ? sources.text_source_2 : undefined,
          display_order: 3
        });
      }
      
      if (sources.source_3) {
        lawSources.push({
          source_type: 'source_3',
          source_text: sources.source_3,
          source_url: isUrl(sources.source_3) ? sources.source_3 : undefined,
          display_order: 4
        });
      }
      
      if (sources.source_4) {
        lawSources.push({
          source_type: 'source_4',
          source_text: sources.source_4,
          source_url: isUrl(sources.source_4) ? sources.source_4 : undefined,
          display_order: 5
        });
      }
      
      if (sources.source_5) {
        lawSources.push({
          source_type: 'source_5',
          source_text: sources.source_5,
          source_url: isUrl(sources.source_5) ? sources.source_5 : undefined,
          display_order: 6
        });
      }

      return {
        ...law,
        law_sources: lawSources
      };
    });

    return NextResponse.json({ success: true, laws: transformedLaws });
  } catch (error) {
    console.error('API error fetching laws:', error);
    return NextResponse.json(
      { error: 'Failed to fetch laws' },
      { status: 500 }
    );
  }
}

// Helper function to detect URLs
function isUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}
