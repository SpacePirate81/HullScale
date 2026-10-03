import type { Tool } from './types'

const TOOLS: { id: Tool; label: string; hint: string; key: string }[] = [
  { id: 'pan', label: 'Pan', hint: 'Move the plate', key: 'V' },
  { id: 'reference', label: 'Reference', hint: 'Lock a known length', key: 'R' },
  { id: 'measure', label: 'Measure', hint: 'Read a length', key: 'M' },
  { id: 'cylinder', label: 'Cylinder', hint: 'Two rails', key: 'C' },
  { id: 'area', label: 'Area', hint: 'Face of a structure', key: 'A' },
  { id: 'horizon', label: 'Horizon', hint: 'Changes the scale', key: 'O' },
  { id: 'waterline', label: 'Waterline', hint: 'Mark only', key: 'W' },
]

export function Toolbar({ tool, onTool }: { tool: Tool; onTool: (tool: Tool) => void }) {
  return (
    <nav className="toolbar" aria-label="Tools">
      {TOOLS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="tool"
          aria-pressed={tool === item.id}
          title={item.hint}
          onClick={() => onTool(item.id)}
        >
          <kbd>{item.key}</kbd>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  )
}

export const TOOL_KEYS: Record<string, Tool> = Object.fromEntries(TOOLS.map((item) => [item.key, item.id]))
