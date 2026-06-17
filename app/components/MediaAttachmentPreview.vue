<template>
  <div
    :class="items.length === 1
      ? 'flex justify-center w-full'
      : 'grid grid-cols-1 sm:grid-cols-2 gap-4 w-full'"
  >
    <UCard
      v-for="item in items"
      :key="item.uuid"
      :class="items.length === 1 ? 'w-full max-w-md' : ''"
    >
      <template #header>
        <div class="flex items-center gap-2 min-w-0">
          <UIcon
            :name="isImage(item) ? 'i-lucide-image' : 'i-lucide-file'"
            class="size-4 shrink-0 text-muted"
          />
          <span class="truncate text-sm font-medium text-highlighted">{{ item.file_name }}</span>
          <span class="shrink-0 text-xs text-muted">{{ formatSize(item.size) }}</span>
        </div>
      </template>

      <div v-if="isImage(item) && hasValidUrl(item)" class="flex justify-center">
        <img
          :src="item.temporary_url!"
          :alt="item.file_name"
          class="w-full object-contain rounded"
          :class="[compact ? 'max-h-32' : 'max-h-60']"
        >
      </div>
      <div
        v-else
        class="flex flex-col items-center justify-center gap-2 py-6 text-muted"
      >
        <UIcon name="i-lucide-file" class="size-10" />
        <span class="text-sm">{{ item.file_name }}</span>
        <span class="text-xs">{{ formatSize(item.size) }}</span>
      </div>

      <template v-if="hasValidUrl(item)" #footer>
        <UButton
          as="a"
          :href="item.temporary_url!"
          target="_blank"
          rel="noopener noreferrer"
          icon="i-lucide-download"
          variant="soft"
          size="sm"
          class="w-full justify-center"
          :label="$t('common.download')"
        />
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { MediaAttachment } from '~/types/models'

withDefaults(defineProps<{
  items: MediaAttachment[]
  compact?: boolean
}>(), {
  compact: false,
})

function isImage(item: MediaAttachment): boolean {
  return item.mime_type.startsWith('image/')
}

function hasValidUrl(item: MediaAttachment): boolean {
  if (!item.temporary_url) {
    return false
  }
  return URL.canParse(item.temporary_url)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < (1024 * 1024)) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
