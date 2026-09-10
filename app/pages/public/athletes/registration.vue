<template>
  <div class="min-h-screen bg-default flex flex-col items-center px-4 py-8">
    <div class="w-full max-w-lg space-y-6">
      <!-- Header -->
      <div class="flex flex-col items-center gap-3 pt-2">
        <LocaleSwitcher />
        <div class="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <UIcon name="i-mdi-trophy" class="size-6 text-primary" />
        </div>
        <div class="text-center space-y-0.5">
          <h1 class="text-2xl font-bold text-default">
            {{ t('register.summary') }}
          </h1>
          <p class="text-sm text-muted">
            {{ t('nav.tournaments') }}
          </p>
        </div>
      </div>

      <!-- Back home -->
      <div class="space-y-3">
        <USeparator />
        <p class="text-sm text-muted text-center">
          {{ t('common.notWhatYouAreLookingFor') }}
        </p>
        <UButton
          :label="t('common.backHome')"
          icon="i-mdi-arrow-left"
          block
          variant="outline"
          color="neutral"
          @click="() => { navigateTo('/') }"
        />
      </div>

      <!-- Stepper -->
      <UStepper
        ref="stepper"
        v-model="currentStep"
        :items="stepperItems"
        disabled
        size="sm"
        class="w-full"
      />

      <!-- ── STEP 1: Codice fiscale ─────────────────────────────────────── -->
      <div v-if="currentStep === 0" class="space-y-4">
        <div class="rounded-2xl bg-elevated border border-default p-6 space-y-5">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold">
              {{ t('register.stepTaxNumber') }}
            </h2>
            <p class="text-sm text-muted">
              {{ t('register.taxNumberPlaceholder') }}
            </p>
          </div>

          <UFormField :label="t('register.taxNumberLabel')" required>
            <UInput
              :model-value="taxNumberInput"
              size="lg"
              class="w-full font-mono tracking-widest"
              :placeholder="t('register.taxNumberPlaceholder')"
              @update:model-value="(v) => taxNumberInput = String(v).toUpperCase()"
              @keydown.enter="onStep1Next"
            />
          </UFormField>

          <UFormField
            :label="t('register.emailLabel')"
            required
            :error="emailInput.trim() && !isEmailValid ? t('register.emailInvalid') : undefined"
          >
            <UInput
              v-model="emailInput"
              type="email"
              size="lg"
              class="w-full"
              :placeholder="t('register.emailPlaceholder')"
              @keydown.enter="onStep1Next"
            />
          </UFormField>

          <UButton
            size="lg"
            class="w-full"
            :loading="taxLookupLoading"
            :disabled="!taxNumberInput.trim() || !isEmailValid"
            trailing-icon="i-mdi-arrow-right"
            @click="onStep1Next"
          >
            {{ t('register.next') }}
          </UButton>
        </div>
      </div>

      <!-- ── STEP 2: Dati atleta ────────────────────────────────────────── -->
      <div v-else-if="currentStep === 1" class="space-y-4">
        <div class="rounded-2xl bg-elevated border border-default p-6 space-y-5">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold">
              {{ t('register.stepAthlete') }}
            </h2>
          </div>

          <UAlert
            v-if="!isNewAthlete"
            color="info"
            variant="soft"
            icon="i-mdi-information-outline"
            :title="t('register.athleteFound')"
            :description="t('register.athleteReadonlyHint')"
          />
          <UAlert
            v-else
            color="info"
            variant="soft"
            icon="i-mdi-account-plus"
            :description="t('register.athleteNoMatch')"
          />

          <UForm :schema="athleteSchema" :state="athleteState" class="space-y-4" @submit="onStep2Submit">
            <UFormField name="first_name" :label="t('athlete.firstName')" required>
              <UInput v-model="athleteState.first_name" size="lg" class="w-full" :disabled="!isNewAthlete" />
            </UFormField>

            <UFormField name="last_name" :label="t('athlete.lastName')" required>
              <UInput v-model="athleteState.last_name" size="lg" class="w-full" :disabled="!isNewAthlete" />
            </UFormField>

            <UFormField name="birth_date" :label="t('athlete.birthDate')" required>
              <UInput
                v-model="athleteState.birth_date"
                type="date"
                size="lg"
                class="w-full"
                :disabled="!isNewAthlete"
              />
            </UFormField>

            <UFormField name="gender" :label="t('athlete.gender.label')" required>
              <UInput
                v-if="!isNewAthlete"
                :model-value="genderOptions.find(o => o.value === athleteState.gender)?.label"
                size="lg"
                class="w-full"
                disabled
              />
              <USelect
                v-else
                v-model="athleteState.gender"
                :items="genderOptions"
                size="lg"
                class="w-full"
              />
            </UFormField>

            <UFormField name="team_name" :label="t('athlete.teamName')" required>
              <UInput v-model="athleteState.team_name" size="lg" class="w-full" :disabled="!isNewAthlete" />
            </UFormField>

            <UFormField name="email" :label="t('register.emailLabel')" required>
              <UInput
                v-model="athleteState.email"
                type="email"
                size="lg"
                class="w-full"
                :disabled="!isNewAthlete"
              />
            </UFormField>

            <UFormField name="phone_number" :label="t('athlete.phoneNumber')">
              <UInput
                v-model="athleteState.phone_number"
                type="tel"
                size="lg"
                class="w-full"
                :disabled="!isNewAthlete"
              />
            </UFormField>

            <div class="flex gap-3 pt-2">
              <UButton
                size="lg"
                variant="ghost"
                color="neutral"
                class="flex-1"
                leading-icon="i-mdi-arrow-left"
                type="button"
                @click="stepperRef?.prev()"
              >
                {{ t('register.back') }}
              </UButton>
              <UButton
                size="lg"
                class="flex-1"
                trailing-icon="i-mdi-arrow-right"
                type="submit"
              >
                {{ t('register.next') }}
              </UButton>
            </div>
          </UForm>
        </div>
      </div>

      <!-- ── STEP 3: Torneo, Disciplina, Categoria ──────────────────────── -->
      <div v-else-if="currentStep === 2" class="space-y-6">
        <!-- Tornei -->
        <div class="rounded-2xl bg-elevated border border-default p-5 space-y-3">
          <div class="space-y-0.5">
            <h2 class="text-base font-semibold flex items-center gap-2">
              <UIcon name="i-mdi-trophy" class="size-4 text-primary" />
              {{ t('register.selectTournament') }}
            </h2>
          </div>

          <UInput
            v-model="tournamentsSearchInput"
            icon="i-mdi-magnify"
            :placeholder="t('register.searchTournament')"
            size="md"
            class="w-full"
          />

          <div v-if="tournamentsLoading" class="flex flex-col gap-3">
            <div v-for="n in 3" :key="n" class="w-full rounded-xl border border-default p-5 space-y-2">
              <USkeleton class="h-4 w-3/4 rounded" />
              <USkeleton class="h-3 w-1/2 rounded" />
              <USkeleton class="h-3 w-2/3 rounded" />
            </div>
          </div>
          <div v-else-if="tournaments.length > 0" class="flex flex-col gap-3">
            <div
              v-for="tournament in tournaments"
              :key="tournament.id"
              class="w-full rounded-xl border p-5 cursor-pointer transition-all select-none"
              :class="selectedTournamentId === tournament.id
                ? 'ring-2 ring-primary bg-primary/5 border-primary/30'
                : 'border-default hover:border-muted hover:bg-elevated/50'"
              @click="selectedTournamentId = tournament.id"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="text-base font-semibold leading-snug">
                  {{ tournament.name }}
                </p>
                <UIcon
                  v-if="selectedTournamentId === tournament.id"
                  name="i-mdi-check-circle"
                  class="shrink-0 size-5 text-primary mt-0.5"
                />
              </div>
              <p class="text-sm text-muted mt-1">
                {{ formatServerDateOnly(tournament.date, locale) }}
              </p>
              <p class="text-sm text-muted">
                {{ tournament.location_city }}
              </p>
            </div>
          </div>
          <div v-else class="flex flex-col items-center gap-1.5 py-8 text-muted">
            <UIcon name="i-mdi-trophy" class="size-8 opacity-30" />
            <p class="text-sm font-medium">
              {{ t('register.noTournamentsOpen') }}
            </p>
            <p class="text-xs">
              {{ t('register.noTournamentsOpenHint') }}
            </p>
          </div>
        </div>

        <!-- Discipline: visibile sempre, disabilitata finché manca il torneo -->
        <div
          class="rounded-2xl bg-elevated border border-default p-5 space-y-3 transition-opacity"
          :class="{ 'opacity-60': !selectedTournamentId }"
          :aria-disabled="!selectedTournamentId"
        >
          <h2 class="text-base font-semibold flex items-center gap-2">
            <UIcon name="i-mdi-sword-cross" class="size-4 text-primary" />
            {{ t('register.selectDiscipline') }}
          </h2>

          <UInput
            v-model="disciplinesSearchInput"
            icon="i-mdi-magnify"
            :placeholder="t('register.searchDiscipline')"
            size="md"
            class="w-full"
            :disabled="!selectedTournamentId"
          />

          <div v-if="!selectedTournamentId" class="text-center py-6 text-sm text-muted">
            {{ t('register.selectTournamentFirst') }}
          </div>
          <div v-else-if="disciplinesLoading" class="grid grid-cols-2 gap-2">
            <USkeleton v-for="n in 4" :key="n" class="h-12 rounded-xl" />
          </div>
          <div v-else-if="disciplines.length > 0" class="grid grid-cols-2 gap-2">
            <button
              v-for="discipline in disciplines"
              :key="discipline.id"
              type="button"
              class="rounded-xl border p-3 text-sm font-medium text-center cursor-pointer transition-all select-none"
              :class="selectedDisciplineId === discipline.id
                ? 'ring-2 ring-primary bg-primary/5 border-primary/30 text-primary'
                : 'border-default hover:border-muted hover:bg-elevated/50 text-default'"
              @click="selectedDisciplineId = discipline.id"
            >
              {{ discipline.label }}
            </button>
          </div>
          <div v-else class="text-center py-6 text-sm text-muted">
            {{ t('register.noDisciplines') }}
          </div>
        </div>

        <!-- Categorie di peso -->
        <div class="rounded-2xl bg-elevated border border-default p-5 space-y-3">
          <h2 class="text-base font-semibold flex items-center gap-2">
            <UIcon name="i-mdi-scale-balance" class="size-4 text-primary" />
            {{ t('register.selectWeightCategory') }}
          </h2>

          <UInput
            v-model="weightCategoriesSearchInput"
            icon="i-mdi-magnify"
            :placeholder="t('register.searchWeightCategory')"
            size="md"
            class="w-full"
          />

          <div v-if="weightCategoriesLoading" class="grid grid-cols-2 gap-2">
            <USkeleton v-for="n in 4" :key="n" class="h-12 rounded-xl" />
          </div>
          <div v-else-if="weightCategories.length > 0" class="grid grid-cols-2 gap-2">
            <button
              v-for="category in weightCategories"
              :key="category.id"
              type="button"
              class="rounded-xl border p-3 text-sm font-medium text-center cursor-pointer transition-all select-none"
              :class="selectedWeightCategoryId === category.id
                ? 'ring-2 ring-primary bg-primary/5 border-primary/30 text-primary'
                : 'border-default hover:border-muted hover:bg-elevated/50 text-default'"
              @click="selectedWeightCategoryId = category.id"
            >
              {{ category.label }}
            </button>
          </div>
          <div v-else class="text-center py-6 text-sm text-muted">
            {{ t('register.noWeightCategories') }}
          </div>
        </div>

        <!-- Pulsanti step 3 -->
        <div class="flex gap-3">
          <UButton
            size="lg"
            variant="ghost"
            color="neutral"
            class="flex-1"
            leading-icon="i-mdi-arrow-left"
            @click="stepperRef?.prev()"
          >
            {{ t('register.back') }}
          </UButton>
          <UButton
            size="lg"
            class="flex-1"
            trailing-icon="i-mdi-arrow-right"
            :disabled="!step3Valid"
            @click="stepperRef?.next()"
          >
            {{ t('register.next') }}
          </UButton>
        </div>
      </div>

      <!-- ── STEP 4: Riepilogo + submit ─────────────────────────────────── -->
      <div v-else class="space-y-4">
        <!-- Pannello di successo post-submit -->
        <div v-if="submitted" class="rounded-2xl bg-elevated border border-default p-8 space-y-6 text-center">
          <div class="flex justify-center">
            <div class="size-16 rounded-full bg-success/10 flex items-center justify-center">
              <UIcon name="i-mdi-check" class="size-8 text-success" />
            </div>
          </div>
          <div class="space-y-1">
            <p class="text-lg font-semibold text-success">
              {{ t('register.submitted') }}
            </p>
            <p class="text-sm text-muted">
              {{ t('register.submittedHint', { n: countdown }) }}
            </p>
          </div>
          <div class="flex flex-col gap-3 w-full">
            <UButton
              size="lg"
              class="w-full"
              color="primary"
              variant="solid"
              leading-icon="i-mdi-download"
              :loading="downloadingPdf"
              :disabled="!pdfUrl"
              @click="downloadPdf"
            >
              {{ t('register.downloadRegistration') }}
            </UButton>
            <UButton
              size="lg"
              class="w-full"
              color="neutral"
              variant="ghost"
              leading-icon="i-mdi-plus-circle"
              @click="resetForm"
            >
              {{ t('register.newRegistration') }}
            </UButton>
          </div>
        </div>

        <!-- Riepilogo -->
        <template v-else>
          <div class="rounded-2xl bg-elevated border border-default p-6 space-y-4">
            <h2 class="text-base font-semibold">
              {{ t('register.summary') }}
            </h2>

            <dl class="space-y-3">
              <div class="flex justify-between gap-4">
                <dt class="text-sm text-muted shrink-0">
                  {{ t('register.athlete') }}
                </dt>
                <dd class="text-sm font-medium text-right">
                  {{ athleteState.first_name }} {{ athleteState.last_name }}
                  <span class="block text-xs text-muted font-mono">{{ athleteState.tax_number }}</span>
                </dd>
              </div>
              <div class="border-t border-default" />
              <div class="flex justify-between gap-4">
                <dt class="text-sm text-muted shrink-0">
                  {{ t('register.tournament') }}
                </dt>
                <dd class="text-sm font-medium text-right">
                  {{ selectedTournament?.name ?? t('register.notSelected') }}
                  <span v-if="selectedTournament" class="block text-xs text-muted">
                    {{ formatServerDateOnly(selectedTournament.date, locale) }} · {{ selectedTournament.location_city }}
                  </span>
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-sm text-muted shrink-0">
                  {{ t('register.discipline') }}
                </dt>
                <dd class="text-sm font-medium text-right">
                  {{ selectedDiscipline?.label ?? t('register.notSelected') }}
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-sm text-muted shrink-0">
                  {{ t('register.weightCategory') }}
                </dt>
                <dd class="text-sm font-medium text-right">
                  {{ selectedWeightCategory?.label ?? t('register.notSelected') }}
                </dd>
              </div>
            </dl>
          </div>

          <label class="flex items-start gap-3 cursor-pointer select-none">
            <UCheckbox v-model="privacyConsent" class="mt-0.5 shrink-0" />
            <span class="text-sm text-muted leading-snug">
              {{ t('register.privacyLabel') }}
              <a
                href="#"
                class="text-primary underline underline-offset-2 hover:opacity-80"
                @click.prevent="openPrivacyModal"
              >{{ t('register.privacyLink') }}</a>
            </span>
          </label>

          <!-- Verifica in due fasi: invio codice → conferma -->
          <template v-if="codeSent">
            <UAlert
              color="info"
              variant="soft"
              icon="i-mdi-email-fast-outline"
              :title="t('register.codeSentTitle')"
              :description="t('register.codeSentHint')"
            />

            <div class="rounded-2xl bg-elevated border border-default p-6 space-y-4">
              <UFormField :label="t('register.codeLabel')" required>
                <UInput
                  :model-value="verificationCode"
                  size="lg"
                  class="w-full font-mono tracking-[0.5em]"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  maxlength="6"
                  :placeholder="t('register.codePlaceholder')"
                  @update:model-value="(v) => verificationCode = String(v).replace(/\D/g, '').slice(0, 6)"
                  @keydown.enter="submit"
                />
              </UFormField>

              <UButton
                size="lg"
                variant="link"
                color="neutral"
                class="px-0"
                :disabled="resendCooldown > 0 || sendingCode"
                :loading="sendingCode"
                leading-icon="i-mdi-refresh"
                @click="sendVerificationCode"
              >
                {{ resendCooldown > 0 ? t('register.resendCodeIn', { n: resendCooldown }) : t('register.resendCode') }}
              </UButton>
            </div>
          </template>

          <div class="flex gap-3">
            <UButton
              size="lg"
              variant="ghost"
              color="neutral"
              class="flex-1"
              leading-icon="i-mdi-arrow-left"
              @click="stepperRef?.prev()"
            >
              {{ t('register.back') }}
            </UButton>
            <UButton
              v-if="!codeSent"
              size="lg"
              class="flex-1"
              :loading="sendingCode"
              :disabled="!privacyConsent"
              trailing-icon="i-mdi-email-arrow-right-outline"
              @click="sendVerificationCode"
            >
              {{ t('register.sendCode') }}
            </UButton>
            <UButton
              v-else
              size="lg"
              class="flex-1"
              :loading="submitting"
              :disabled="!privacyConsent || verificationCode.length !== 6"
              trailing-icon="i-mdi-send"
              @click="submit"
            >
              {{ t('register.confirmRegistration') }}
            </UButton>
          </div>
        </template>
      </div>
    </div>
    <!-- Privacy policy modal -->
    <UModal v-model:open="showPrivacyModal" :title="t('register.privacyLink')" :ui="{ body: 'p-0' }">
      <template #body>
        <div class="max-h-[60vh] overflow-y-auto px-6 py-5 text-sm text-default whitespace-pre-wrap leading-relaxed">
          {{ privacyPolicyText }}
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end px-6 py-4">
          <UButton @click="() => { showPrivacyModal = false }">
            {{ t('common.close') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent, StepperItem } from '@nuxt/ui'
import type { Athlete, Discipline, PaginatedResponse, Tournament, WeightCategory } from '~/types/models'
import type { Gender } from '~/utils/constants'
import * as z from 'zod'

definePageMeta({ layout: false, sanctum: { excluded: true } })

const { config: apiConfig } = useApiConfig()
const { t, locale } = useI18n()
const toast = useToast()

// ── Public API helpers (no auth token) ──────────────────────────────────────
function apiHeaders() {
  return { 'Accept-Language': locale.value }
}
async function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return $fetch<T>(path, { baseURL: apiConfig.value.baseUrl, params, headers: apiHeaders() })
}
async function apiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return $fetch<T>(path, { method: 'POST', baseURL: apiConfig.value.baseUrl, body, headers: apiHeaders() })
}

