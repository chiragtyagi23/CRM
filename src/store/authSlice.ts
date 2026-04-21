import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { login as apiLogin, signup as apiSignup, type AuthResponseDTO, type AuthUserDTO } from '../lib/authApi'

const LS_TOKEN = 'crm_token'
const LS_USER = 'crm_user'
const NO_ROLE: AuthUserDTO['role'] = 'no-role'

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

function withRole(user: AuthUserDTO): AuthUserDTO {
  return { ...user, role: user.role ?? NO_ROLE }
}

export type AuthState = {
  token: string | null
  user: AuthUserDTO | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  token: null,
  user: null,
  loading: false,
  error: null,
}

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const token = window.localStorage.getItem(LS_TOKEN)
  const user = readJson<AuthUserDTO>(LS_USER)
  return { token: token ?? null, user: user ? withRole(user) : null }
})

export const signup = createAsyncThunk('auth/signup', async (payload: { name: string; email: string; password: string }) => {
  // Do not set role on signup. Role should be assigned by an admin in the database.
  const res = await apiSignup(payload)
  return res
})

export const login = createAsyncThunk('auth/login', async (payload: { email: string; password: string }) => {
  const res = await apiLogin(payload)
  return res
})

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null
      state.user = null
      state.error = null
      try {
        window.localStorage.removeItem(LS_TOKEN)
        window.localStorage.removeItem(LS_USER)
      } catch {
        // ignore
      }
    },
    // Admins can create other users later (optional)
    setAuth(state, action: { payload: AuthResponseDTO }) {
      state.token = action.payload.token
      state.user = withRole(action.payload.user)
      state.error = null
      writeJson(LS_USER, state.user)
      window.localStorage.setItem(LS_TOKEN, action.payload.token)
    },
  },
  extraReducers: (b) => {
    b.addCase(hydrateAuth.fulfilled, (state, action) => {
      state.token = action.payload.token
      state.user = action.payload.user
    })

    const pending = (state: AuthState) => {
      state.loading = true
      state.error = null
    }
    const rejected = (state: AuthState, action: { error: { message?: string } }) => {
      state.loading = false
      state.error = action.error.message ?? 'Auth failed'
    }

    b.addCase(signup.pending, pending)
    b.addCase(signup.fulfilled, (state, action) => {
      state.loading = false
      state.token = action.payload.token
      state.user = withRole(action.payload.user)
      state.error = null
      writeJson(LS_USER, state.user)
      window.localStorage.setItem(LS_TOKEN, action.payload.token)
    })
    b.addCase(signup.rejected, rejected)

    b.addCase(login.pending, pending)
    b.addCase(login.fulfilled, (state, action) => {
      state.loading = false
      state.token = action.payload.token
      state.user = withRole(action.payload.user)
      state.error = null
      writeJson(LS_USER, state.user)
      window.localStorage.setItem(LS_TOKEN, action.payload.token)
    })
    b.addCase(login.rejected, rejected)
  },
})

export const authActions = slice.actions
export const authReducer = slice.reducer

