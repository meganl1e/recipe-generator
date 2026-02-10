import { ImageResponse } from 'next/og';
import { siteDetails } from '@/data/site-details';

export const runtime = 'edge';
export const alt = siteDetails.metadata.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
          backgroundColor: '#0f172a',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 80,
            marginBottom: 24,
          }}
        >
          🐕
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 52,
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            maxWidth: '90%',
            lineHeight: 1.2,
          }}
        >
          Homemade Dog Food Recipe Generator
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: '#94a3b8',
            marginTop: 16,
          }}
        >
          {siteDetails.siteName} · Free DIY recipes for your pup
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