// ── Stepper ──────────────────────────────────────────────────────────────────
const stepperRef = useTemplateRef('stepper')
const currentStep = ref(0)

const stepperItems = computed<StepperItem[]>(() => [
  { title: t('register.stepTaxNumber'), icon: 'i-mdi-card-account-details-outline', value: 0 },
  { title: t('register.stepAthlete'), icon: 'i-mdi-account', value: 1 },
  { title: t('register.stepTournament'), icon: 'i-mdi-trophy', value: 2 },
  { title: t('register.stepSummary'), icon: 'i-mdi-check-circle', value: 3 },
])

// ── Step 1: Codice fiscale ───────────────────────────────────────────────────
const taxNumberInput = ref('')
const emailInput = ref('')
const isEmailValid = computed(() => z.email().safeParse(emailInput.value.trim()).success)
const taxLookupLoading = ref(false)

const existingAthlete = ref<Athlete | null>(null)
const isNewAthlete = ref(false)

const athleteState = reactive({
  first_name: '',
  last_name: '',
  birth_date: '',
  gender: 'male' as Gender,
  tax_number: '',
  team_name: '',
  email: '',
  phone_number: '',
})

async function onStep1Next() {
  const taxNumber = taxNumberInput.value.trim().toUpperCase()
  const email = emailInput.value.trim()
  if (!taxNumber || !isEmailValid.value) { return }

  // Il CF ed l'email non tornano mai nella risposta: restano quelli digitati.
  athleteState.tax_number = taxNumber
  athleteState.email = email

  taxLookupLoading.value = true
  try {
    const res = await apiPost<{ data: Athlete }>(
      '/api/public/registration_form/athletes/lookup',
      { tax_number: taxNumber, email },
    )
    existingAthlete.value = res.data
    isNewAthlete.value = false
    athleteState.first_name = res.data.first_name
    athleteState.last_name = res.data.last_name
    athleteState.birth_date = serverDateOnlyToInput(res.data.birth_date)
    athleteState.gender = res.data.gender
    athleteState.team_name = res.data.team_name ?? ''
    athleteState.phone_number = res.data.phone_number ?? ''
  } catch {
    // Il 400 è volutamente indistinguibile fra CF sconosciuto ed email errata:
    // si prosegue come nuova anagrafica, avvisando che potrebbe essere un typo.
    existingAthlete.value = null
    isNewAthlete.value = true
    athleteState.first_name = ''
    athleteState.last_name = ''
    athleteState.birth_date = ''
    athleteState.gender = 'male' as Gender
    athleteState.team_name = ''
    athleteState.phone_number = ''
  } finally {
    taxLookupLoading.value = false
    stepperRef.value?.next()
  }
}

