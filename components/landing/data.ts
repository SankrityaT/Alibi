//created by kinjal
// Static content arrays hoisted to module level (rendering-hoist-jsx) so they
// aren't re-created per render.

export type IconKey =
  | 'memory' | 'spread' | 'dig' | 'notebook'
  | 'culprit' | 'voice' | 'local'

export type Run = {
  id: string
  caseName: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  points: number
  time: string
  rating: string
}

export const MOCK_BOARD: Run[] = [
  { id: 'm1', caseName: 'The Missing Courier', difficulty: 'Hard', points: 30, time: '14:22', rating: 'Sherlock' },
  { id: 'm2', caseName: 'The Missing Courier', difficulty: 'Hard', points: 30, time: '16:08', rating: 'Inspector' },
  { id: 'm3', caseName: 'The Missing Courier', difficulty: 'Medium', points: 20, time: '09:41', rating: 'Inspector' },
  { id: 'm4', caseName: 'The Missing Courier', difficulty: 'Easy', points: 10, time: '04:12', rating: 'Detective' },
]

export const LB_STORAGE_KEY = 'alibi-runs-v1'
