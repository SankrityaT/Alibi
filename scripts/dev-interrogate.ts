import 'dotenv/config'
import { HttpSupermemoryClient } from '../lib/supermemory/client.js'
import { ClaudeClient } from '../lib/anthropic/client.js'
import { seedGroundTruth, tellSuspect } from '../lib/suspect/memory.js'
import { respondAsSuspect, type CharacterSheet } from '../lib/suspect/respond.js'

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
  const anthropic = new ClaudeClient(requireEnv('ANTHROPIC_API_KEY'))

  const mara: CharacterSheet = {
    suspectId: 'mara',
    containerTag: 'dev-suspect-mara',
    name: 'Mara Okafor',
    voice: 'clipped, professional, deflects with procedure',
    motive: 'covering up the reroute she made at 21:45',
    hiddenFacts: 'She edited the dispatch log to reroute Theo at 21:45.'
  }

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
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