// ── Step 2: Dati atleta ──────────────────────────────────────────────────────
const athleteSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  birth_date: z.string().min(1),
  gender: z.enum(['male', 'female', 'hybrid'] as const),
  tax_number: z.string().min(1),
  team_name: z.string().min(1),
  email: z.email(),
  phone_number: z.string().optional(),
})

const genderOptions = computed(() => [
  { label: t('athlete.gender.male'), value: 'male' },
  { label: t('athlete.gender.female'), value: 'female' },
])

// Nessuna chiamata API: l'atleta viene creato (o riusato) da POST registrations.
function onStep2Submit(event: FormSubmitEvent<z.infer<typeof athleteSchema>>) {
  athleteState.first_name = event.data.first_name
  athleteState.last_name = event.data.last_name
  athleteState.birth_date = event.data.birth_date
  athleteState.gender = event.data.gender
  athleteState.tax_number = event.data.tax_number
  athleteState.team_name = event.data.team_name ?? ''
  athleteState.email = event.data.email
  athleteState.phone_number = event.data.phone_number ?? ''

  stepperRef.value?.next()
  loadStep3Data()
}

// ── Step 3: Torneo, Disciplina, Categoria di peso ────────────────────────────

// Tornei
const tournaments = ref<Tournament[]>([])
const tournamentsSearch = ref('')
const tournamentsSearchInput = ref('')
const tournamentsLoading = ref(false)
const selectedTournamentId = ref<string | null>(null)

