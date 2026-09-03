import { useEffect, useState } from 'react'
import {
  ChevronsLeft,
  ChevronsRight,
  Clapperboard,
  FolderKanban,
  Palette,
  PlusCircle,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../lib/utils'

export type NavId = 'create' | 'projects' | 'assets' | 'settings'

interface NavItem {
  id: NavId
  label: string
  hint: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'create',
    label: 'Studio',
    hint: 'Loại → bố cục → màu → chạy',
    icon: PlusCircle,
  },
  {
    id: 'projects',
    label: 'Dự án',
    hint: 'Lịch sử render & bản nháp',
    icon: FolderKanban,
  },
  {
    id: 'assets',
    label: 'Mẫu',
    hint: 'Màu, chữ, logo — diện mạo file',
    icon: Palette,
  },
  {
    id: 'settings',
    label: 'Cài đặt',
    hint: 'Nhà cung cấp AI, Drive, giọng',
    icon: Settings,
  },
]

const RAIL_W = 72
const PANEL_W = 240

interface SidebarProps {
  active: NavId
  onNavigate: (id: NavId) => void
}

/**
 * Rail icon luôn giữ chỗ (72px). Khi hover/ghim: panel mở rộng overlay để
 * không đẩy layout nội dung.
 */
export function Sidebar({ active, onNavigate }: SidebarProps) {
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const expanded = pinned || hovered

  useEffect(() => {
    try {
      if (localStorage.getItem('omnistudio.sidebarPinned') === '1') {
        setPinned(true)
      }
    } catch {
      /* ignore */
    }
  }, [])

  function togglePin() {
    setPinned((p) => {
      const next = !p
      try {
        localStorage.setItem('omnistudio.sidebarPinned', next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <div
      className="relative z-40 h-dvh shrink-0"
      style={{ width: pinned ? PANEL_W : RAIL_W }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <aside
        style={{ width: expanded ? PANEL_W : RAIL_W }}
        className={cn(
          'absolute inset-y-0 left-0 flex flex-col overflow-hidden border-r border-slate-800/90 bg-slate-950 shadow-xl shadow-black/40 transition-[width] duration-200 ease-out'
        )}
        aria-label="Điều hướng chính"
      >
        <div
          className={cn(
            'flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-800/90 px-3',
            !expanded && 'justify-center px-2'
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
            <Clapperboard className="size-4" aria-hidden />
          </span>
          <div
            className={cn(
              'min-w-0 overflow-hidden whitespace-nowrap transition-opacity duration-150',
              expanded ? 'opacity-100' : 'w-0 opacity-0'
            )}
          >
            <p className="truncate text-sm font-semibold tracking-tight text-slate-50">
              LYON Studio
            </p>
            <p className="truncate text-[10px] uppercase tracking-[0.14em] text-slate-500">
              Studio nội dung
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Studio">
          {NAV_ITEMS.map(({ id, label, hint, icon: Icon }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                type="button"
                title={label}
                onClick={() => onNavigate(id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors',
                  !expanded && 'justify-center px-0',
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-500/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span
                  className={cn(
                    'min-w-0 overflow-hidden whitespace-nowrap transition-opacity duration-150',
                    expanded ? 'opacity-100' : 'w-0 opacity-0'
                  )}
                >
                  <span className="block truncate">{label}</span>
                  <span className="mt-0.5 block truncate text-[11px] font-normal text-slate-500">
                    {hint}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-slate-800/90 p-2">
          <button
            type="button"
            onClick={togglePin}
            title={
              pinned
                ? 'Bỏ ghim — thu gọn khi rời chuột'
                : 'Ghim menu mở rộng'
            }
            className={cn(
              'flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-xl px-3 text-xs text-slate-500 transition-colors hover:bg-slate-900 hover:text-slate-200',
              !expanded && 'justify-center px-0'
            )}
          >
            {pinned ? (
              <ChevronsLeft className="size-4 shrink-0" aria-hidden />
            ) : (
              <ChevronsRight className="size-4 shrink-0" aria-hidden />
            )}
            <span
              className={cn(
                'truncate whitespace-nowrap transition-opacity',
                expanded ? 'opacity-100' : 'w-0 opacity-0'
              )}
            >
              {pinned ? 'Bỏ ghim menu' : 'Ghim mở rộng'}
            </span>
          </button>
          <p
            className={cn(
              'mt-1 px-3 font-mono text-[10px] uppercase tracking-wider text-slate-600 transition-opacity',
              expanded ? 'opacity-100' : 'h-0 overflow-hidden opacity-0'
            )}
          >
            Engine · :3001
          </p>
        </div>
      </aside>
    </div>
  )
}

export default Sidebar
