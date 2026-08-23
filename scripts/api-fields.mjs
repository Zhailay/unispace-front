/**
 * Показывает РЕАЛЬНЫЕ имена полей в ответах API.
 *
 * Зачем: типы в `features/*Api.ts` — это наши утверждения, а не контракт.
 * `tsc` проверит, что поле есть в интерфейсе, но не то, что оно есть в ответе
 * сервера. Выдуманное поле проходит сборку и молча рендерится как undefined.
 * Уже поймано так: `out_spec_name` не существует — процедура отдаёт
 * `out_spec_kz` / `out_spec_ru` / `out_spec_en` отдельными колонками.
 *
 * Запуск (бэк должен быть поднят на 4005, БД — локальная копия):
 *   node scripts/api-fields.mjs
 *   node scripts/api-fields.mjs /gruppa_op/tb
 *
 * Код возврата: 0 — API отвечает и логин прошёл, 1 — иначе.
 */

const BASE = process.env.API_BASE || 'http://localhost:4005/api'
const LOGIN = process.env.API_LOGIN || '111'
const PASSWORD = process.env.API_PASSWORD || 'password123'

/** Эндпоинты по умолчанию: страница + выборка справочника. */
const DEFAULT_TARGETS = [
  { path: '/specialties', method: 'GET' },
  { path: '/specialties/tb', method: 'POST', body: { search: '', limit: 1, offset: 0 } },
]

let cookie = ''

async function call(path, method = 'GET', body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Lang': 'ru',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const setCookie = res.headers.getSetCookie?.() ?? []
  if (setCookie.length) cookie = setCookie.map((c) => c.split(';')[0]).join('; ')

  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = text.slice(0, 200)
  }
  return { status: res.status, json }
}

/** Достаёт первую строку данных из любого из трёх форматов ответа. */
function firstRow(payload) {
  if (Array.isArray(payload)) return payload[0]
  if (!payload || typeof payload !== 'object') return undefined
  if (Array.isArray(payload.data)) return payload.data[0]
  if (payload.data && typeof payload.data === 'object') return payload.data
  return payload
}

function describe(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return `array[${value.length}]`
  return typeof value
}

async function main() {
  const login = await call('/auth/login', 'POST', {
    login: LOGIN,
    password: PASSWORD,
    userType: 'sotrudnik',
  })

  if (login.status !== 200) {
    console.error(`Логин не прошёл: HTTP ${login.status}`, login.json)
    console.error('Проверьте, что бэк поднят и .env смотрит на локальную БД.')
    process.exit(1)
  }

  console.log('user:')
  for (const [k, v] of Object.entries(login.json.user)) {
    console.log(`  ${k.padEnd(24)} ${describe(v).padEnd(10)} ${JSON.stringify(v)}`)
  }

  const args = process.argv.slice(2)
  const targets = args.length
    ? args.map((path) => ({ path, method: 'POST', body: { search: '', limit: 1, offset: 0 } }))
    : DEFAULT_TARGETS

  for (const target of targets) {
    const res = await call(target.path, target.method, target.body)
    console.log(`\n${target.method} ${target.path}  →  HTTP ${res.status}`)

    if (res.status >= 400) {
      console.log('  ', JSON.stringify(res.json).slice(0, 200))
      continue
    }

    const row = firstRow(res.json)
    if (!row || typeof row !== 'object') {
      console.log('   (нет строк для разбора)')
      continue
    }

    for (const [k, v] of Object.entries(row)) {
      console.log(`  ${k.padEnd(24)} ${describe(v).padEnd(10)} ${JSON.stringify(v)?.slice(0, 60)}`)
    }
  }

  console.log('\nНапоминание: bigint приходит строкой — все *_id это string, не number.')
}

main().catch((err) => {
  console.error('Не удалось достучаться до API:', err.message)
  process.exit(1)
})
