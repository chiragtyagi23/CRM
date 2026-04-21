import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import {
  createSiteVisit,
  fetchSiteVisits,
  type SiteVisitCreatePayload,
  type SiteVisitDTO,
} from '../lib/captureSiteVisitApi'

export type SiteVisitsState = {
  items: SiteVisitDTO[]
  loading: boolean
  creating: boolean
  error: string | null
  lastCreatedId: string | null
}

const initialState: SiteVisitsState = {
  items: [],
  loading: false,
  creating: false,
  error: null,
  lastCreatedId: null,
}

export const loadSiteVisits = createAsyncThunk('siteVisits/load', async () => {
  return await fetchSiteVisits()
})

export const submitSiteVisit = createAsyncThunk('siteVisits/create', async (payload: SiteVisitCreatePayload) => {
  return await createSiteVisit(payload)
})

const slice = createSlice({
  name: 'siteVisits',
  initialState,
  reducers: {
    clearLastCreated(state) {
      state.lastCreatedId = null
    },
  },
  extraReducers: (b) => {
    b.addCase(loadSiteVisits.pending, (state) => {
      state.loading = true
      state.error = null
    })
    b.addCase(loadSiteVisits.fulfilled, (state, action) => {
      state.loading = false
      state.items = action.payload.items
    })
    b.addCase(loadSiteVisits.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message ?? 'Failed to load site visits'
    })

    b.addCase(submitSiteVisit.pending, (state) => {
      state.creating = true
      state.error = null
      state.lastCreatedId = null
    })
    b.addCase(submitSiteVisit.fulfilled, (state, action) => {
      state.creating = false
      state.items = [action.payload, ...state.items]
      state.lastCreatedId = action.payload.id
    })
    b.addCase(submitSiteVisit.rejected, (state, action) => {
      state.creating = false
      state.error = action.error.message ?? 'Failed to create site visit'
    })
  },
})

export const siteVisitActions = slice.actions
export const siteVisitReducer = slice.reducer

