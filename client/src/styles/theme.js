export const TEAM_COLORS = [
  '#7c3aed', // violet
  '#06b6d4', // cyan
  '#10b981', // vert
  '#f59e0b', // amber
  '#ef4444', // rouge
  '#ec4899', // rose
]

export function getTeamColor(index) {
  return TEAM_COLORS[index % TEAM_COLORS.length]
}
