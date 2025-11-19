"use client"

import type { EditableCVData, EditableSection } from "@/lib/types/cv-editor"
import { Mail, Phone, Link, Linkedin, Github, Globe, Twitter } from "lucide-react"
import { cn } from "@/lib/utils"

interface CVTemplateModernProps {
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

export function CVTemplateModern({
  data,
  onSectionHover,
  onSectionClick,
  onPhotoClick,
  hoveredSection,
  hoveredIndex,
}: CVTemplateModernProps) {
  const isHovered = (section: EditableSection, index?: number) => {
    return hoveredSection === section && (index === undefined || hoveredIndex === index)
  }

  return (
    <div className="w-full max-w-[21cm] bg-white shadow-lg mx-auto flex" style={{ minHeight: "29.7cm" }}>
      {/* Sidebar */}
      <div className="w-1/3 bg-gradient-to-b from-blue-600 to-blue-800 text-white p-8">
        {/* Photo */}
        {data.photo && (
          <div
            className="mb-6 cursor-pointer transition-all hover:ring-4 hover:ring-white"
            onClick={onPhotoClick}
          >
            <img
              src={data.photo.url}
              alt={data.name}
              className={cn(
                "w-full aspect-square object-cover border-4 border-white",
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

        {/* Contact */}
        <div
          className={`mb-8 cursor-pointer transition-all p-3 -m-3 rounded cv-section ${
            isHovered("personal") ? "bg-white/10" : ""
          }`}
          onMouseEnter={() => onSectionHover("personal")}
          onMouseLeave={() => onSectionHover(null)}
          onClick={() => onSectionClick("personal")}
        >
          <h2 className="text-base font-bold mb-3 uppercase tracking-wide">Contact</h2>
          <div className="space-y-2 text-xs">
            {data.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span className="break-all">{data.email}</span>
              </div>
            )}
            {data.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <span>{data.phone}</span>
              </div>
            )}
            {data.links && data.links.map((link, index) => {
              const Icon = getLinkIcon(link.icon)
              return (
                <div key={index} className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-white break-all">
                    {link.name}
                  </a>
                </div>
              )
            })}
          </div>
        </div>

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div
            className={`mb-8 cursor-pointer transition-all p-3 -m-3 rounded cv-section ${
              isHovered("skills") ? "bg-white/10" : ""
            }`}
            onMouseEnter={() => onSectionHover("skills")}
            onMouseLeave={() => onSectionHover(null)}
            onClick={() => onSectionClick("skills")}
          >
            <h2 className="text-base font-bold mb-3 uppercase tracking-wide">Compétences</h2>
            <div className="space-y-2">
              {data.skills.map((skill, index) => (
                <div key={index} className="text-xs">
                  • {skill}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div
            className={`mb-8 cursor-pointer transition-all p-3 -m-3 rounded cv-section ${
              isHovered("languages") ? "bg-white/10" : ""
            }`}
            onMouseEnter={() => onSectionHover("languages")}
            onMouseLeave={() => onSectionHover(null)}
            onClick={() => onSectionClick("languages")}
          >
            <h2 className="text-base font-bold mb-3 uppercase tracking-wide">Langues</h2>
            <div className="space-y-2 text-xs">
              {data.languages.map((lang, index) => (
                <div key={index}>
                  <div className="font-medium">{lang.name}</div>
                  <div className="text-blue-200">{lang.level}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hobbies */}
        {data.hobbies && data.hobbies.length > 0 && (
          <div
            className={`cursor-pointer transition-all p-3 -m-3 rounded cv-section ${
              isHovered("hobbies") ? "bg-white/10" : ""
            }`}
            onMouseEnter={() => onSectionHover("hobbies")}
            onMouseLeave={() => onSectionHover(null)}
            onClick={() => onSectionClick("hobbies")}
          >
            <h2 className="text-base font-bold mb-3 uppercase tracking-wide">Centres d'intérêt</h2>
            <div className="space-y-1 text-xs">
              {data.hobbies.map((hobby, index) => (
                <div key={index}>• {hobby}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12">
        {/* Name */}
        <div
          className={`mb-8 cursor-pointer transition-all p-3 -m-3 rounded cv-section ${
            isHovered("personal") ? "bg-blue-50" : ""
          }`}
          onMouseEnter={() => onSectionHover("personal")}
          onMouseLeave={() => onSectionHover(null)}
          onClick={() => onSectionClick("personal")}
        >
          <h1 className="text-3xl font-bold text-blue-800 mb-2">{data.name}</h1>
          <div className="h-1 w-24 bg-blue-600"></div>
        </div>

        {/* About */}
        {data.about && (
          <div className="mb-8 cv-section">
            <h2 className="text-base font-bold text-blue-800 mb-3 uppercase tracking-wide">Profil</h2>
            <div
              className={`cursor-pointer transition-all p-3 -m-3 rounded ${
                isHovered("about") ? "bg-blue-50" : ""
              }`}
              onMouseEnter={() => onSectionHover("about")}
              onMouseLeave={() => onSectionHover(null)}
              onClick={() => onSectionClick("about")}
            >
              <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">{data.about}</p>
            </div>
          </div>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div className="mb-8 cv-section">
            <h2 className="text-base font-bold text-blue-800 mb-4 uppercase tracking-wide">Expérience</h2>
            <div className="space-y-6">
              {data.experience.map((exp, index) => (
                <div
                  key={index}
                  className={`cursor-pointer transition-all p-3 -m-3 rounded border-l-4 ${
                    isHovered("experience", index)
                      ? "bg-blue-50 border-blue-600"
                      : "border-transparent"
                  }`}
                  onMouseEnter={() => onSectionHover("experience", index)}
                  onMouseLeave={() => onSectionHover(null)}
                  onClick={() => onSectionClick("experience", index)}
                >
                  <div className="ml-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900">{exp.title}</h3>
                        <p className="text-xs text-blue-700 font-medium">{exp.company}</p>
                      </div>
                      <span className="text-xs text-zinc-600 font-medium">{exp.period}</span>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div className="mb-8 cv-section">
            <h2 className="text-base font-bold text-blue-800 mb-4 uppercase tracking-wide">Formation</h2>
            <div className="space-y-4">
              {data.education.map((edu, index) => (
                <div
                  key={index}
                  className={`cursor-pointer transition-all p-3 -m-3 rounded ${
                    isHovered("education", index) ? "bg-blue-50" : ""
                  }`}
                  onMouseEnter={() => onSectionHover("education", index)}
                  onMouseLeave={() => onSectionHover(null)}
                  onClick={() => onSectionClick("education", index)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-900">{edu.degree}</h3>
                      <p className="text-xs text-blue-700">{edu.institution}</p>
                    </div>
                    <span className="text-xs text-zinc-600 font-medium">{edu.period}</span>
                  </div>
                  {edu.description && (
                    <p className="text-xs text-zinc-600 mt-1 whitespace-pre-wrap">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div className="mb-8 cv-section">
            <h2 className="text-base font-bold text-blue-800 mb-3 uppercase tracking-wide">Certifications</h2>
            <div
              className={`cursor-pointer transition-all p-3 -m-3 rounded ${
                isHovered("certifications") ? "bg-blue-50" : ""
              }`}
              onMouseEnter={() => onSectionHover("certifications")}
              onMouseLeave={() => onSectionHover(null)}
              onClick={() => onSectionClick("certifications")}
            >
              <ul className="space-y-2 text-zinc-700">
                {data.certifications.map((cert, index) => (
                  <li key={index} className="flex items-start text-xs">
                    <span className="text-blue-600 mr-2">▪</span>
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
