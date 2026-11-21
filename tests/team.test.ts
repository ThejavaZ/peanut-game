import { describe, expect, test } from 'bun:test'
import { PROJECT, TEAM, initials } from '../src/features/credits/team'

describe('the team', () => {
  test('lists the four members of the group, once each', () => {
    expect(TEAM).toHaveLength(4)
    expect(new Set(TEAM.map((member) => member.fullName)).size).toBe(4)
  })

  test('every member carries the responsibility promised in Act 1 §17', () => {
    for (const member of TEAM) {
      expect(member.role.length).toBeGreaterThan(0)
    }
    expect(TEAM[0].role).toMatch(/development/i)
    expect(TEAM[1].role).toMatch(/gameplay|test/i)
    expect(TEAM[2].role).toMatch(/design/i)
    expect(TEAM[3].role).toMatch(/documentation/i)
  })
})

describe('initials', () => {
  test('takes the first and last name', () => {
    expect(initials('Javier Armando Sarmiento Gil')).toBe('JG')
    expect(initials('Laura Jacqueline Dávila Villa')).toBe('LV')
    expect(initials('Brayan López Orcí')).toBe('BO')
  })

  test('handles the awkward cases without throwing', () => {
    expect(initials('Peanut')).toBe('P')
    expect(initials('')).toBe('')
    expect(initials('   ')).toBe('')
  })
})

describe('the project header', () => {
  test('names the course, the school and the repository', () => {
    expect(PROJECT.name).toBe('Peanut')
    expect(PROJECT.course).toContain('IDGS10-2')
    expect(PROJECT.school).toContain('Universidad Tecnológica')
    expect(PROJECT.repository).toMatch(/^https:\/\//)
  })
})
