// Map route prefixes → image paths in /public/bg/
// Drop your images in public/bg/ with the filenames listed below.
// Exact route match wins; longest prefix wins for nested routes.
export const PAGE_BACKGROUNDS: Record<string, string> = {
  '/dashboard':    '/bg/dashboard.jpg',
  '/logistique':   '/bg/logistique.jpg',
  '/flotte':       '/bg/flotte.jpg',
  '/operations':   '/bg/operations.jpg',
  '/evenements':   '/bg/evenements.jpg',
  '/membres':      '/bg/membres.jpg',
  '/carte':        '/bg/carte.jpg',
  '/ressources':   '/bg/ressources.jpg',
  '/messages':     '/bg/messages.jpg',
  '/partenariats': '/bg/partenariats.jpg',
  '/profil':       '/bg/profil.jpg',
  '/admin':        '/bg/admin.jpg',
}
