'use client';

import EnhancedLegalSources from '@/components/EnhancedLegalSources';

export default function TestJinaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">
            🧪 Jina AI Legal Source Test
          </h1>
          <p className="text-slate-600">
            Test the enhanced legal source extraction with vetting
          </p>
        </div>

        {/* Test Case 1: Security Deposits (Should PASS vetting) */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
          <div className="mb-6">
            <div className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full mb-3">
              ✅ SHOULD FIND SOURCES
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Test 1: Security Deposit Law (Illinois)
            </h2>
            <p className="text-slate-600 mt-2">
              This should find relevant Illinois statute text (765 ILCS 715/1)
            </p>
          </div>
          
          <EnhancedLegalSources
            rightText="The landlord must return your security deposit within 45 days after you move out"
            userAddress="123 Main St, Chicago, IL 60601"
            description="Security deposit return timeline for Illinois tenants"
          />
        </div>

        {/* Test Case 2: California Deposits (Should PASS vetting) */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
          <div className="mb-6">
            <div className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full mb-3">
              ✅ SHOULD FIND SOURCES
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Test 2: Security Deposit Law (California)
            </h2>
            <p className="text-slate-600 mt-2">
              This should find California Civil Code 1950.5
            </p>
          </div>
          
          <EnhancedLegalSources
            rightText="The landlord must return your security deposit within 21 days"
            userAddress="456 Sunset Blvd, Los Angeles, CA 90001"
            description="Security deposit return timeline for California tenants"
          />
        </div>

        {/* Test Case 3: Obscure Right (Should FAIL vetting) */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
          <div className="mb-6">
            <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full mb-3">
              ⚠️ SHOULD NOT FIND SOURCES
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Test 3: Obscure Right (Should Show "Not Found")
            </h2>
            <p className="text-slate-600 mt-2">
              This should show a helpful "couldn't find exact legal text" message
            </p>
          </div>
          
          <EnhancedLegalSources
            rightText="You have the right to paint your walls purple on Tuesdays"
            userAddress="123 Main St, Chicago, IL 60601"
            description="Right to paint walls purple on Tuesdays"
          />
        </div>

        {/* Test Case 4: Habitability (Should PASS vetting) */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
          <div className="mb-6">
            <div className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full mb-3">
              ✅ SHOULD FIND SOURCES
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Test 4: Right to Habitable Dwelling (Illinois)
            </h2>
            <p className="text-slate-600 mt-2">
              This should find Illinois habitability laws
            </p>
          </div>
          
          <EnhancedLegalSources
            rightText="You have the right to a safe and habitable dwelling with working heat, water, and no dangerous conditions"
            userAddress="789 Oak St, Chicago, IL 60605"
            description="Right to habitable dwelling"
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 text-lg">
            📝 How to Test:
          </h3>
          <ol className="space-y-2 text-blue-900 text-sm list-decimal list-inside">
            <li>Click "Find Legal Sources" on each test case</li>
            <li>Watch the console logs in DevTools for vetting details</li>
            <li>Check that Test 1, 2, 4 find relevant sources</li>
            <li>Check that Test 3 shows "couldn't find exact text" message</li>
            <li>Verify statute text is shown in gray boxes</li>
            <li>Verify plain English explanations are shown in blue boxes</li>
            <li>Verify external links work</li>
          </ol>
        </div>

        {/* Console Logs Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h3 className="font-semibold text-purple-900 mb-3 text-lg">
            🔍 What to Look for in Console:
          </h3>
          <div className="space-y-2 text-purple-900 text-sm font-mono">
            <div>✅ "Fetched X characters"</div>
            <div>📊 "Vetting result: ✅ RELEVANT (score: 85/100)"</div>
            <div>📝 "Reason: [explanation]"</div>
            <div>✅ "Extracted X characters of statute text"</div>
            <div>✅ "Found X relevant sources"</div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

