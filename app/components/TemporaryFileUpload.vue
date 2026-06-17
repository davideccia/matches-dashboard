<template>
  <div class="space-y-2">
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      :multiple="multiple"
      :accept="accept"
      @change="onFilesSelected"
    >

    <div v-if="uploaded.length > 0" class="space-y-1">
      <div
        v-for="file in uploaded"
        :key="file.id"
        class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"
      >
        <UIcon name="i-mdi-file-outline" class="shrink-0" />
        <span class="truncate flex-1">{{ file.original_name }}</span>
        <span class="text-neutral-400 shrink-0">{{ formatSize(file.size) }}</span>
        <UButton
          type="button"
          icon="i-mdi-close"
          variant="ghost"
          color="neutral"
          size="xs"
          :aria-label="t('fileUpload.remove')"
          @click="removeFile(file.id)"
        />
      </div>
    </div>

    <UButton
      v-if="multiple || uploaded.length === 0"
      type="button"
      icon="i-mdi-upload"
      variant="outline"
      color="neutral"
      size="sm"
      :loading="uploading"
      :disabled="uploading"
      class="w-full justify-center border-2 border-accented"
      @click="fileInputRef?.click()"
    >
      {{ uploading ? t('fileUpload.uploading') : t('fileUpload.upload') }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
import type { TemporaryUpload } from '~/types/models'

const props = withDefaults(defineProps<{
  multiple?: boolean
  accept?: string
}>(), {
  multiple: false,
  accept: '*',
})

const { t } = useI18n()
const api = useApi()
const toast = useToast()

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploaded = ref<TemporaryUpload[]>([])
const uploading = ref(false)

function formatSize(size: string): string {
  const bytes = Number.parseInt(size, 10)
  if (Number.isNaN(bytes)) { return size }
  if (bytes < 1024) { return `${bytes} B` }
  if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)} KB` }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getValue(): string | string[] | null {
  if (props.multiple) { return uploaded.value.map(f => f.id) }
  return uploaded.value[0]?.id ?? null
}

defineExpose({ getValue })

function removeFile(id: string) {
  uploaded.value = uploaded.value.filter(f => f.id !== id)
  if (fileInputRef.value) { fileInputRef.value.value = '' }
}

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) { return }

  const files = Array.from(input.files)
  uploading.value = true

  if (!props.multiple) {
    uploaded.value = []
  }

  try {
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      const response = await api.upload<{ data: TemporaryUpload }>('/api/admin/temporary_uploads', fd)
      uploaded.value.push(response.data)
    }
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e) ?? t('common.error'), color: 'error' })
  } finally {
    uploading.value = false
    if (fileInputRef.value) { fileInputRef.value.value = '' }
  }
}
</script>
