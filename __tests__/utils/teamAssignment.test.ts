import { generateTeamAssignment, PROJECT_POOL } from '@/utils/teamAssignment'

describe('generateTeamAssignment', () => {
  describe('determinism', () => {
    it('returns the same project for the same student ID', () => {
      const r1 = generateTeamAssignment('user-abc-123')
      const r2 = generateTeamAssignment('user-abc-123')
      expect(r1.project.name).toBe(r2.project.name)
    })

    it('returns the same team configuration for the same student ID', () => {
      const r1 = generateTeamAssignment('user-abc-123')
      const r2 = generateTeamAssignment('user-abc-123')
      expect(r1.team.map(m => m.name)).toEqual(r2.team.map(m => m.name))
      expect(r1.team.map(m => m.role)).toEqual(r2.team.map(m => m.role))
      expect(r1.team.map(m => m.personality)).toEqual(r2.team.map(m => m.personality))
    })

    it('returns different projects for different student IDs', () => {
      const projects = Array.from({ length: 30 }, (_, i) =>
        generateTeamAssignment(`student-${i}`).project.name
      )
      const unique = new Set(projects)
      // With 15 projects and 30 students, expect decent spread
      expect(unique.size).toBeGreaterThan(5)
    })
  })

  describe('team structure', () => {
    it('always returns exactly 4 team members', () => {
      const { team } = generateTeamAssignment('any-id')
      expect(team).toHaveLength(4)
    })

    it('always returns the same four pet names', () => {
      const { team } = generateTeamAssignment('any-id')
      const firstNames = team.map(m => m.firstName)
      expect(firstNames).toContain('Isla')
      expect(firstNames).toContain('Pippin')
      expect(firstNames).toContain('Mia')
      expect(firstNames).toContain('Hoftin')
    })

    it('team members have unique roles', () => {
      const { team } = generateTeamAssignment('unique-roles-test')
      const roles = team.map(m => m.role)
      expect(new Set(roles).size).toBe(4)
    })

    it('every team member has all required fields', () => {
      const { team } = generateTeamAssignment('fields-test')
      const requiredFields = [
        'name', 'firstName', 'lastName', 'role', 'seniority',
        'personality', 'personalityLabel', 'moodTendency',
        'avatarInitials', 'avatarBg', 'avatarText',
      ]
      team.forEach(member => {
        requiredFields.forEach(field => {
          expect(member).toHaveProperty(field)
          expect((member as unknown as Record<string, unknown>)[field]).toBeTruthy()
        })
      })
    })

    it('avatarInitials are two uppercase characters', () => {
      const { team } = generateTeamAssignment('initials-test')
      team.forEach(member => {
        expect(member.avatarInitials).toMatch(/^[A-Z]{2}$/)
      })
    })

    it('seniority maps correctly from role', () => {
      // Run enough IDs to likely hit all roles
      for (let i = 0; i < 20; i++) {
        const { team } = generateTeamAssignment(`seniority-test-${i}`)
        team.forEach(member => {
          if (member.role === 'senior_dev') expect(member.seniority).toBe('senior')
          else if (member.role === 'junior_dev') expect(member.seniority).toBe('junior')
          else expect(member.seniority).toBe('mid')
        })
      }
    })
  })

  describe('project', () => {
    it('returns a project from PROJECT_POOL', () => {
      const { project } = generateTeamAssignment('project-test')
      const names = PROJECT_POOL.map(p => p.name)
      expect(names).toContain(project.name)
    })

    it('returned project has name and description', () => {
      const { project } = generateTeamAssignment('project-fields-test')
      expect(project.name).toBeTruthy()
      expect(project.description).toBeTruthy()
    })

    it('PROJECT_POOL has at least 10 projects', () => {
      expect(PROJECT_POOL.length).toBeGreaterThanOrEqual(10)
    })

    it('all projects in pool have unique names', () => {
      const names = PROJECT_POOL.map(p => p.name)
      expect(new Set(names).size).toBe(names.length)
    
    })
  })
})
