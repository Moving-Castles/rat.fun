import { ReactNode } from "react"

export type StepContentProps = {
  isActive: boolean
  isExpanded: boolean
  isFocused: boolean
  setFocused: (isFocused: boolean) => void
}

export type Step = {
  id: string
  isComplete: boolean
  content: (props: StepContentProps) => ReactNode
}
