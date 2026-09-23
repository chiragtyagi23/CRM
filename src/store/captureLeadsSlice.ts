import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import {
  createCaptureLead,
  fetchCaptureLeads,
  patchCaptureLead,
  type CaptureLeadCreatePayload,
  type CaptureLeadDTO,
  type CaptureLeadPatchPayload,
  type CaptureLeadsListResponse,
  type FetchCaptureLeadsParams,
} from '../lib/captureLeadsApi'

export type CaptureLeadsState = {
  items: CaptureLeadDTO[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  creating: boolean
  error: string | null
  lastCreatedId: string | null
}

const initialState: CaptureLeadsState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  creating: false,
  error: null,
  lastCreatedId: null,
}

export type LoadCaptureLeadsArg = FetchCaptureLeadsParams & { force?: boolean }

export const loadCaptureLeads = createAsyncThunk<CaptureLeadsListResponse, LoadCaptureLeadsArg | undefined>(
  'captureLeads/load',
  async (arg) => {
    const { force: _force, ...params } = arg ?? {}
    return await fetchCaptureLeads(params)
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true
      const cl = (getState() as { captureLeads: CaptureLeadsState }).captureLeads
      return !cl.loading
    },
  },
)

export const submitCaptureLead = createAsyncThunk('captureLeads/create', async (payload: CaptureLeadCreatePayload) => {
  return await createCaptureLead(payload)
})

export const updateCaptureLead = createAsyncThunk(
  'captureLeads/update',
  async (args: { id: string; patch: CaptureLeadPatchPayload }) => {
    return await patchCaptureLead(args.id, args.patch)
  },
)

const slice = createSlice({
  name: 'captureLeads',
  initialState,
  reducers: {
    clearLastCreated(state) {
      state.lastCreatedId = null
    },
  },
  extraReducers: (b) => {
    b.addCase(loadCaptureLeads.pending, (state) => {
      state.loading = true
      state.error = null
    })
    b.addCase(loadCaptureLeads.fulfilled, (state, action) => {
      state.loading = false
      state.items = action.payload.items
      state.total = action.payload.total
      state.page = action.payload.page
      state.pageSize = action.payload.pageSize
    })
    b.addCase(loadCaptureLeads.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message ?? 'Failed to load leads'
    })

    b.addCase(submitCaptureLead.pending, (state) => {
      state.creating = true
      state.error = null
      state.lastCreatedId = null
    })
    b.addCase(submitCaptureLead.fulfilled, (state, action) => {
      state.creating = false
      state.items = [action.payload, ...state.items]
      state.total += 1
      state.lastCreatedId = action.payload.id
    })
    b.addCase(submitCaptureLead.rejected, (state, action) => {
      state.creating = false
      state.error = action.error.message ?? 'Failed to create lead'
    })

    b.addCase(updateCaptureLead.pending, (state) => {
      state.error = null
    })
    b.addCase(updateCaptureLead.fulfilled, (state, action) => {
      const idx = state.items.findIndex((x) => x.id === action.payload.id)
      if (idx >= 0) state.items[idx] = action.payload
    })
    b.addCase(updateCaptureLead.rejected, (state, action) => {
      state.error = action.error.message ?? 'Failed to update lead'
    })
  },
})

export const captureLeadsActions = slice.actions
export const captureLeadsReducer = slice.reducer
