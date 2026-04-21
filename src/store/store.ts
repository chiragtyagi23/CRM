import { configureStore } from '@reduxjs/toolkit'

import { campaignBuilderReducer } from './campaignBuilderSlice'
import { captureLeadsReducer } from './captureLeadsSlice'
import { siteVisitReducer } from './siteVisit.slice'
import { authReducer } from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    campaignBuilder: campaignBuilderReducer,
    captureLeads: captureLeadsReducer,
    siteVisits: siteVisitReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

