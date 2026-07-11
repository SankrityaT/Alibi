import 'dotenv/config'
import { HttpSupermemoryClient } from '../lib/supermemory/client.js'
import { ClaudeClient } from '../lib/anthropic/client.js'
import { seedGroundTruth, tellSuspect } from '../lib/suspect/memory.js'
import { respondAsSuspect } from '../lib/suspect/respond.js'
import { mara, jonas } from '../test/fixtures/suspects.js'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

async function main(): Promise<void> {
  const supermemory = new HttpSupermemoryClient({
    baseUrl: requireEnv('SUPERMEMORY_BASE_URL'),
    apiKey: requireEnv('SUPERMEMORY_API_KEY')
  })
  const anthropic = new ClaudeClient()

  await seedGroundTruth(
    mara.containerTag,
    ['Rerouted Theo\'s delivery path at 21:45, logged internally as "traffic".'],
    supermemory
  )

  const first = await respondAsSuspect(mara, "Did you change Theo's route that night?", {
    supermemory,
    anthropic
  })
  console.log('--- First answer ---')
  console.log(first.answer)
  console.log('Retrieved memories:', first.retrievedMemories)

  await tellSuspect(
    mara.containerTag,
    'The detective told you: "We found a witness who says you were seen leaving early."',
    'player-told',
    supermemory
  )

  const second = await respondAsSuspect(mara, 'Were you seen leaving early?', {
    supermemory,
    anthropic
  })
  console.log('--- Second answer, after a planted claim ---')
  console.log(second.answer)
  console.log('Retrieved memories:', second.retrievedMemories)

  await seedGroundTruth(
    jonas.containerTag,
    ['Was at the docks at 22:00 to meet Theo for money.'],
    supermemory
  )

  const isolationCheck = await respondAsSuspect(mara, 'Where was Jonas at 22:00?', {
    supermemory,
    anthropic
  })
  console.log('--- Isolation check: asking Mara about a fact only Jonas witnessed ---')
  console.log(isolationCheck.answer)
  console.log('Retrieved memories (expect empty):', isolationCheck.retrievedMemories)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