let tournamentSearchTimer: ReturnType<typeof setTimeout>
watch(tournamentsSearchInput, (val) => {
  clearTimeout(tournamentSearchTimer)
  tournamentSearchTimer = setTimeout(() => { tournamentsSearch.value = val }, 300)
})
watch(tournamentsSearch, () => fetchTournaments())

async function fetchTournaments() {
  tournamentsLoading.value = true
  try {
    const res = await apiGet<PaginatedResponse<Tournament>>(
      '/api/public/registration_form/tournaments',
      tournamentsSearch.value ? { search: tournamentsSearch.value } : {},
    )
    tournaments.value = res.data ?? []
  } catch {
    tournaments.value = []
  } finally {
    tournamentsLoading.value = false
  }
}

// Discipline
const disciplines = ref<Discipline[]>([])
const disciplinesSearch = ref('')
const disciplinesSearchInput = ref('')
const disciplinesLoading = ref(false)
const selectedDisciplineId = ref<string | null>(null)

let disciplineSearchTimer: ReturnType<typeof setTimeout>
watch(disciplinesSearchInput, (val) => {
  clearTimeout(disciplineSearchTimer)
  disciplineSearchTimer = setTimeout(() => { disciplinesSearch.value = val }, 300)
})
watch(disciplinesSearch, () => fetchDisciplines())

