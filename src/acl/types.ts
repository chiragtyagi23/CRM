export type AclModuleDTO = {
  id: string
  module_key: string
  name: string
  route: string
  icon?: string | null
  parent_id?: string | null
  sort_order?: number
}

export type AclOverrideDTO = {
  id: string
  module_id: string
  module_key: string
  effect: 'ALLOW' | 'DENY'
  reason?: string | null
}

export type AclRoleDTO = {
  id: string
  name: string
  description?: string | null
}

export type AclUserDTO = {
  id: string
  name: string
  email: string
  role_id?: string | null
  role_name?: string | null
  is_active: boolean
}

export type AuthAccessDTO = {
  modules: AclModuleDTO[]
  overrides?: AclOverrideDTO[]
  permissions?: {
    leads?: {
      view: boolean
      assignTo: boolean
      delete: boolean
      assignedOnly: boolean
    }
    campaign?: {
      view: boolean
      details: boolean
      assignTo: boolean
      edit: boolean
    }
    profile?: {
      view: boolean
      newUser: boolean
      allUserTable: boolean
    }
  }
}

export type AuthRoleDTO = {
  id: string
  name: string
  description?: string | null
} | string | null

export type AuthUserWithAcl = {
  id: string
  name: string
  email: string
  role?: AuthRoleDTO
}

export type AuthLoginResponse = {
  token: string
  user: AuthUserWithAcl
  access: AuthAccessDTO
}
