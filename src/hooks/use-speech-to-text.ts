'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseSpeechToTextOptions {
  lang?: string
}

interface UseSpeechToTextReturn {
  isListening: boolean
  listeningField: string | null
  isSupported: boolean
  error: string | null
  startListening: (fieldId: string, onResult: (transcript: string) => void) => void
  stopListening: () => void
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const { lang = 'es-ES' } = options
  const [isListening, setIsListening] = useState(false)
  const [listeningField, setListeningField] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const onResultCallbackRef = useRef<((transcript: string) => void) | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        setIsSupported(false)
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (err) {
        // ignore if already stopped
      }
    }
    setIsListening(false)
    setListeningField(null)
  }, [])

  const startListening = useCallback(
    (fieldId: string, onResult: (transcript: string) => void) => {
      setError(null)

      if (typeof window === 'undefined') return

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        setIsSupported(false)
        setError('El reconocimiento de voz no está soportado en este navegador.')
        return
      }

      // If already listening to the same field, toggle off
      if (isListening && listeningField === fieldId) {
        stopListening()
        return
      }

      // If listening to a different field, stop previous one first
      if (isListening) {
        stopListening()
      }

      try {
        const recognition = new SpeechRecognition()
        recognition.lang = lang
        recognition.continuous = false
        recognition.interimResults = false

        onResultCallbackRef.current = onResult

        recognition.onstart = () => {
          setIsListening(true)
          setListeningField(fieldId)
        }

        recognition.onresult = (event: any) => {
          let currentTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              currentTranscript += event.results[i][0].transcript
            }
          }

          if (currentTranscript && onResultCallbackRef.current) {
            onResultCallbackRef.current(currentTranscript)
          }
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          if (event.error !== 'no-speech') {
            setError(`Error de dictado: ${event.error}`)
          }
          setIsListening(false)
          setListeningField(null)
        }

        recognition.onend = () => {
          setIsListening(false)
          setListeningField(null)
        }

        recognitionRef.current = recognition
        recognition.start()
      } catch (err: any) {
        console.error('Error starting speech recognition:', err)
        setError('No se pudo iniciar el dictado por voz.')
        setIsListening(false)
        setListeningField(null)
      }
    },
    [isListening, listeningField, lang, stopListening]
  )

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // ignore
        }
      }
    }
  }, [])

  return {
    isListening,
    listeningField,
    isSupported,
    error,
    startListening,
    stopListening,
  }
}