// Le discipline sono quelle dichiarate dal torneo scelto: senza torneo non c'è
// nulla da chiedere, la sezione resta visibile ma disabilitata.
async function fetchDisciplines() {
  const tournamentId = selectedTournamentId.value
  if (!tournamentId) {
    disciplines.value = []
    return
  }
  disciplinesLoading.value = true
  try {
    const res = await apiGet<PaginatedResponse<Discipline>>(
      `/api/public/registration_form/tournaments/${tournamentId}/disciplines`,
      disciplinesSearch.value ? { search: disciplinesSearch.value } : {},
    )
    disciplines.value = res.data ?? []
  } catch {
    disciplines.value = []
  } finally {
    disciplinesLoading.value = false
  }
}

// Cambio torneo → la disciplina scelta può non essere fra quelle del nuovo
// torneo: si azzera la selezione e si ricarica la lista. La ricerca digitata
// resta: azzerarla farebbe scattare anche `watch(disciplinesSearch)`, con due
// fetch identiche in fila.
watch(selectedTournamentId, () => {
  selectedDisciplineId.value = null
  fetchDisciplines()
})

// Categorie di peso
const weightCategories = ref<WeightCategory[]>([])
const weightCategoriesSearch = ref('')
const weightCategoriesSearchInput = ref('')
const weightCategoriesLoading = ref(false)
const selectedWeightCategoryId = ref<string | null>(null)

