import { useState, useEffect, useRef } from 'react'

export function usePolling<T>(
  fn: () => Promise<T>,
  shouldStop: (data: T) => boolean,
  intervalMs = 3000
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    const poll = async () => {
      try {
        const result = await fn()
        setData(result)
        if (shouldStop(result)) {
          setIsPolling(false)
          clearInterval(intervalRef.current)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Polling failed')
        setIsPolling(false)
        clearInterval(intervalRef.current)
      }
    }

    // Run immediately then on interval
    poll()
    intervalRef.current = setInterval(poll, intervalMs)

    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, error, isPolling }
}
