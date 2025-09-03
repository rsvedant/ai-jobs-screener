"use client";

export default function TestPage() {
  const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  const vapiAssistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  // Private keys should NEVER be exposed to frontend - this is a security risk
  // const vapiPrivateKey = process.env.NEXT_PUBLIC_VAPI_PRIVATE_KEY; // REMOVED for security

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Environment Variables Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">VAPI Public Key:</h3>
            <p className="text-sm text-gray-600">
              {vapiPublicKey ? `✅ Set (${vapiPublicKey.substring(0, 8)}...)` : "❌ Not set"}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">VAPI Assistant ID:</h3>
            <p className="text-sm text-gray-600">
              {vapiAssistantId ? `✅ Set (${vapiAssistantId})` : "❌ Not set"}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-red-900">VAPI Private Key:</h3>
            <p className="text-sm text-red-600">
              🔒 Private keys are hidden for security (backend only)
            </p>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">To fix missing variables:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Create <code>.env.local</code> file in project root</li>
              <li>2. Add these lines:</li>
              <pre className="mt-2 p-2 bg-blue-100 rounded text-xs">
{`NEXT_PUBLIC_VAPI_PUBLIC_KEY=pk_xxxx
NEXT_PUBLIC_VAPI_ASSISTANT_ID=xxxxxxxx
# VAPI_PRIVATE_KEY=your_private_key (set in Convex dashboard, NOT here)`}
              </pre>
              <li>3. Restart the dev server</li>
            </ol>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => window.location.href = '/interview'}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
