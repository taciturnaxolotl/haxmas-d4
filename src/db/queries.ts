import { db } from "./index"
import { snowflakes } from "./schema"
import { eq, desc } from "drizzle-orm"

// Seeded snowflake generator using 6-fold rotational symmetry
class SnowflakeGenerator {
  private chars = {
    classic: ['*', '+', '-', '|', 'o', '.', 'x'],
    dense: ['#', '@', '%', '&', '$', '■', '▲'],
    minimal: ['.', 'o', '*', '°', '·'],
    mixed: ['*', '+', '-', '|', 'o', '.', 'x', '#', '@', '%', '&', '$']
  }

  // Simple hash function for seeding
  private hash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  // Seeded random number generator
  private seededRandom(seed: string) {
    let value = this.hash(seed.toString())
    return () => {
      value = (value * 16807) % 2147483647
      return (value - 1) / 2147483646
    }
  }

  // Generate one 60-degree segment
  private generateSegment(rng: () => number, maxRadius: number, chars: string[]) {
    const points: Array<{ x: number; y: number; char: string }> = []
    
    // Main branch along positive y-axis
    for (let y = 1; y <= maxRadius; y++) {
      if (rng() > 0.3) { // 70% chance for main branch
        points.push({
          x: 0,
          y: y,
          char: chars[Math.floor(rng() * chars.length)]
        })
        
        // Side branches
        if (y > 2 && rng() > 0.6) { // 40% chance for side branch
          const sideY = y - Math.floor(rng() * 2) - 1
          const sideX = rng() > 0.5 ? 1 : -1
          
          if (Math.abs(sideX) + Math.abs(sideY) <= maxRadius) {
            points.push({
              x: sideX,
              y: sideY,
              char: chars[Math.floor(rng() * chars.length)]
            })
          }
        }
      }
    }
    
    return points
  }

  generate(seed: string, size: number, style: 'classic' | 'dense' | 'minimal' | 'mixed' = 'classic'): string {
    const rng = this.seededRandom(seed)
    const chars = this.chars[style]
    const grid = Array(size).fill(null).map(() => Array(size).fill(' '))
    const center = Math.floor(size / 2)
    
    // Generate one 60-degree segment
    const points = this.generateSegment(rng, center, chars)
    
    // Apply 6-fold symmetry
    for (let rotation = 0; rotation < 6; rotation++) {
      const angle = rotation * Math.PI / 3
      points.forEach(point => {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const x = Math.round(point.x * cos - point.y * sin) + center
        const y = Math.round(point.x * sin + point.y * cos) + center
        
        if (x >= 0 && x < size && y >= 0 && y < size) {
          grid[y][x] = point.char
        }
      })
    }
    
    // Center point
    grid[center][center] = chars[Math.floor(rng() * chars.length)]
    
    return grid.map(row => row.join('')).join('\n')
  }
}

const generator = new SnowflakeGenerator()

export function listSnowflakes() {
  return db.select().from(snowflakes).orderBy(desc(snowflakes.id)).all()
}

export function createSnowflake(size?: number, seed?: string, style?: 'classic' | 'dense' | 'minimal' | 'mixed') {
  const createdAt = Math.floor(Date.now() / 1000)
  const snowflakeSize = size || Math.floor(Math.random() * 10) + 3 // 3-12 range for odd sizes
  
  // Ensure odd size for symmetry
  const actualSize = snowflakeSize % 2 === 0 ? snowflakeSize + 1 : snowflakeSize
  
  // Generate seed from timestamp + random if not provided
  const snowflakeSeed = seed || `snowflake-${Date.now()}-${Math.random()}`
  const snowflakeStyle = style || (['classic', 'dense', 'minimal', 'mixed'] as const)[Math.floor(Math.random() * 4)]

  const res = db.insert(snowflakes).values({
    pattern: generator.generate(snowflakeSeed, actualSize, snowflakeStyle),
    size: actualSize,
    melted: 0,
    createdAt,
  }).run()

  return { id: Number(res.lastInsertRowid), seed: snowflakeSeed, style: snowflakeStyle }
}

export function meltSnowflake(id: number) {
  const res = db.update(snowflakes)
    .set({ melted: 1 })
    .where(eq(snowflakes.id, id))
    .run()

  return { changes: res.changes }
}

export function deleteSnowflake(id: number) {
  const res = db.delete(snowflakes).where(eq(snowflakes.id, id)).run()
  return { changes: res.changes }
}

export function getSnowflake(id: number) {
  return db.select().from(snowflakes).where(eq(snowflakes.id, id)).get()
}
