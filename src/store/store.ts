import { configureStore } from '@reduxjs/toolkit'

import { campaignBuilderReducer } from './campaignBuilderSlice'
import { captureLeadsReducer } from './captureLeadsSlice'
import { siteVisitReducer } from './siteVisit.slice'
import { authReducer } from './authSlice'
import { aclApi } from './aclApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    campaignBuilder: campaignBuilderReducer,
    captureLeads: captureLeadsReducer,
    siteVisits: siteVisitReducer,
    [aclApi.reducerPath]: aclApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(aclApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

