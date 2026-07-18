import { getActivePublicCase } from '../../../lib/case/store.js'

// The active case changes at runtime (each new game reseeds it), so this route
// must never be statically cached — otherwise a production build freezes the
// first response and every screen shows a stale case. force-dynamic opts out of
// Next's route cache; the no-store header stops the browser from serving a stale
// /api/case from disk when the case has since changed.
export const dynamic = 'force-dynamic'

// Public, client-safe view of the active case: suspect roster + framing, never
// the solution. Client screens (station navigation, the accusation roster) read
// this so the culprit/planted-memory answer never ships in the browser bundle.
export async function GET(): Promise<Response> {
  return Response.json(getActivePublicCase(), {
    headers: { 'Cache-Control': 'no-store, max-age=0' }
  })
}
