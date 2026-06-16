import type { Ref } from 'vue'

interface MatchRecordChangedPayload {
  refresh: boolean
}

export function useTournamentMatchRecords(tournamentId: Ref<string | null>) {
  const echo = useEcho()
  const lastEvent = ref<MatchRecordChangedPayload | null>(null)

  let channel: ReturnType<typeof echo.channel> | null = null

  function subscribe(id: string) {
    channel = echo.channel(`tournaments.${id}.match_records`)
    channel.listen('.MatchRecordChanged', (payload: MatchRecordChangedPayload) => {
      lastEvent.value = payload
    })
  }

  function unsubscribe() {
    if (channel) {
      channel.stopListening('.MatchRecordChanged')
      echo.leaveChannel(channel.name)
      channel = null
    }
  }

  watch(tournamentId, (id) => {
    unsubscribe()
    if (id) { subscribe(id) }
  }, { immediate: true })

  onUnmounted(unsubscribe)

  return { lastEvent }
}
