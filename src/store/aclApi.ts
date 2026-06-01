import { createApi } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import { aclHttp } from '../services/aclHttp'
import type { AclModuleDTO, AclOverrideDTO, AclRoleDTO, AclUserDTO } from '../acl/types'

type AxiosBaseQueryArgs = {
  url: string
  method?: AxiosRequestConfig['method']
  data?: unknown
  params?: Record<string, string>
}

const axiosBaseQuery: BaseQueryFn<AxiosBaseQueryArgs, unknown, { status?: number; message: string }> = async ({
  url,
  method = 'GET',
  data,
  params,
}) => {
  try {
    const result = await aclHttp({ url, method, data, params })
    return { data: result.data }
  } catch (err) {
    const e = err as AxiosError<{ error?: string }>
    return {
      error: {
        status: e.response?.status,
        message: e.response?.data?.error || e.message,
      },
    }
  }
}

export const aclApi = createApi({
  reducerPath: 'aclApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Roles', 'Modules', 'Users', 'RoleModules', 'Overrides'],
  endpoints: (build) => ({
    getRoles: build.query<{ items: AclRoleDTO[] }, void>({
      query: () => ({ url: '/api/roles' }),
      providesTags: ['Roles'],
    }),
    createRole: build.mutation<{ item: AclRoleDTO }, { name: string; description?: string }>({
      query: (body) => ({ url: '/api/roles', method: 'POST', data: body }),
      invalidatesTags: ['Roles'],
    }),
    updateRole: build.mutation<{ item: AclRoleDTO }, { id: string; name: string; description?: string }>({
      query: ({ id, ...body }) => ({ url: `/api/roles/${id}`, method: 'PUT', data: body }),
      invalidatesTags: ['Roles'],
    }),
    deleteRole: build.mutation<void, string>({
      query: (id) => ({ url: `/api/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Roles', 'Users'],
    }),
    getModules: build.query<{ items: AclModuleDTO[] }, void>({
      query: () => ({ url: '/api/modules' }),
      providesTags: ['Modules'],
    }),
    createModule: build.mutation<{ item: AclModuleDTO }, Partial<AclModuleDTO> & { module_key: string; name: string; route: string }>({
      query: (body) => ({ url: '/api/modules', method: 'POST', data: body }),
      invalidatesTags: ['Modules'],
    }),
    updateModule: build.mutation<{ item: AclModuleDTO }, { id: string } & Partial<AclModuleDTO>>({
      query: ({ id, ...body }) => ({ url: `/api/modules/${id}`, method: 'PUT', data: body }),
      invalidatesTags: ['Modules'],
    }),
    deleteModule: build.mutation<void, string>({
      query: (id) => ({ url: `/api/modules/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Modules', 'RoleModules'],
    }),
    getRoleModules: build.query<{ moduleIds: string[] }, string>({
      query: (roleId) => ({ url: `/api/roles/${roleId}/modules` }),
      providesTags: (_r, _e, id) => [{ type: 'RoleModules', id }],
    }),
    setRoleModules: build.mutation<{ moduleIds: string[] }, { roleId: string; moduleIds: string[] }>({
      query: ({ roleId, moduleIds }) => ({
        url: `/api/roles/${roleId}/modules`,
        method: 'PUT',
        data: { moduleIds },
      }),
      invalidatesTags: (_r, _e, { roleId }) => [{ type: 'RoleModules', id: roleId }],
    }),
    getUsers: build.query<{ items: AclUserDTO[] }, void>({
      query: () => ({ url: '/api/users' }),
      providesTags: ['Users'],
    }),
    updateUserRole: build.mutation<{ item: AclUserDTO }, { userId: string; roleId: string | null }>({
      query: ({ userId, roleId }) => ({
        url: `/api/users/${userId}/role`,
        method: 'PUT',
        data: { roleId },
      }),
      invalidatesTags: ['Users'],
    }),
    getUserOverrides: build.query<{ items: AclOverrideDTO[] }, string>({
      query: (userId) => ({ url: `/api/users/${userId}/overrides` }),
      providesTags: (_r, _e, id) => [{ type: 'Overrides', id }],
    }),
    createOverride: build.mutation<
      { item: AclOverrideDTO },
      { userId: string; moduleId: string; effect: 'ALLOW' | 'DENY'; reason?: string }
    >({
      query: ({ userId, ...body }) => ({
        url: `/api/users/${userId}/overrides`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_r, _e, { userId }) => [{ type: 'Overrides', id: userId }],
    }),
    deleteOverride: build.mutation<void, string>({
      query: (id) => ({ url: `/api/overrides/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Overrides'],
    }),
  }),
})

export const {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetModulesQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useDeleteModuleMutation,
  useGetRoleModulesQuery,
  useSetRoleModulesMutation,
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useGetUserOverridesQuery,
  useCreateOverrideMutation,
  useDeleteOverrideMutation,
} = aclApi
