import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
  interface Window { Pusher: typeof Pusher }
}

export default defineNuxtPlugin(() => {
  const { config } = useApiConfig()

  window.Pusher = Pusher

  const echo = new Echo({
    broadcaster: 'reverb',
    key: config.value.reverbAppKey,
    wsHost: config.value.reverbHost,
    wsPort: Number(config.value.reverbPort),
    wssPort: Number(config.value.reverbPort),
    forceTLS: config.value.reverbScheme === 'https',
    enabledTransports: ['ws', 'wss'],
  })

  return { provide: { echo } }
})
