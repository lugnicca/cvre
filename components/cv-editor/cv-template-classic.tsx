"use client"

import type { EditableCVData, EditableSection } from "@/lib/types/cv-editor"
import { Mail, Phone, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SortableListItem } from "./sortable-list-item"
import { cn } from "@/lib/utils"

interface CVTemplateClassicProps {
  data: EditableCVData
  onSectionHover: (section: EditableSection | null, index?: number) => void
  onSectionClick: (section: EditableSection, index?: number) => void
  onPhotoClick: () => void
  onDataUpdate: (updates: Partial<EditableCVData>) => void
  hoveredSection: EditableSection | null
  hoveredIndex?: number
}

interface SortableExperienceProps {
  id: string
  exp: NonNullable<EditableCVData["experience"]>[number]
  index: number
  isHovered: boolean
  onSectionHover: (section: EditableSection | null, index?: number) => void
  onSectionClick: (section: EditableSection, index?: number) => void
}

function SortableExperience({
  id,
  exp,
  index,
  isHovered,
  onSectionHover,
  onSectionClick,
}: SortableExperienceProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        className={`cursor-pointer transition-all p-2 -m-2 rounded ${
          isHovered ? "bg-blue-50" : ""
        }`}
        onMouseEnter={() => onSectionHover("experience", index)}
        onMouseLeave={() => onSectionHover(null)}
        onClick={() => onSectionClick("experience", index)}
      >
        <div
          className="absolute -left-6 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-zinc-400" />
        </div>
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">{exp.title}</h3>
            <p className="text-xs text-zinc-700 font-medium">{exp.company}</p>
          </div>
          <span className="text-xs text-zinc-600">{exp.period}</span>
        </div>
        {Array.isArray(exp.description) ? (
          <ul className="list-disc list-inside space-y-0.5">
            {exp.description.map((bullet, idx) => (
              <li key={idx} className="text-xs text-zinc-600 leading-relaxed">
                {bullet}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
        )}
      </div>
    </div>
  )
}

export function CVTemplateClassic({
  data,
  onSectionHover,
  onSectionClick,
  onPhotoClick,
  onDataUpdate,
  hoveredSection,
  hoveredIndex,
}: CVTemplateClassicProps) {
  const isHovered = (section: EditableSection, index?: number) => {
    return hoveredSection === section && (index === undefined || hoveredIndex === index)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleExperienceDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const experiences = data.experience || []
      const oldIndex = experiences.findIndex((_, i) => `exp-${i}` === active.id)
      const newIndex = experiences.findIndex((_, i) => `exp-${i}` === over.id)

      const newExperiences = arrayMove(experiences, oldIndex, newIndex)
      onDataUpdate({ experience: newExperiences })
    }
  }

  const handleSkillsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const skills = data.skills || []
      const oldIndex = skills.findIndex((_, i) => `skill-${i}` === active.id)
      const newIndex = skills.findIndex((_, i) => `skill-${i}` === over.id)
      const newSkills = arrayMove(skills, oldIndex, newIndex)
      onDataUpdate({ skills: newSkills })
    }
  }

  const handleLanguagesDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const languages = data.languages || []
      const oldIndex = languages.findIndex((_, i) => `lang-${i}` === active.id)
      const newIndex = languages.findIndex((_, i) => `lang-${i}` === over.id)
      const newLanguages = arrayMove(languages, oldIndex, newIndex)
      onDataUpdate({ languages: newLanguages })
    }
  }

  const handleCertificationsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const certifications = data.certifications || []
      const oldIndex = certifications.findIndex((_, i) => `cert-${i}` === active.id)
      const newIndex = certifications.findIndex((_, i) => `cert-${i}` === over.id)
      const newCertifications = arrayMove(certifications, oldIndex, newIndex)
      onDataUpdate({ certifications: newCertifications })
    }
  }

  const handleHobbiesDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const hobbies = data.hobbies || []
      const oldIndex = hobbies.findIndex((_, i) => `hobby-${i}` === active.id)
      const newIndex = hobbies.findIndex((_, i) => `hobby-${i}` === over.id)
      const newHobbies = arrayMove(hobbies, oldIndex, newIndex)
      onDataUpdate({ hobbies: newHobbies })
    }
  }

  return (
    <div className="w-full max-w-[21cm] bg-white shadow-lg mx-auto" style={{ minHeight: "29.7cm" }}>
      {/* Header */}
      <div className="border-b-2 border-zinc-800 pb-6 mb-6">
        <div className="flex items-start gap-4 px-8 pt-6">
          {/* Photo */}
          {data.photo && (
            <div
              className="flex-shrink-0 cursor-pointer transition-all hover:ring-4 hover:ring-blue-500"
              onClick={onPhotoClick}
            >
              <img
                src={data.photo.url}
                alt={data.name}
                className={cn(
                  "w-24 h-24 object-cover",
                  data.photo.shape === 'square' && "rounded-none",
                  data.photo.shape === 'rounded' && "rounded-lg",
                  data.photo.shape === 'circle' && "rounded-full",
                  !data.photo.shape && "rounded-lg"
                )}
                style={{
                  objectPosition: `${data.photo.x}% ${data.photo.y}%`,
                }}
              />
            </div>
          )}

          {/* Personal Info */}
          <div className="flex-1">
            <div
              className={`cursor-pointer transition-all p-2 -m-2 rounded ${
                isHovered("personal") ? "bg-blue-50" : ""
              }`}
              onMouseEnter={() => onSectionHover("personal")}
              onMouseLeave={() => onSectionHover(null)}
              onClick={() => onSectionClick("personal")}
            >
              <h1 className="text-3xl font-bold text-zinc-900 mb-2">{data.name}</h1>
              <div className="flex flex-wrap gap-3 text-xs text-zinc-600">
                {data.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{data.email}</span>
                  </div>
                )}
                {data.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{data.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-12">
        {/* About */}
        {data.about && (
          <div className="mb-6 cv-section">
            <h2 className="text-base font-bold text-zinc-900 mb-2 uppercase tracking-wide">
              Profil
            </h2>
            <div
              className={`cursor-pointer transition-all p-2 -m-2 rounded ${
                isHovered("about") ? "bg-blue-50" : ""
              }`}
              onMouseEnter={() => onSectionHover("about")}
              onMouseLeave={() => onSectionHover(null)}
              onClick={() => onSectionClick("about")}
            >
              <p className="text-xs text-zinc-700 leading-relaxed">{data.about}</p>
            </div>
          </div>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div className="mb-6 cv-section">
            <h2 className="text-base font-bold text-zinc-900 mb-2 uppercase tracking-wide">
              Expérience Professionnelle
            </h2>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleExperienceDragEnd}
            >
              <SortableContext
                items={data.experience.map((_, i) => `exp-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4 pl-6">
                  {data.experience.map((exp, index) => (
                    <SortableExperience
                      key={`exp-${index}`}
                      id={`exp-${index}`}
                      exp={exp}
                      index={index}
                      isHovered={isHovered("experience", index)}
                      onSectionHover={onSectionHover}
                      onSectionClick={onSectionClick}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div className="mb-6 cv-section">
            <h2 className="text-base font-bold text-zinc-900 mb-2 uppercase tracking-wide">
              Formation
            </h2>
            <div className="space-y-3">
              {data.education.map((edu, index) => (
                <div
                  key={index}
                  className={`cursor-pointer transition-all p-2 -m-2 rounded ${
                    isHovered("education", index) ? "bg-blue-50" : ""
                  }`}
                  onMouseEnter={() => onSectionHover("education", index)}
                  onMouseLeave={() => onSectionHover(null)}
                  onClick={() => onSectionClick("education", index)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-900">{edu.degree}</h3>
                      <p className="text-xs text-zinc-700">{edu.institution}</p>
                    </div>
                    <span className="text-xs text-zinc-600">{edu.period}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div className="mb-4 cv-section">
              <h2 className="text-base font-bold text-zinc-900 mb-2 uppercase tracking-wide">
                Compétences
              </h2>
              <div
                className={`cursor-pointer transition-all p-2 -m-2 rounded ${
                  isHovered("skills") ? "bg-blue-50" : ""
                }`}
                onMouseEnter={() => onSectionHover("skills")}
                onMouseLeave={() => onSectionHover(null)}
                onClick={() => onSectionClick("skills")}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSkillsDragEnd}
                >
                  <SortableContext
                    items={data.skills.map((_, i) => `skill-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-wrap gap-1.5 pl-5">
                      {data.skills.map((skill, index) => (
                        <SortableListItem key={`skill-${index}`} id={`skill-${index}`}>
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded text-xs">
                            {skill}
                          </span>
                        </SortableListItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <div className="mb-4 cv-section">
              <h2 className="text-base font-bold text-zinc-900 mb-2 uppercase tracking-wide">
                Langues
              </h2>
              <div
                className={`cursor-pointer transition-all p-2 -m-2 rounded ${
                  isHovered("languages") ? "bg-blue-50" : ""
                }`}
                onMouseEnter={() => onSectionHover("languages")}
                onMouseLeave={() => onSectionHover(null)}
                onClick={() => onSectionClick("languages")}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleLanguagesDragEnd}
                >
                  <SortableContext
                    items={data.languages.map((_, i) => `lang-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1 pl-5">
                      {data.languages.map((lang, index) => (
                        <SortableListItem key={`lang-${index}`} id={`lang-${index}`}>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-700">{lang.name}</span>
                            <span className="text-zinc-600">{lang.level}</span>
                          </div>
                        </SortableListItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <div className="mb-6 cv-section">
              <h2 className="text-base font-bold text-zinc-900 mb-2 uppercase tracking-wide">
                Certifications
              </h2>
              <div
                className={`cursor-pointer transition-all p-2 -m-2 rounded ${
                  isHovered("certifications") ? "bg-blue-50" : ""
                }`}
                onMouseEnter={() => onSectionHover("certifications")}
                onMouseLeave={() => onSectionHover(null)}
                onClick={() => onSectionClick("certifications")}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleCertificationsDragEnd}
                >
                  <SortableContext
                    items={data.certifications.map((_, i) => `cert-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="list-disc list-inside space-y-0.5 text-xs text-zinc-700 pl-5">
                      {data.certifications.map((cert, index) => (
                        <SortableListItem key={`cert-${index}`} id={`cert-${index}`}>
                          <li>{cert}</li>
                        </SortableListItem>
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}

          {/* Hobbies */}
          {data.hobbies && data.hobbies.length > 0 && (
            <div className="mb-6 cv-section">
              <h2 className="text-base font-bold text-zinc-900 mb-2 uppercase tracking-wide">
                Centres d'intérêt
              </h2>
              <div
                className={`cursor-pointer transition-all p-2 -m-2 rounded ${
                  isHovered("hobbies") ? "bg-blue-50" : ""
                }`}
                onMouseEnter={() => onSectionHover("hobbies")}
                onMouseLeave={() => onSectionHover(null)}
                onClick={() => onSectionClick("hobbies")}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleHobbiesDragEnd}
                >
                  <SortableContext
                    items={data.hobbies.map((_, i) => `hobby-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-wrap gap-1.5 text-xs pl-5">
                      {data.hobbies.map((hobby, index) => (
                        <SortableListItem key={`hobby-${index}`} id={`hobby-${index}`}>
                          <span className="text-zinc-700">
                            {hobby}
                            {index < data.hobbies!.length - 1 && " •"}
                          </span>
                        </SortableListItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
