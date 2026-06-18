import { createContext, useContext } from 'react'

const BuilderFieldsOptionalContext = createContext(false)

export function BuilderFieldsOptionalProvider({
  optional,
  children,
}: {
  optional: boolean
  children: React.ReactNode
}) {
  return <BuilderFieldsOptionalContext.Provider value={optional}>{children}</BuilderFieldsOptionalContext.Provider>
}

/** When default template is selected, all builder fields are optional in the UI. */
export function useBuilderFieldRequired(normallyRequired = false): boolean {
  const allOptional = useContext(BuilderFieldsOptionalContext)
  if (allOptional) return false
  return normallyRequired
}

export function useBuilderSectionTitle(label: string, normallyMarkedRequired = false): string {
  const allOptional = useContext(BuilderFieldsOptionalContext)
  if (normallyMarkedRequired && !allOptional) return `${label} *`
  return label
}
