import { getActivePublicCase } from '../../../lib/case/store.js'

// Public, client-safe view of the active case: suspect roster + framing, never
// the solution. Client screens (station navigation, the accusation roster) read
// this so the culprit/planted-memory answer never ships in the browser bundle.
export async function GET(): Promise<Response> {
  return Response.json(getActivePublicCase())
}
