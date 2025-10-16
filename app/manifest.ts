import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LeaseWise - AI Lease Analysis',
    short_name: 'LeaseWise',
    description: 'Upload your lease PDF and get instant AI analysis of terms, rights, and red flags. Know your lease, know your rights.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#8b5cf6',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    categories: ['legal', 'productivity', 'utilities'],
    lang: 'en-US',
    orientation: 'portrait-primary',
  }
}
