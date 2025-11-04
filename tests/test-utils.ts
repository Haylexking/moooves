import type { GameBoard, Player } from '@/lib/types'

export function createEmptyBoard(size = 30): GameBoard {
  return Array(size).fill(null).map(() => Array(size).fill(null))
}

export function placeStones(board: GameBoard, stones: [number, number, Player][]) {
  const newBoard = JSON.parse(JSON.stringify(board)) as GameBoard
  if (stones && stones.length > 0) {
    stones.forEach(([row, col, player]) => {
      if (newBoard[row] && newBoard[row][col] !== undefined) {
        newBoard[row][col] = player
      }
    })
  }
  return newBoard
}

export function findSequence(board: GameBoard, player: Player, sequence: Position[]): boolean {
  return sequence.every(([row, col]) => board[row]?.[col] === player)
}

export function printBoard(board: GameBoard, highlight?: Position[]) {
  const size = board.length
  const highlighted = new Set(highlight?.map(([r, c]) => `${r},${c}`))
  
  // Print column numbers
  console.log('   ' + Array.from({length: size}, (_, i) => i.toString().padStart(2, ' ')).join(' '))
  
  board.forEach((row, i) => {
    const rowStr = row.map((cell, j) => {
      const cellChar = cell || '.'
      return highlighted.has(`${i},${j}`) ? `[${cellChar}]` : ` ${cellChar} `
    }).join('')
    console.log(`${i.toString().padStart(2, ' ')} ${rowStr}`)
  })
}

// Helper types
type Position = [number, number]
