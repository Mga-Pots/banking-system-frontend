import { useLocation, useMatch } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { firstNameOf } from '../utils/names'

const greetingFor = (hour) =>
  hour < 12 ? 'Magandang umaga' : hour < 18 ? 'Magandang hapon' : 'Magandang gabi'

// The big line at the top of a page, the same for every role: the greeting on the
// overview and the page title everywhere else. It's part of the page, so it scrolls
// with it; the pinned bar above holds the account buttons (see Header). Render it first
// inside <main>.
//
// `home` is the role's overview path (`/staff`), where the greeting shows. `titleFor` maps
// a path to its title (none: nothing is drawn). The greeting uses the first name when
// `firstNameOnly` is set.
export default function PageTitle({ home, titleFor, firstNameOnly = false }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const onOverview = Boolean(useMatch(home))
  const title = titleFor(pathname)
  const name = firstNameOnly ? firstNameOf(user?.name) : user?.name

  if (onOverview) {
    return (
      <p className="mb-6 min-w-0">
        <span lang="fil" className="block text-[15px] text-label">
          {greetingFor(new Date().getHours())},
        </span>
        <span className="block truncate text-[28px] leading-tight font-bold text-ink">{name}</span>
      </p>
    )
  }
  if (!title) return null
  return <h1 className="mb-6 min-w-0 truncate text-[28px] leading-tight font-bold text-ink">{title}</h1>
}
