import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises.')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = 'TestINQFR2024!'

const USERS = [
  { email: 'test.visiteur@inqfr.test',         username: 'test_visiteur',          role: 'visiteur'           },
  { email: 'test.aspirant@inqfr.test',          username: 'test_aspirant',           role: 'aspirant'           },
  { email: 'test.consacre@inqfr.test',          username: 'test_consacre',           role: 'consacre'           },
  { email: 'test.gardien@inqfr.test',           username: 'test_gardien',            role: 'gardien'            },
  { email: 'test.inquisiteur@inqfr.test',       username: 'test_inquisiteur',        role: 'inquisiteur'        },
  { email: 'test.maitre@inqfr.test',            username: 'test_maitre_inquisiteur', role: 'maitre_inquisiteur' },
  { email: 'test.sage@inqfr.test',              username: 'test_sage',               role: 'sage'               },
] as const

async function findUserId(email: string): Promise<string | null> {
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    if (error || !data) break
    const found = data.users.find(u => u.email === email)
    if (found) return found.id
    if (data.users.length < 100) break
    page++
  }
  return null
}

async function main() {
  console.log('🚀  Création des comptes de test INQFR\n')

  for (const u of USERS) {
    const label = u.role.padEnd(22)
    process.stdout.write(`  ${label} `)

    // Vérifier si l'utilisateur existe déjà
    const existingId = await findUserId(u.email)

    let userId: string

    if (existingId) {
      userId = existingId
      process.stdout.write('[existe] ')
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { username: u.username, full_name: u.username },
      })

      if (error || !data.user) {
        console.log(`❌  ${error?.message ?? 'Erreur inconnue'}`)
        continue
      }

      userId = data.user.id
      // Laisser le trigger créer le profil
      await new Promise(r => setTimeout(r, 600))
    }

    // Forcer le rôle et le username sur le profil
    const { error: profileErr } = await admin
      .from('profiles')
      .update({ role: u.role, username: u.username })
      .eq('id', userId)

    if (profileErr) {
      console.log(`⚠   profil non mis à jour : ${profileErr.message}`)
    } else {
      console.log(`✓   ${u.email}`)
    }
  }

  console.log(`
✅  Terminé !

Mot de passe commun : ${PASSWORD}

┌─────────────────────────┬─────────────────────────────────────┐
│ Rang                    │ Email                               │
├─────────────────────────┼─────────────────────────────────────┤
│ Visiteur                │ test.visiteur@inqfr.test            │
│ Aspirant                │ test.aspirant@inqfr.test            │
│ Consacré                │ test.consacre@inqfr.test            │
│ Gardien                 │ test.gardien@inqfr.test             │
│ Inquisiteur             │ test.inquisiteur@inqfr.test         │
│ Maître Inquisiteur      │ test.maitre@inqfr.test              │
│ Sage                    │ test.sage@inqfr.test                │
└─────────────────────────┴─────────────────────────────────────┘
`)
}

main().catch(err => { console.error(err); process.exit(1) })
