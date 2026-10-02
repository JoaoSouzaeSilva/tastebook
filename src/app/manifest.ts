import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tastebook',
    short_name: 'Tastebook',
    description: 'The places we want to eat at, and the ones we have.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F1EA',
    theme_color: '#F5F1EA',
    icons: [
      {
        src: '/tastebook.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
    ],
  }
}
