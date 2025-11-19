"use client"

import type { EditableCVData, EditableSection } from "@/lib/types/cv-editor"
import { Mail, Phone, Link, Linkedin, Github, Globe, Twitter } from "lucide-react"
import { cn } from "@/lib/utils"

interface CVTemplateMinimalProps {
  data: EditableCVData
  onSectionHover: (section: EditableSection | null, index?: number) => void
  onSectionClick: (section: EditableSection, index?: number) => void
  onPhotoClick: () => void
  hoveredSection: EditableSection | null
  hoveredIndex?: number
}

const getLinkIcon = (iconName?: string) => {
  switch (iconName) {
    case "linkedin":
      return Linkedin
    case "github":
      return Github
    case "globe":
      return Globe
    case "twitter":
      return Twitter
    default:
      return Link
  }
}

export function CVTemplateMinimal({
  data,
  onSectionHover,
  onSectionClick,
  onPhotoClick,
  hoveredSection,
  hoveredIndex,
}: CVTemplateMinimalProps) {
  const isHovered = (section: EditableSection, index?: number) => {
    return hoveredSection === section && (index === undefined || hoveredIndex === index)
  }

  return (
    <div className="w-full max-w-[21cm] bg-white shadow-lg mx-auto p-16" style={{ minHeight: "29.7cm" }}>
      {/* Header */}
      <div className="mb-12 text-center cv-section">
        <div className="flex items-center justify-center gap-8 mb-6">
          {data.photo && (
            <div
              className="flex-shrink-0 cursor-pointer transition-all hover:ring-4 hover:ring-zinc-900"
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
                  !data.photo.shape && "rounded-full"
                )}
                style={{
                  objectPosition: `${data.photo.x}% ${data.photo.y}%`,
                }}
              />
            </div>
          )}

          <div>
            <div
              className={`cursor-pointer transition-all p-3 -m-3 rounded ${
                isHovered("personal") ? "bg-zinc-100" : ""
              }`}
              onMouseEnter={() => onSectionHover("personal")}
              onMouseLeave={() => onSectionHover(null)}
              onClick={() => onSectionClick("personal")}
            >
              <h1 className="text-3xl font-light text-zinc-900 mb-3 tracking-wide">
                {data.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-600">
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
                {data.links && data.links.map((link, index) => {
                  const Icon = getLinkIcon(link.icon)
                  return (
                    <div key={index} className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" />
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {link.name}
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      {data.about && (
        <div className="mb-10 cv-section">
          <h2 className="text-base font-bold text-zinc-900 mb-4 uppercase tracking-widest border-b border-zinc-300 pb-2">
            Profil
          </h2>
          <div
            className={`cursor-pointer transition-all p-4 -m-4 rounded ${
              isHovered("about") ? "bg-zinc-100" : ""
            }`}
            onMouseEnter={() => onSectionHover("about")}
            onMouseLeave={() => onSectionHover(null)}
            onClick={() => onSectionClick("about")}
          >
            <p className="text-xs text-zinc-700 leading-relaxed text-center italic whitespace-pre-wrap">{data.about}</p>
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-10 cv-section">
          <h2 className="text-base font-bold text-zinc-900 mb-4 uppercase tracking-widest border-b border-zinc-300 pb-2">
            Expérience Professionnelle
          </h2>
          <div className="space-y-6">
            {data.experience.map((exp, index) => (
              <div
                key={index}
                className={`cursor-pointer transition-all p-4 -m-4 rounded ${
                  isHovered("experience", index) ? "bg-zinc-100" : ""
                }`}
                onMouseEnter={() => onSectionHover("experience", index)}
                onMouseLeave={() => onSectionHover(null)}
                onClick={() => onSectionClick("experience", index)}
              >
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="text-sm font-semibold text-zinc-900">{exp.title}</h3>
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">{exp.period}</span>
                </div>
                <p className="text-xs text-zinc-600 mb-2">{exp.company}</p>
                <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-10 cv-section">
          <h2 className="text-base font-bold text-zinc-900 mb-4 uppercase tracking-widest border-b border-zinc-300 pb-2">
            Formation
          </h2>
          <div className="space-y-4">
            {data.education.map((edu, index) => (
              <div
                key={index}
                className={`cursor-pointer transition-all p-4 -m-4 rounded ${
                  isHovered("education", index) ? "bg-zinc-100" : ""
                }`}
                onMouseEnter={() => onSectionHover("education", index)}
                onMouseLeave={() => onSectionHover(null)}
                onClick={() => onSectionClick("education", index)}
              >
                <div className="flex justify-between items-baseline">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-900">{edu.degree}</h3>
                    <p className="text-xs text-zinc-600">{edu.institution}</p>
                  </div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">{edu.period}</span>
                </div>
                {edu.description && (
                  <p className="text-xs text-zinc-700 mt-1 whitespace-pre-wrap">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-10">
        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div className="cv-section">
            <h2 className="text-base font-bold text-zinc-900 mb-4 uppercase tracking-widest border-b border-zinc-300 pb-2">
              Compétences
            </h2>
            <div
              className={`cursor-pointer transition-all p-4 -m-4 rounded ${
                isHovered("skills") ? "bg-zinc-100" : ""
              }`}
              onMouseEnter={() => onSectionHover("skills")}
              onMouseLeave={() => onSectionHover(null)}
              onClick={() => onSectionClick("skills")}
            >
              <div className="space-y-1.5">
                {data.skills.map((skill, index) => (
                  <div key={index} className="text-xs text-zinc-700">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div className="cv-section">
            <h2 className="text-base font-bold text-zinc-900 mb-4 uppercase tracking-widest border-b border-zinc-300 pb-2">
              Langues
            </h2>
            <div
              className={`cursor-pointer transition-all p-4 -m-4 rounded ${
                isHovered("languages") ? "bg-zinc-100" : ""
              }`}
              onMouseEnter={() => onSectionHover("languages")}
              onMouseLeave={() => onSectionHover(null)}
              onClick={() => onSectionClick("languages")}
            >
              <div className="space-y-2">
                {data.languages.map((lang, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-zinc-700">{lang.name}</span>
                    <span className="text-zinc-500">{lang.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div className="mt-10 cv-section">
          <h2 className="text-base font-bold text-zinc-900 mb-4 uppercase tracking-widest border-b border-zinc-300 pb-2">
            Certifications
          </h2>
          <div
            className={`cursor-pointer transition-all p-4 -m-4 rounded ${
              isHovered("certifications") ? "bg-zinc-100" : ""
            }`}
            onMouseEnter={() => onSectionHover("certifications")}
            onMouseLeave={() => onSectionHover(null)}
            onClick={() => onSectionClick("certifications")}
          >
            <div className="space-y-1.5">
              {data.certifications.map((cert, index) => (
                <div key={index} className="text-xs text-zinc-700">
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hobbies */}
      {data.hobbies && data.hobbies.length > 0 && (
        <div className="mt-10 cv-section">
          <h2 className="text-base font-bold text-zinc-900 mb-4 uppercase tracking-widest border-b border-zinc-300 pb-2">
            Centres d'intérêt
          </h2>
          <div
            className={`cursor-pointer transition-all p-4 -m-4 rounded ${
              isHovered("hobbies") ? "bg-zinc-100" : ""
            }`}
            onMouseEnter={() => onSectionHover("hobbies")}
            onMouseLeave={() => onSectionHover(null)}
            onClick={() => onSectionClick("hobbies")}
          >
            <div className="flex flex-wrap gap-4 text-xs text-zinc-700">
              {data.hobbies.map((hobby, index) => (
                <span key={index}>{hobby}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
