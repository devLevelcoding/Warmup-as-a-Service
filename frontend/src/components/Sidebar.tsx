export interface NavItem {
  key: string
  label: string
}

interface Props {
  items: NavItem[]
  selected: string
  onSelect: (key: string) => void
}

export default function Sidebar({ items, selected, onSelect }: Props) {
  return (
    <nav className="w-[190px] flex-shrink-0 border-r border-border bg-surface overflow-y-auto flex flex-col scrollbar-thin">
      <div className="px-4 pt-4 pb-2 text-[10px] font-bold tracking-[.1em] uppercase text-txt2">
        Warmup Service
      </div>
      {items.map(item => {
        const active = item.key === selected
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={`w-full text-left px-4 py-[9px] border-l-2 transition-colors text-[13px] ${
              active
                ? 'border-accent bg-accent-dim text-txt font-medium'
                : 'border-transparent text-txt2 hover:bg-surface2 hover:text-txt'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