let weightCategorySearchTimer: ReturnType<typeof setTimeout>
watch(weightCategoriesSearchInput, (val) => {
  clearTimeout(weightCategorySearchTimer)
  weightCategorySearchTimer = setTimeout(() => { weightCategoriesSearch.value = val }, 300)
})
watch(weightCategoriesSearch, () => fetchWeightCategories())

async function fetchWeightCategories() {
  weightCategoriesLoading.value = true
  try {
    const res = await apiGet<PaginatedResponse<WeightCategory>>(
      '/api/public/registration_form/weight_categories',
      weightCategoriesSearch.value ? { search: weightCategoriesSearch.value } : {},
    )
    weightCategories.value = res.data ?? []
  } catch {
    weightCategories.value = []
  } finally {
    weightCategoriesLoading.value = false
  }
}

function loadStep3Data() {
  fetchTournaments()
  fetchWeightCategories()
}

const step3Valid = computed(() =>
  selectedTournamentId.value
  && selectedDisciplineId.value
  && selectedWeightCategoryId.value,
)

// Lookup helpers for step 4 summary
const selectedTournament = computed(() => tournaments.value.find(t => t.id === selectedTournamentId.value))
const selectedDiscipline = computed(() => disciplines.value.find(d => d.id === selectedDisciplineId.value))
const selectedWeightCategory = computed(() => weightCategories.value.find(w => w.id === selectedWeightCategoryId.value))

