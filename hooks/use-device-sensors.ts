"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface SensorData {
  heading: number
  steps: number
  isMoving: boolean
}

interface Breadcrumb {
  heading: number
  steps: number
  timestamp: number
}

export function useDeviceSensors() {
  const [sensorData, setSensorData] = useState<SensorData>({
    heading: 0,
    steps: 0,
    isMoving: false,
  })
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([])
  const [isTracking, setIsTracking] = useState(false)
  const lastAccelRef = useRef<number>(0)
  const stepThreshold = 1.2
  const stepsRef = useRef(0)
  const headingRef = useRef(0)

  useEffect(() => {
    if (!isTracking) return

    let accelHandler: ((event: DeviceMotionEvent) => void) | null = null
    let orientHandler: ((event: DeviceOrientationEvent) => void) | null = null

    accelHandler = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity
      if (!acc || acc.z === null || acc.y === null || acc.x === null) return

      const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2)
      const delta = Math.abs(magnitude - lastAccelRef.current)

      if (delta > stepThreshold) {
        stepsRef.current += 1
        setSensorData((prev) => ({
          ...prev,
          steps: stepsRef.current,
          isMoving: true,
        }))

        setBreadcrumbs((prev) => [
          ...prev,
          {
            heading: headingRef.current,
            steps: stepsRef.current,
            timestamp: Date.now(),
          },
        ])
      } else {
        setSensorData((prev) => ({ ...prev, isMoving: false }))
      }

      lastAccelRef.current = magnitude
    }

    orientHandler = (event: any) => {
      // iOS devices provide webkitCompassHeading which is true north
      if (typeof event.webkitCompassHeading !== "undefined") {
        headingRef.current = Math.round(event.webkitCompassHeading)
        setSensorData((prev) => ({ ...prev, heading: headingRef.current }))
        return
      }

      // Standard absolute orientation relative to Earth
      if (event.absolute === true || event.type === "deviceorientationabsolute") {
        if (event.alpha !== null) {
          // alpha is 0 at north, increases counter-clockwise.
          const heading = Math.round(360 - event.alpha) % 360
          headingRef.current = heading
          setSensorData((prev) => ({ ...prev, heading }))
        }
      } else if (event.alpha !== null) {
        // Fallback to relative orientation or standard Android where absolute is hidden in standard event
        // Browsers handle 'alpha' differently. Without webkitCompassHeading, it's often 
        // 360 - alpha on Android Chrome as well.
        const heading = Math.round(360 - event.alpha) % 360
        headingRef.current = heading
        setSensorData((prev) => ({ ...prev, heading }))
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("devicemotion", accelHandler)

      // Attempt to use absolute orientation by default for Android/Chrome
      // Use any cast to bypass strict TS check on Window type for this specific event
      if (typeof (window as any).ondeviceorientationabsolute !== "undefined") {
        window.addEventListener("deviceorientationabsolute", orientHandler)
      } else {
        window.addEventListener("deviceorientation", orientHandler)
      }
    }

    return () => {
      if (accelHandler) window.removeEventListener("devicemotion", accelHandler)
      if (orientHandler) {
        window.removeEventListener("deviceorientationabsolute", orientHandler)
        window.removeEventListener("deviceorientation", orientHandler)
      }
    }
  }, [isTracking])

  const startTracking = useCallback(() => {
    stepsRef.current = 0
    setBreadcrumbs([])
    setIsTracking(true)
  }, [])

  const stopTracking = useCallback(() => {
    setIsTracking(false)
  }, [])

  const resetPath = useCallback(() => {
    stepsRef.current = 0
    setBreadcrumbs([])
    setSensorData({ heading: 0, steps: 0, isMoving: false })
  }, [])

  return {
    sensorData,
    breadcrumbs,
    isTracking,
    startTracking,
    stopTracking,
    resetPath,
  }
}
