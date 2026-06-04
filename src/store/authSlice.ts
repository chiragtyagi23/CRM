import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { login as apiLogin, fetchMe } from '../lib/authApi'
import type { ApiError } from '../lib/crmApi'
import { clearStoredAccess, writeStoredAccess } from '../acl/hasAccess'
import type { AuthAccessDTO, AuthResponseDTO, AuthUserDTO } from '../types/dtos'

const LS_TOKEN = 'crm_token'
const LS_USER = 'crm_user'
const LS_ACCESS = 'crm_access'

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export type AuthState = {
  token: string | null
  user: AuthUserDTO | null
  access: AuthAccessDTO | null
  /** True after first hydrateAuth finishes (avoids login redirect flash on refresh). */
  bootstrapped: boolean
  bootstrapping: boolean
  loading: boolean
  error: string | null
}

/** React StrictMode mounts twice in dev — avoid parallel /me calls that race logout. */
let hydrateStarted = false

function isAuthFailure(err: unknown): boolean {
  const status = (err as ApiError | undefined)?.status
  return status === 401 || status === 403
}

function extractAuthErrorMessage(err: unknown): string {
  const apiErr = err as ApiError | undefined
  const body = apiErr?.body as { error?: unknown } | undefined
  if (body && typeof body.error === 'string' && body.error.trim().length > 0) {
    return body.error
  }
  if (apiErr?.status === 404) return 'User does not exist'
  if (apiErr?.status === 401) return 'Wrong email or password'
  if (apiErr?.status === 409) return 'Email already exists'
  return apiErr?.message || 'Auth failed'
}

function readStoredAuth(): Pick<AuthState, 'token' | 'user' | 'access'> {
  if (typeof window === 'undefined') return { token: null, user: null, access: null }
  try {
    const raw = window.localStorage.getItem(LS_TOKEN)
    const token = raw && raw.trim().length > 0 ? raw : null
    const user = readJson<AuthUserDTO>(LS_USER)
    const access = readJson<AuthAccessDTO>(LS_ACCESS)
    return { token, user: user ?? null, access: access ?? null }
  } catch {
    return { token: null, user: null, access: null }
  }
}

const initialState: AuthState = {
  ...readStoredAuth(),
  bootstrapped: false,
  bootstrapping: false,
  loading: false,
  error: null,
}

function persistSession(payload: AuthResponseDTO) {
  writeJson(LS_USER, payload.user)
  window.localStorage.setItem(LS_TOKEN, payload.token)
  if (payload.access) {
    writeStoredAccess(payload.access)
    writeJson(LS_ACCESS, payload.access)
  }
}

export const hydrateAuth = createAsyncThunk(
  'auth/hydrate',
  async (_, { dispatch }) => {
    const stored = readStoredAuth()
    if (!stored.token) {
      return { token: null, user: null, access: null }
    }

    if (stored.user && stored.access) {
      return { token: stored.token, user: stored.user, access: stored.access }
    }

    try {
      const me = await fetchMe()
      return { token: stored.token, user: me.user, access: me.access }
    } catch (err) {
      // Only clear session on real auth rejection — not when backend is down / network blip.
      if (isAuthFailure(err)) {
        dispatch(authActions.logout())
        return { token: null, user: null, access: null }
      }
      return stored
    }
  },
  {
    condition: (_, { getState }) => {
      const auth = (getState() as { auth: AuthState }).auth
      if (auth.bootstrapped || auth.bootstrapping || hydrateStarted) return false
      hydrateStarted = true
      return true
    },
  },
)

export const login = createAsyncThunk<AuthResponseDTO, { email: string; password: string }, { rejectValue: string }>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiLogin(payload)
      return res
    } catch (err) {
      return rejectWithValue(extractAuthErrorMessage(err))
    }
  },
)

/** Reload user + access from API (e.g. after ACL admin changes your role modules). */
export const refreshAccess = createAsyncThunk('auth/refreshAccess', async () => {
  return await fetchMe()
})

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null
      state.user = null
      state.access = null
      state.error = null
      try {
        window.localStorage.removeItem(LS_TOKEN)
        window.localStorage.removeItem(LS_USER)
        window.localStorage.removeItem(LS_ACCESS)
        clearStoredAccess()
      } catch {
        // ignore
      }
    },
    setAuth(state, action: { payload: AuthResponseDTO }) {
      state.token = action.payload.token
      state.user = action.payload.user
      state.access = action.payload.access ?? null
      state.error = null
      persistSession(action.payload)
    },
    setAccess(state, action: { payload: AuthAccessDTO }) {
      state.access = action.payload
      writeStoredAccess(action.payload)
      writeJson(LS_ACCESS, action.payload)
    },
  },
  extraReducers: (b) => {
    b.addCase(hydrateAuth.pending, (state) => {
      state.bootstrapping = true
    })
    b.addCase(hydrateAuth.fulfilled, (state, action) => {
      state.bootstrapping = false
      state.bootstrapped = true
      state.token = action.payload.token
      state.user = action.payload.user
      state.access = action.payload.access ?? state.access
    })
    b.addCase(hydrateAuth.rejected, (state) => {
      state.bootstrapping = false
      state.bootstrapped = true
    })

    const pending = (state: AuthState) => {
      state.loading = true
      state.error = null
    }
    const rejected = (state: AuthState, action: { payload?: string; error: { message?: string } }) => {
      state.loading = false
      state.error = action.payload ?? action.error.message ?? 'Auth failed'
    }

    b.addCase(login.pending, pending)
    b.addCase(login.fulfilled, (state, action) => {
      state.loading = false
      state.token = action.payload.token
      state.user = action.payload.user
      state.access = action.payload.access ?? null
      state.error = null
      persistSession(action.payload)
    })
    b.addCase(login.rejected, rejected)

    b.addCase(refreshAccess.fulfilled, (state, action) => {
      state.user = action.payload.user
      state.access = action.payload.access ?? null
      if (action.payload.access) {
        writeStoredAccess(action.payload.access)
        writeJson(LS_ACCESS, action.payload.access)
      }
    })
  },
})

export const authActions = slice.actions
export const authReducer = slice.reducer
