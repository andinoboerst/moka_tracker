import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Moka Tracker',
    short_name: 'Moka',
    description: 'Log, track and perfect your stovetop moka pot brews.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a1410',
    theme_color: '#1a1410',
    icons: [
      { src: '/icon.png', sizes: '480x480', type: 'image/png', purpose: 'any' },
      { src: '/icon.png', sizes: '480x480', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
