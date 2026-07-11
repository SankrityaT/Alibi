'use client'

import { useCallback } from 'react'
import { StationCanvas } from '../../components/station/StationCanvas.js'

export default function StationPage() {
  const handleEnterRoom = useCallback((roomId: string) => {
    // Plan 3 replaces this with an actual scene transition to the
    // interrogation/evidence/case-board UI. For now, logging is enough to
    // manually verify room-entry detection end-to-end in a real browser.
    console.log(`Entered room: ${roomId}`)
  }, [])

  return <StationCanvas onEnterRoom={handleEnterRoom} />
}
