'use client';

import { useState } from 'react';

export default function TestTranslationPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testTranslation = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      console.log('Sending request to /api/translate-legal-text');
      
      const response = await fetch('/api/translate-legal-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          legalText: 'Tenant shall remit payment of rent on or before the first day of each calendar month.'
        }),
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error:', error);
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Translation API Test</h1>
        
        <button
          onClick={testTranslation}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          {loading ? 'Testing...' : 'Test Translation API'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="font-semibold mb-2">Result:</h2>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-900 space-y-1">
            <li>Click the button above</li>
            <li>Open browser console (F12)</li>
            <li>Check for logs and errors</li>
            <li>See the result below the button</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

