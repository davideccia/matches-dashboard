<template>
  <div>
    <!-- Skeleton state -->
    <template v-if="skeleton">
      <div class="flex items-start gap-3 rounded-lg border border-muted p-4">
        <USkeleton class="size-5 shrink-0 rounded-full" />
        <div class="flex-1 space-y-2">
          <USkeleton class="h-4 w-48" />
          <USkeleton class="h-3 w-full" />
          <USkeleton class="h-3 w-3/4" />
        </div>
      </div>
    </template>

    <!-- OK state: no orphans -->
    <template v-else-if="props.items.length === 0">
      <UAlert
        color="success"
        variant="subtle"
        icon="i-lucide-circle-check"
        :title="t('match.matchmakingIssues.okTitle')"
        :description="t('match.matchmakingIssues.okDescription')"
      />
    </template>

    <!-- Warning state: orphan registrations found -->
    <template v-else>
      <button
        type="button"
        class="w-full text-left cursor-pointer"
        @click="modalOpen = true"
      >
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :title="`${props.items.length} ${t('match.matchmakingIssues.warningTitle', props.items.length)}`"
          class="hover:ring-1 hover:ring-warning transition-shadow"
        >
          <template #description>
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-muted">{{ t('match.matchmakingIssues.viewDetails') }}</span>
              <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-muted" />
            </div>
          </template>
        </UAlert>
      </button>

      <UModal v-model:open="modalOpen" :title="t('match.matchmakingIssues.modalTitle')">
        <template #body>
          <div class="space-y-3">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              :placeholder="t('match.matchmakingIssues.searchPlaceholder')"
              class="w-full"
            />
            <ul class="space-y-2">
              <li
                v-for="item in filteredItems"
                :key="item.registration_id"
                class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-warning/5 px-3 py-2 text-sm"
              >
                <span class="font-medium text-highlighted">{{ item.athlete_name }}</span>
                <span class="text-muted opacity-50">·</span>
                <span class="text-default">{{ item.discipline_label }}</span>
                <span class="text-muted opacity-50">·</span>
                <span class="text-default">{{ item.weight_category_label }}</span>
                <span class="text-muted opacity-50">·</span>
                <span class="text-default">{{ experienceTierLabel(item.experience_tier) }}</span>
              </li>
              <li v-if="filteredItems.length === 0" class="py-4 text-center text-sm text-muted">
                {{ t('match.matchmakingIssues.noResults') }}
              </li>
            </ul>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { MatchmakingIssue } from '~/types/models'

const props = defineProps<{
  items: MatchmakingIssue[]
  skeleton?: boolean
}>()

const { t } = useI18n()
const modalOpen = ref(false)
const search = ref('')

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) { return props.items }
  return props.items.filter(item =>
    item.athlete_name.toLowerCase().includes(q)
    || item.discipline_label.toLowerCase().includes(q)
    || item.weight_category_label.toLowerCase().includes(q)
    || experienceTierLabel(item.experience_tier).toLowerCase().includes(q),
  )
})

function experienceTierLabel(tier: MatchmakingIssue['experience_tier']): string {
  if (tier === 'beginner') { return t('match.experienceTier.beginner') }
  if (tier === 'intermediate') { return t('match.experienceTier.intermediate') }
  if (tier === 'advanced') { return t('match.experienceTier.advanced') }
  return tier
}
</script>
