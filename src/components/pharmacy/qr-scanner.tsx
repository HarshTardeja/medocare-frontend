"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode"
import { X, CameraOff } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  onDecoded: (text: string) => void
  onClose: () => void
}

// A fresh element id per mount — html5-qrcode looks the container up by id.
let counter = 0

export function QrScanner({ onDecoded, onClose }: Props) {
  const [error, setError] = useState<string | null>(null)
  const elementId = useRef(`qr-reader-${++counter}`)

  useEffect(() => {
    let cancelled = false
    const scanner = new Html5Qrcode(elementId.current, /* verbose */ false)

    const teardown = async () => {
      try {
        const state = scanner.getState()
        if (
          state === Html5QrcodeScannerState.SCANNING ||
          state === Html5QrcodeScannerState.PAUSED
        ) {
          await scanner.stop()
        }
      } catch {
        /* already stopped or never started */
      }
      try {
        scanner.clear()
      } catch {
        /* nothing rendered */
      }
    }

    // `start` rejects on permission denial / no camera; `.catch` keeps the
    // chain resolved so the cleanup can always await it before tearing down.
    const started = scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (!cancelled) onDecoded(decodedText.trim())
        },
        () => {
          /* per-frame decode miss — expected */
        }
      )
      .catch(() => {
        if (!cancelled) {
          setError(
            "Couldn't start the camera. Check the browser's camera permission, or paste the access token instead."
          )
        }
      })

    return () => {
      cancelled = true
      void Promise.resolve(started).then(teardown)
    }
    // Run once — re-running would tear the camera down mid-scan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <div className="flex items-center justify-between pb-2">
        <span className="text-sm font-medium">Point the camera at the patient&rsquo;s QR code</span>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close scanner">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <CameraOff className="h-5 w-5 flex-none" />
          <p>{error}</p>
        </div>
      ) : (
        <div id={elementId.current} className="mx-auto w-full max-w-xs overflow-hidden rounded-md" />
      )}
    </div>
  )
}