// ── Step 4: Riepilogo + submit ───────────────────────────────────────────────
const showPrivacyModal = ref(false)
const privacyPolicyText = ref('')
async function openPrivacyModal() {
  if (!privacyPolicyText.value) {
    privacyPolicyText.value = await $fetch<string>('/privacy.txt', { responseType: 'text' })
  }
  showPrivacyModal.value = true
}
const countdown = ref(0)
const privacyConsent = ref(false)
const submitting = ref(false)
const submitted = ref(false)
const registrationId = ref<string | null>(null)
const pdfUrl = ref<string | null>(null)
const downloadingPdf = ref(false)

// ── Verifica via codice OTP ──────────────────────────────────────────────────
const RESEND_COOLDOWN_S = 60

const codeSent = ref(false)
const verificationCode = ref('')
const sendingCode = ref(false)
const resendCooldown = ref(0)
let resendTimer: ReturnType<typeof setInterval> | undefined

function startResendCooldown() {
  clearInterval(resendTimer)
  resendCooldown.value = RESEND_COOLDOWN_S
  resendTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) { clearInterval(resendTimer) }
  }, 1000)
}

/**
 * Risponde sempre 204: non sappiamo (e non dobbiamo dire) se il codice sia
 * stato davvero inviato, né a quale indirizzo — per un atleta già registrato
 * il codice va all'email a DB, che può differire da quella digitata.
 */
