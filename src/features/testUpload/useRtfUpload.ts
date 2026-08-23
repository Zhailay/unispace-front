import { useState, useCallback, useRef, useEffect } from 'react'
import { getLang } from '@/shared/i18n/lang'
import type { ParseResult } from './testUploadApi'

interface UploadState {
  isUploading: boolean
  progress: number
  status: string
  error: string | null
}

interface UseRtfUploadReturn extends UploadState {
  upload: (formData: FormData) => Promise<ParseResult | null>
  reset: () => void
  abort: () => void
}

/**
 * Hook for uploading RTF files with progress indicator.
 * RTK Query doesn't support upload progress, so we use XMLHttpRequest directly.
 */
export function useRtfUpload(): UseRtfUploadReturn {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    status: '',
    error: null,
  })

  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const fakeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearFakeTimer = useCallback(() => {
    if (fakeTimerRef.current) {
      clearInterval(fakeTimerRef.current)
      fakeTimerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clearFakeTimer()
    setState({
      isUploading: false,
      progress: 0,
      status: '',
      error: null,
    })
  }, [clearFakeTimer])

  const abort = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort()
      xhrRef.current = null
    }
    clearFakeTimer()
    reset()
  }, [clearFakeTimer, reset])

  const upload = useCallback(
    async (formData: FormData): Promise<ParseResult | null> => {
      clearFakeTimer()

      setState({
        isUploading: true,
        progress: 10,
        status: 'Загрузка файла на сервер...',
        error: null,
      })

      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr

        const baseUrl = import.meta.env.VITE_API_URL || '/api'

        xhr.open('POST', `${baseUrl}/test-upload/parse`, true)
        xhr.withCredentials = true
        xhr.setRequestHeader('X-Lang', getLang())
        xhr.timeout = 300000 // 5 minutes

        // Track upload progress
        xhr.upload.addEventListener('progress', (ev) => {
          if (ev.lengthComputable) {
            const uploadPct = Math.round((ev.loaded / ev.total) * 30)
            setState((prev) => ({
              ...prev,
              progress: 10 + uploadPct,
              status: `Загрузка файла... ${Math.round((ev.loaded / ev.total) * 100)}%`,
            }))
          }
        })

        // When upload completes, start fake progress for parsing phase
        xhr.upload.addEventListener('load', () => {
          let fakeProgress = 40

          fakeTimerRef.current = setInterval(() => {
            if (fakeProgress < 85) {
              fakeProgress += Math.random() * 5
              setState((prev) => ({
                ...prev,
                progress: Math.round(fakeProgress),
                status: 'Конвертация RTF и разбор вопросов...',
              }))
            } else {
              clearFakeTimer()
            }
          }, 1500)
        })

        xhr.onload = () => {
          clearFakeTimer()

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data: ParseResult = JSON.parse(xhr.responseText)

              if (data.ok) {
                setState({
                  isUploading: false,
                  progress: 100,
                  status: `Готово! Вопросов: ${data.total} (правильных: ${data.correct}, с ошибками: ${data.incorrect})`,
                  error: null,
                })
                resolve(data)
              } else {
                setState({
                  isUploading: false,
                  progress: 0,
                  status: '',
                  error: data.error || 'Неизвестная ошибка',
                })
                resolve(null)
              }
            } catch {
              setState({
                isUploading: false,
                progress: 0,
                status: '',
                error: 'Ошибка обработки ответа сервера',
              })
              resolve(null)
            }
          } else {
            let errorMsg = 'Ошибка сервера'
            try {
              const errData = JSON.parse(xhr.responseText)
              if (errData.error) {
                errorMsg = errData.error
              }
            } catch {
              // Use default message
            }

            setState({
              isUploading: false,
              progress: 0,
              status: '',
              error: errorMsg,
            })
            resolve(null)
          }

          xhrRef.current = null
        }

        xhr.onerror = () => {
          clearFakeTimer()
          setState({
            isUploading: false,
            progress: 0,
            status: '',
            error: 'Ошибка сети при загрузке файла',
          })
          xhrRef.current = null
          resolve(null)
        }

        xhr.ontimeout = () => {
          clearFakeTimer()
          setState({
            isUploading: false,
            progress: 0,
            status: '',
            error: 'Превышено время ожидания',
          })
          xhrRef.current = null
          resolve(null)
        }

        xhr.send(formData)
      })
    },
    [clearFakeTimer],
  )

  // Cleanup on unmount: abort XHR and clear timer
  useEffect(() => {
    return () => {
      if (xhrRef.current) {
        xhrRef.current.abort()
        xhrRef.current = null
      }
      clearFakeTimer()
    }
  }, [clearFakeTimer])

  return {
    ...state,
    upload,
    reset,
    abort,
  }
}
