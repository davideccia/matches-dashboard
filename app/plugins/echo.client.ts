import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
  interface Window { Pusher: typeof Pusher }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  window.Pusher = Pusher

  const echo = new Echo({
    broadcaster: 'reverb',
    key: config.public.reverbAppKey,
    wsHost: config.public.reverbHost,
    wsPort: Number(config.public.reverbPort),
    wssPort: Number(config.public.reverbPort),
    forceTLS: config.public.reverbScheme === 'https',
    enabledTransports: ['ws', 'wss'],
  })

  return { provide: { echo } }
})