async function sendVerificationCode() {
  sendingCode.value = true
  try {
    await apiPost<void>('/api/public/registration_form/verification_code', {
      tax_number: athleteState.tax_number,
      email: athleteState.email,
    })
    codeSent.value = true
    startResendCooldown()
  } catch (e: unknown) {
    const message = (e as { data?: { message?: string } })?.data?.message
    toast.add({ title: message ?? t('common.error'), color: 'error' })
  } finally {
    sendingCode.value = false
  }
}

async function submit() {
  submitting.value = true
  try {
    const regRes = await apiPost<{ data: { id: string, pdf_url: string } }>(
      '/api/public/registration_form/registrations',
      {
        tax_number: athleteState.tax_number,
        email: athleteState.email,
        code: verificationCode.value,
        first_name: athleteState.first_name,
        last_name: athleteState.last_name,
        birth_date: athleteState.birth_date,
        gender: athleteState.gender,
        team_name: athleteState.team_name || null,
        phone_number: athleteState.phone_number || null,
        tournament_id: selectedTournamentId.value,
        discipline_id: selectedDisciplineId.value,
        weight_category_id: selectedWeightCategoryId.value,
      },
    )
    registrationId.value = regRes.data.id
    pdfUrl.value = regRes.data.pdf_url
    submitted.value = true
  } catch (e: unknown) {
    // Niente reset: il codice può essere sbagliato e va lasciato ricorreggibile.
    const message = (e as { data?: { message?: string } })?.data?.message
    toast.add({ title: message ?? t('common.error'), color: 'error' })
  } finally {
    submitting.value = false
  }
}

async function downloadPdf() {
  if (!pdfUrl.value) { return }
  downloadingPdf.value = true
  try {
    // URL assoluto e già firmato: aggiungere baseURL o ricostruire il path
    // invaliderebbe la firma (403).
    const blob = await $fetch<Blob>(pdfUrl.value, { responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registration-${registrationId.value}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: unknown) {
    const message = (e as { data?: { message?: string } })?.data?.message
    toast.add({ title: message ?? t('common.error'), color: 'error' })
  } finally {
    downloadingPdf.value = false
  }
}

function resetForm() {
  submitted.value = false
  privacyConsent.value = false
  registrationId.value = null
  pdfUrl.value = null
  codeSent.value = false
  verificationCode.value = ''
  clearInterval(resendTimer)
  resendCooldown.value = 0
  currentStep.value = 0
  taxNumberInput.value = ''
  emailInput.value = ''
  existingAthlete.value = null
  isNewAthlete.value = false
  Object.assign(athleteState, { first_name: '', last_name: '', birth_date: '', gender: 'male' as Gender, tax_number: '', team_name: '', email: '', phone_number: '' })
  selectedTournamentId.value = null
  selectedDisciplineId.value = null
  selectedWeightCategoryId.value = null
  tournamentsSearchInput.value = ''
  disciplinesSearchInput.value = ''
  weightCategoriesSearchInput.value = ''
}

onBeforeUnmount(() => {
  clearTimeout(tournamentSearchTimer)
  clearTimeout(disciplineSearchTimer)
  clearTimeout(weightCategorySearchTimer)
  clearInterval(resendTimer)
})
</script>
