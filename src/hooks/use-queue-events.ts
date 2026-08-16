"use client"

import { useEffect, useRef, useState } from "react"
import { API_BASE_URL } from "@/lib/api"
import { eventsApi } from "@/lib/api-client"

/**
 * Live queue updates over Server-Sent Events.
 *
 * EventSource cannot set an Authorization header, so we exchange the bearer
 * token for a short-lived stream token and pass that in the query string.
 *
 * The caller keeps its existing poll as a fallback: SSE is best-effort (a
 * proxy may drop it, Redis may be down), and `connected` lets the caller slow
 * the poll down rather than turn it off.
 */

export type QueueEventName =
  | "connected"
  | "position_changed"
  | "reassigned"
  | "time_to_leave"
  | "called"
  | "completed"
  | "cancelled"
  | "queue_updated"

const QUEUE_EVENTS: QueueEventName[] = [
  "connected",
  "position_changed",
  "reassigned",
  "time_to_leave",
  "called",
  "completed",
  "cancelled",
  "queue_updated",
]

interface UseQueueEventsOptions {
  /** Called on any event, with the event name and its payload. */
  onEvent?: (event: QueueEventName, data: unknown) => void
  enabled?: boolean
}

function useEventStream(path: string | null, options: UseQueueEventsOptions = {}) {
  const { onEvent, enabled = true } = options
  const [connected, setConnected] = useState(false)
  // Held in a ref so re-renders don't tear down and rebuild the stream.
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!enabled || !path) return

    let source: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false
    let attempt = 0

    const connect = async () => {
      if (cancelled) return
      try {
        const { token } = await eventsApi.getStreamToken()
        if (cancelled) return

        source = new EventSource(`${API_BASE_URL}${path}?token=${encodeURIComponent(token)}`)

        source.onopen = () => {
          attempt = 0
          setConnected(true)
        }

        QUEUE_EVENTS.forEach((name) => {
          source?.addEventListener(name, (event) => {
            let data: unknown = null
            try {
              data = JSON.parse((event as MessageEvent).data)
            } catch {
              data = (event as MessageEvent).data
            }
            onEventRef.current?.(name, data)
          })
        })

        source.onerror = () => {
          setConnected(false)
          source?.close()
          source = null
          if (cancelled) return
          // Exponential backoff, capped. The stream token is short-lived, so
          // each reconnect mints a fresh one via connect().
          attempt += 1
          const delay = Math.min(1000 * 2 ** attempt, 30000)
          retryTimer = setTimeout(connect, delay)
        }
      } catch {
        if (cancelled) return
        attempt += 1
        retryTimer = setTimeout(connect, Math.min(1000 * 2 ** attempt, 30000))
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      source?.close()
      setConnected(false)
    }
  }, [path, enabled])

  return { connected }
}

/** Live updates for one patient's queue entry. */
export function useQueueEvents(queueId: number | null, options: UseQueueEventsOptions = {}) {
  return useEventStream(queueId ? `/api/events/queue/${queueId}` : null, options)
}

/** Live updates for a doctor's working list. */
export function useDoctorQueueEvents(doctorId: number | null, options: UseQueueEventsOptions = {}) {
  return useEventStream(doctorId ? `/api/events/doctor/${doctorId}` : null, options)
}
