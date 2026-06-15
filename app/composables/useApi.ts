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
  const token = useState<string | null>('auth-token')
  const { public: { apiBase } } = useRuntimeConfig()
  const { $i18n } = useNuxtApp()

  const client = $fetch.create({
    baseURL: apiBase as string,
    onRequest({ options }) {
      const headers = new Headers(options.headers as HeadersInit)
      if (token.value) {
        headers.set('Authorization', `Bearer ${token.value}`)
      }
      headers.set('Accept-Language', $i18n.locale.value)
      options.headers = headers
    },
  })

  const get = <T>(path: string, params?: QueryParams) =>
    client<T>(path, {
      method: 'GET',
      params,
    })

  const post = <T>(path: string, body?: Record<string, unknown>, params?: QueryParams) =>
    client<T>(path, {
      method: 'POST',
      body,
      params,
    })

  const put = <T>(path: string, body?: Record<string, unknown>, params?: QueryParams) =>
    client<T>(path, {
      method: 'PUT',
      body,
      params,
    })

  const del = <T>(path: string, params?: QueryParams) =>
    client<T>(path, {
      method: 'DELETE',
      params,
    })

  const download = async (path: string, filename = 'document.pdf') => {
    const blob = await client<Blob>(path, {
      method: 'GET',
      responseType: 'blob',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return { get, post, put, del, download }
}
