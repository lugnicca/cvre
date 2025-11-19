"use client"

import { useState } from "react"
import type { EditableCVData, CVTemplate, EditableSection } from "@/lib/types/cv-editor"
import { CVTemplateClassic } from "./cv-template-classic"
import { CVTemplateModern } from "./cv-template-modern"
import { CVTemplateMinimal } from "./cv-template-minimal"

interface CVPreviewProps {
  data: EditableCVData
  template: CVTemplate
  onSectionClick: (section: EditableSection, index?: number) => void
  onPhotoClick: () => void
  onDataUpdate: (updates: Partial<EditableCVData>) => void
}

export function CVPreview({ data, template, onSectionClick, onPhotoClick, onDataUpdate }: CVPreviewProps) {
  const [hoveredSection, setHoveredSection] = useState<EditableSection | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined)

  const handleSectionHover = (section: EditableSection | null, index?: number) => {
    setHoveredSection(section)
    setHoveredIndex(index)
  }

  const renderTemplate = () => {
    const props = {
      data,
      onSectionHover: handleSectionHover,
      onSectionClick,
      onPhotoClick,
      onDataUpdate,
      hoveredSection,
      hoveredIndex,
    }

    switch (template) {
      case "classic":
        return <CVTemplateClassic {...props} />
      case "modern":
        return <CVTemplateModern {...props} />
      case "minimal":
        return <CVTemplateMinimal {...props} />
      default:
        return <CVTemplateClassic {...props} />
    }
  }

  return (
    <div className="w-full h-full overflow-auto bg-zinc-100 p-8 print:p-0 print:bg-white print:overflow-visible">
      <div 
        id="cv-content-wrapper"
        className="mx-auto bg-white shadow-lg print:shadow-none" 
        style={{ 
          width: "210mm", 
          minHeight: "297mm"
        }}
      >
        <div 
          id="cv-content" 
          className="w-full h-full"
          style={{ 
            padding: "0"
          }}
        >
          {renderTemplate()}
        </div>
      </div>
    </div>
  )
}
