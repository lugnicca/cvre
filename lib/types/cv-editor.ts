import type { ParsedCVData } from "@/lib/db"

export type CVTemplate = "classic" | "modern" | "minimal"

export interface CVPhoto {
  url: string
  width: number
  height: number
  x: number
  y: number
  shape?: 'square' | 'circle' | 'rounded'
}

export interface EditableCVData extends ParsedCVData {
  photo?: CVPhoto
}

export type EditableSection =
  | "personal"
  | "about"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "certifications"
  | "hobbies"

export interface SectionEditState {
  section: EditableSection
  index?: number // For array items like experiences
  isOpen: boolean
}

export interface CVEditorState {
  cvData: EditableCVData
  template: CVTemplate
  selectedSection: EditableSection | null
  editState: SectionEditState | null
  hasUnsavedChanges: boolean
}
