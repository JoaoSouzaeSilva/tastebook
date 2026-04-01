import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tastebook',
    short_name: 'Tastebook',
    description: 'Tastebook',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F3',
    theme_color: '#FAF8F3',
    icons: [
      {
        src: '/tastebook.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
    ],
  }
}
