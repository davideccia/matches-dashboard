<template>
  <div v-if="record" class="space-y-1 text-xs text-muted">
    <i18n-t :keypath="record.created_user ? 'audit.createdBy' : 'audit.created'" tag="p" scope="global">
      <template v-if="record.created_user" #user>
        <span class="text-toned">{{ record.created_user.username }}</span>
      </template>
      <template #date>
        <span class="text-toned">{{ formatServerDate(record.created_at, locale) }}</span>
      </template>
    </i18n-t>
    <i18n-t v-if="isModified" :keypath="record.updated_user ? 'audit.updatedBy' : 'audit.updated'" tag="p" scope="global">
      <template v-if="record.updated_user" #user>
        <span class="text-toned">{{ record.updated_user.username }}</span>
      </template>
      <template #date>
        <span class="text-toned">{{ formatServerDate(record.updated_at, locale) }}</span>
      </template>
    </i18n-t>
  </div>
</template>

<script setup lang="ts">
import type { UserStamps } from '~/types/models'

const props = defineProps<{
  record: (UserStamps & { created_at: string, updated_at: string }) | null
}>()

const { locale } = useI18n()

// Un record mai modificato ha updated_at === created_at: basta la riga "Creato".
const isModified = computed(() => !!props.record && props.record.updated_at !== props.record.created_at)
</script>
