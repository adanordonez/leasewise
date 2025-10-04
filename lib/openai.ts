import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeLease(leaseText: string, address: string) {
  const prompt = `You are a legal expert analyzing a residential lease agreement. 

LEASE TEXT:
${leaseText}

TENANT ADDRESS: ${address}

Analyze this lease and provide a JSON response with the following structure:

{
  "summary": {
    "monthlyRent": "dollar amount",
    "securityDeposit": "dollar amount",
    "leaseStart": "YYYY-MM-DD",
    "leaseEnd": "YYYY-MM-DD",
    "noticePeriod": "number of days"
  },
  "redFlags": [
    {
      "issue": "brief description",
      "severity": "high|medium|low",
      "explanation": "why this is problematic"
    }
  ],
  "rights": [
    {
      "right": "tenant right description",
      "law": "relevant law or statute if known"
    }
  ],
  "marketComparison": {
    "rentPercentile": number between 0-100,
    "depositStatus": "higher|standard|lower",
    "rentAnalysis": "brief explanation"
  },
  "keyDates": [
    {
      "event": "event name",
      "date": "YYYY-MM-DD",
      "description": "what needs to happen"
    }
  ]
}

Extract actual dates, amounts, and terms from the lease. For rights, focus on the jurisdiction mentioned in the address. Be specific and accurate.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a legal expert specializing in residential tenant law. Provide accurate, helpful analysis in valid JSON format only."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const result = completion.choices[0].message.content;
  return JSON.parse(result || '{}');
}

export async function generateActionableScenarios(leaseText: string, address: string) {
  const prompt = `Based on this lease and location (${address}), generate 4 common tenant scenarios with specific advice.

LEASE: ${leaseText}

Provide JSON:
{
  "scenarios": [
    {
      "title": "What if something breaks?",
      "advice": "specific steps based on this lease"
    },
    {
      "title": "Getting my deposit back",
      "advice": "specific timeline and process"
    },
    {
      "title": "Landlord entry rules", 
      "advice": "specific notice requirements"
    },
    {
      "title": "Breaking my lease early",
      "advice": "specific penalties and process"
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const result = completion.choices[0].message.content;
  return JSON.parse(result || '{}');
}
