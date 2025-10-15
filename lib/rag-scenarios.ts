import OpenAI from 'openai';
import { LeaseRAGSystem } from './rag-system';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RAGScenario {
  title: string;
  advice: string;
  leaseRelevantText: string;
  pageNumber: number;
  severity: 'high' | 'medium' | 'low';
  actionableSteps: string[];
}

export interface RAGScenariosResult {
  scenarios: RAGScenario[];
}

/**
 * Generate scenarios using RAG - simple and direct approach
 * Each scenario question is asked to RAG and LLM for lease-specific responses
 */
export async function generateRAGScenarios(
  rag: LeaseRAGSystem,
  address: string,
  leaseContext: {
    monthlyRent?: string;
    securityDeposit?: string;
    leaseStart?: string;
    leaseEnd?: string;
  }
): Promise<RAGScenariosResult> {
  console.log('🎯 Starting RAG scenarios generation...');
  console.log('📊 RAG System Stats:', rag.getStats());
  console.log('📍 Address:', address);
  console.log('📋 Lease Context:', leaseContext);

  // Test RAG system with a simple query first
  console.log('🧪 Testing RAG system with simple query...');
  try {
    const testChunks = await rag.retrieve('rent payment', 3);
    console.log(`🧪 RAG Test: Found ${testChunks.length} chunks for "rent payment"`);
    if (testChunks.length > 0) {
      console.log(`🧪 RAG Test: First chunk preview: "${testChunks[0].text.substring(0, 100)}..."`);
    }
  } catch (testError) {
    console.error('❌ RAG Test Failed:', testError);
  }

  const scenarioQuestions = [
    "What if something breaks?",
    "Getting my security deposit back", 
    "Landlord entry and privacy rights",
    "Breaking my lease early"
  ];

  const scenarios: RAGScenario[] = [];

  for (const question of scenarioQuestions) {
    console.log(`🔍 Processing scenario: ${question}`);
    
    try {
      // Step 1: Use RAG to find relevant lease content
      console.log(`   🔍 Searching RAG for: "${question}"`);
      const relevantChunks = await rag.retrieve(question, 5);
      console.log(`   📄 Found ${relevantChunks.length} chunks for: "${question}"`);
      
      if (relevantChunks.length === 0) {
        console.log(`   ❌ No relevant chunks found for: ${question}`);
        // Create a basic scenario without lease-specific content
        scenarios.push({
          title: question,
          advice: `Here's what you should know about ${question.toLowerCase()}. Check your lease and local laws for specific details.`,
          leaseRelevantText: '',
          pageNumber: 0,
          severity: 'medium',
          actionableSteps: [
            'Check your lease for specific terms',
            'Contact your landlord if needed',
            'Keep records of all communication',
            'Know your local tenant rights'
          ]
        });
        continue;
      }

      // Get the most relevant chunk
      const topChunk = relevantChunks[0];
      console.log(`   ✅ Found relevant chunk on page ${topChunk.pageNumber}`);
      console.log(`   📝 Chunk text preview: "${topChunk.text.substring(0, 100)}..."`);

      // Step 2: Use LLM to generate simple advice based on the lease chunk
      const simpleAdvice = await generateSimpleAdvice(question, topChunk.text, leaseContext);
      
      console.log(`   Generated advice: ${simpleAdvice.advice.substring(0, 50)}...`);

      scenarios.push({
        title: question,
        advice: simpleAdvice.advice,
        leaseRelevantText: topChunk.text,
        pageNumber: topChunk.pageNumber,
        severity: simpleAdvice.severity,
        actionableSteps: simpleAdvice.actionableSteps
      });

    } catch (error) {
      console.error(`❌ Error processing scenario "${question}":`, error);
      
      // Fallback scenario
      scenarios.push({
        title: question,
        advice: `Here's what you should know about ${question.toLowerCase()}. Check your lease and local laws for specific details.`,
        leaseRelevantText: '',
        pageNumber: 0,
        severity: 'medium',
        actionableSteps: [
          'Check your lease for specific terms',
          'Contact your landlord if needed', 
          'Keep records of all communication',
          'Know your local tenant rights'
        ]
      });
    }
  }

  console.log(`✅ Generated ${scenarios.length} RAG scenarios`);
  return { scenarios };
}

/**
 * Generate simple advice based on lease chunk using LLM
 */
async function generateSimpleAdvice(
  question: string,
  leaseChunk: string,
  leaseContext: any
): Promise<{
  advice: string;
  severity: 'high' | 'medium' | 'low';
  actionableSteps: string[];
}> {
  
  const prompt = `You are a friendly helper who explains tenant rights in super simple terms. Think like you're talking to a 5-year-old.

QUESTION: ${question}

LEASE CONTEXT:
- Monthly Rent: ${leaseContext.monthlyRent || 'Not specified'}
- Security Deposit: ${leaseContext.securityDeposit || 'Not specified'}
- Lease Start: ${leaseContext.leaseStart || 'Not specified'}
- Lease End: ${leaseContext.leaseEnd || 'Not specified'}

RELEVANT LEASE TEXT:
${leaseChunk}

INSTRUCTIONS:
1. Write a simple 1-2 sentence answer to the question based on the lease text
2. Use everyday words that a 5-year-old would understand
3. Be specific about what the lease says
4. Rate severity: HIGH (urgent/expensive), MEDIUM (important), LOW (informational)
5. Give 3-4 simple action steps

Return JSON:
{
  "advice": "Simple 1-2 sentence answer based on the lease text",
  "severity": "high" | "medium" | "low", 
  "actionableSteps": [
    "Simple step 1",
    "Simple step 2", 
    "Simple step 3",
    "Simple step 4"
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a friendly helper who explains tenant rights in super simple terms. Think like you\'re talking to a 5-year-old. Return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      advice: result.advice || 'Advice could not be generated',
      severity: result.severity || 'medium',
      actionableSteps: result.actionableSteps || []
    };
    
  } catch (error) {
    console.error('Error generating simple advice:', error);
    return {
      advice: `Based on your lease, here's what you should know about ${question.toLowerCase()}.`,
      severity: 'medium',
      actionableSteps: [
        'Check your lease for specific terms',
        'Contact your landlord if needed',
        'Keep records of all communication',
        'Know your local tenant rights'
      ]
    };
  }
}
