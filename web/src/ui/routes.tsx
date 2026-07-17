import { Link, Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { z } from 'zod'
import { GalleryPage } from './gallery/GalleryPage'
import { PlaygroundPage } from './playground/PlaygroundPage'

function RootLayout() {
  return (
    <div className="app-shell">
      <header className="top-nav">
        <span className="brand">ChemWorks Playground</span>
        <nav>
          <Link to="/" activeOptions={{ exact: true }}>
            Playground
          </Link>
          <Link to="/gallery">Gallery</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}

export const rootRoute = createRootRoute({ component: RootLayout })

export const PlaygroundSearchSchema = z.object({ share: z.string().optional() })

export const playgroundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search) => PlaygroundSearchSchema.parse(search),
  component: PlaygroundPage,
})

export const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/gallery',
  component: GalleryPage,
})

const routeTree = rootRoute.addChildren([playgroundRoute, galleryRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
