type QueryParams = Record<string, string | number | boolean | undefined>

export function getApiErrorMessage(e: unknown): string | undefined {
  if (e && typeof e === 'object' && 'data' in e) {
    const data = (e as { data?: unknown }).data
    if (data && typeof data === 'object' && 'message' in data) {
      return (data as { message?: string }).message || undefined
    }
  }
}

export function useApi() {
  const client = useSanctumClient()
  const { $i18n } = useNuxtApp()
  const lang = () => ({ 'Accept-Language': $i18n.locale.value })

  const get = <T>(path: string, params?: QueryParams) =>
    client<T>(path, { method: 'GET', params, headers: lang() })

  const post = <T>(path: string, body?: Record<string, unknown>, params?: QueryParams) =>
    client<T>(path, { method: 'POST', body, params, headers: lang() })

  const upload = <T>(path: string, formData: FormData, params?: QueryParams) =>
    client<T>(path, { method: 'POST', body: formData, params, headers: lang() })

  const put = <T>(path: string, body?: Record<string, unknown>, params?: QueryParams) =>
    client<T>(path, { method: 'PUT', body, params, headers: lang() })

  const del = <T>(path: string, params?: QueryParams, body?: Record<string, unknown>) =>
    client<T>(path, { method: 'DELETE', params, body, headers: lang() })

  const download = async (path: string, filename = 'document.pdf') => {
    if (!import.meta.client) { return }
    const { config } = useApiConfig()
    const token = useAuthTokenCookie()
    const blob = await $fetch<Blob>(path, {
      method: 'GET',
      responseType: 'blob',
      baseURL: config.value.baseUrl,
      headers: {
        ...lang(),
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      },
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return { get, post, put, del, download, upload }
}
