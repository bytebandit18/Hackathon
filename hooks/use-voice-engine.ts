"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface VoiceEngineOptions {
  onCommand?: (command: string) => void
  continuous?: boolean
}

export function useVoiceEngine({ onCommand, continuous = true }: VoiceEngineOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const isSpeakingRef = useRef(false)

  // Update onresult to ignore transcriptions while the app is talking
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = continuous
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (isSpeakingRef.current) return // Ignore input if TTS is currently active

        let finalTranscript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript.trim().toLowerCase())
          onCommand?.(finalTranscript.trim().toLowerCase())
        }
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        if (continuous && isListening) {
          try {
            recognition.start()
          } catch {
            // Already started
          }
        } else {
          setIsListening(false)
        }
      }

      recognitionRef.current = recognition
    }

    return () => {
      recognitionRef.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continuous])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch {
        // Already started
      }
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  const speak = useCallback((text: string, priority: "polite" | "assertive" = "polite") => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)

    // Block the microphone from processing this utterance
    utterance.onstart = () => {
      isSpeakingRef.current = true
    }
    utterance.onend = () => {
      // Small buffer to let room echoes die down
      setTimeout(() => {
        isSpeakingRef.current = false
      }, 500)
    }
    utterance.onerror = () => {
      isSpeakingRef.current = false
    }

    utterance.rate = priority === "assertive" ? 1.1 : 0.95
    utterance.pitch = 1
    utterance.volume = 1
    window.speechSynthesis.speak(utterance)
  }, [])

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    speak,
  }
}
