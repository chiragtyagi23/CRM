import type { AuthAccessDTO } from '../types/dtos'

export const MODULE_KEYS = {
  leads: {
    view: 'leads',
    assignTo: 'leads.assignto',
    delete: 'leads.delete',
  },
  campaign: {
    view: 'campaign',
    details: 'campaign.details',
    assignTo: 'campaign.assignto',
    edit: 'campaign.edit',
  },
  profile: {
    view: 'profile',
    newUser: 'profile.newusers',
    allUserTable: 'profile.allUserTable',
  },
} as const

export type UiPermissionFlags = {
  leads: {
    view: boolean
    assignTo: boolean
    delete: boolean
    assignedOnly: boolean
  }
  campaign: {
    view: boolean
    details: boolean
    assignTo: boolean
    edit: boolean
  }
  profile: {
    view: boolean
    newUser: boolean
    allUserTable: boolean
  }
}

export function resolveUiPermissions(
  access: AuthAccessDTO | null,
  hasAccess: (moduleKey: string) => boolean,
): UiPermissionFlags {
  if (access?.permissions?.leads) {
    const campaignView = hasAccess(MODULE_KEYS.campaign.view)
    return {
      leads: access.permissions.leads,
      campaign: {
        view: campaignView,
        details: hasAccess(MODULE_KEYS.campaign.details) || campaignView,
        assignTo: hasAccess(MODULE_KEYS.campaign.assignTo),
        edit: hasAccess(MODULE_KEYS.campaign.edit),
      },
      profile: {
        view: hasAccess(MODULE_KEYS.profile.view),
        newUser: hasAccess(MODULE_KEYS.profile.newUser),
        allUserTable: hasAccess(MODULE_KEYS.profile.allUserTable),
      },
    }
  }
  const view = hasAccess(MODULE_KEYS.leads.view)
  const assignTo = hasAccess(MODULE_KEYS.leads.assignTo)
  const del = hasAccess(MODULE_KEYS.leads.delete)
  const campaignView = hasAccess(MODULE_KEYS.campaign.view)
  return {
    leads: {
      view,
      assignTo,
      delete: del,
      assignedOnly: view && !assignTo,
    },
    campaign: {
      view: campaignView,
      details: hasAccess(MODULE_KEYS.campaign.details) || campaignView,
      assignTo: hasAccess(MODULE_KEYS.campaign.assignTo),
      edit: hasAccess(MODULE_KEYS.campaign.edit),
    },
    profile: {
      view: hasAccess(MODULE_KEYS.profile.view),
      newUser: hasAccess(MODULE_KEYS.profile.newUser),
      allUserTable: hasAccess(MODULE_KEYS.profile.allUserTable),
    },
  }
}
