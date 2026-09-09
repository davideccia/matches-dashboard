import type { Ref } from 'vue'

export interface MatchRecordChangedPayload {
  refresh: boolean
}

export function useTournamentMatchRecords(tournamentId: Ref<string | null>) {
  const lastEvent = ref<MatchRecordChangedPayload | null>(null)

  if (import.meta.client) {
    const echo = useEcho()
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
  }

  return { lastEvent }
}
