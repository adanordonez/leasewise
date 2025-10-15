import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        {/* Main Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '60px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '900px',
            margin: '0 40px',
          }}
        >
          {/* Logo/Title */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#8b5cf6',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '24px',
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              LW
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                LeaseWise
              </div>
              <div
                style={{
                  fontSize: '24px',
                  color: '#6b7280',
                  fontWeight: '500',
                }}
              >
                AI Lease Analysis
              </div>
            </div>
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '28px',
              color: '#374151',
              textAlign: 'center',
              lineHeight: '1.4',
              marginBottom: '40px',
              maxWidth: '700px',
            }}
          >
            Upload your lease PDF and get instant AI analysis of terms, rights, and red flags
          </div>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                fontSize: '18px',
                color: '#6b7280',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  fontSize: '24px',
                }}
              >
                📄
              </div>
              <div style={{ fontWeight: '600' }}>Smart Analysis</div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                fontSize: '18px',
                color: '#6b7280',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  fontSize: '24px',
                }}
              >
                ⚠️
              </div>
              <div style={{ fontWeight: '600' }}>Red Flags</div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                fontSize: '18px',
                color: '#6b7280',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  fontSize: '24px',
                }}
              >
                🛡️
              </div>
              <div style={{ fontWeight: '600' }}>Your Rights</div>
            </div>
          </div>

          {/* CTA */}
          <div
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '20px',
              fontWeight: '600',
            }}
          >
            Know your lease, know your rights
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              fontSize: '14px',
              color: '#9ca3af',
            }}
          >
            University of Chicago Law School AI Lab
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
