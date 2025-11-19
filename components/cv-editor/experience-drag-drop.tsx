"use client"

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
import { GripVertical } from "lucide-react"
import type { EditableCVData } from "@/lib/types/cv-editor"

interface ExperienceDragDropProps {
  experiences: EditableCVData["experience"]
  onReorder: (experiences: EditableCVData["experience"]) => void
  onEdit: (index: number) => void
  renderExperience: (exp: NonNullable<EditableCVData["experience"]>[number], index: number) => React.ReactNode
}

interface SortableExperienceProps {
  id: string
  index: number
  children: React.ReactNode
}

function SortableExperience({ id, index, children }: SortableExperienceProps) {
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
        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-8 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-zinc-400" />
      </div>
      {children}
    </div>
  )
}

export function ExperienceDragDrop({
  experiences,
  onReorder,
  onEdit,
  renderExperience,
}: ExperienceDragDropProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = experiences.findIndex((_, i) => `experience-${i}` === active.id)
      const newIndex = experiences.findIndex((_, i) => `experience-${i}` === over.id)

      const newExperiences = arrayMove(experiences, oldIndex, newIndex)
      onReorder(newExperiences)
    }
  }

  if (!experiences || experiences.length === 0) {
    return null
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={experiences.map((_, i) => `experience-${i}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-6">
          {experiences.map((exp, index) => (
            <SortableExperience key={`experience-${index}`} id={`experience-${index}`} index={index}>
              {renderExperience(exp, index)}
            </SortableExperience>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
