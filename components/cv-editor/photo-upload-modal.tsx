"use client"

import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Upload, X, Check, RotateCcw, Square, Circle } from "lucide-react"
import type { CVPhoto } from "@/lib/types/cv-editor"
import Cropper from "react-easy-crop"
import type { Point, Area } from "react-easy-crop"

interface PhotoUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPhoto?: CVPhoto
  onSave: (photo: CVPhoto | undefined) => void
}

export function PhotoUploadModal({
  open,
  onOpenChange,
  currentPhoto,
  onSave,
}: PhotoUploadModalProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(currentPhoto?.url)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [shape, setShape] = useState<'square' | 'circle' | 'rounded'>(currentPhoto?.shape || 'square')

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleFileChange = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageSrc(reader.result as string)
        setZoom(1)
        setCrop({ x: 0, y: 0 })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileChange(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleRemovePhoto = () => {
    setImageSrc(undefined)
    setCroppedAreaPixels(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<string> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("No 2d context")
    }

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    return canvas.toDataURL("image/jpeg")
  }

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener("load", () => resolve(image))
      image.addEventListener("error", (error) => reject(error))
      image.src = url
    })

  const handleSubmit = async () => {
    if (!imageSrc) {
      onSave(undefined)
      onOpenChange(false)
      return
    }

    if (croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
        onSave({
          url: croppedImage,
          width: 200,
          height: 200,
          x: 0,
          y: 0,
          shape,
        })
        onOpenChange(false)
      } catch (e) {
        console.error(e)
      }
    } else {
      // If no crop happened but image exists (e.g. initial load), just save it as is or with defaults
       onSave({
          url: imageSrc,
          width: 200,
          height: 200,
          x: 0,
          y: 0,
          shape,
        })
       onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gérer la photo de profil</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!imageSrc ? (
            <div
              className={`mt-2 border-2 border-dashed rounded-lg p-12 text-center ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-zinc-300 hover:border-zinc-400"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
              <p className="text-sm text-zinc-600 mb-2">
                Glissez-déposez une photo ici ou
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choisir un fichier
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileChange(file)
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative w-full h-[400px] bg-zinc-100 rounded-lg overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape={shape === 'circle' ? 'round' : 'rect'}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className="flex items-center gap-4">
                <Label>Zoom</Label>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                  className="flex-1"
                />
              </div>

              <div className="flex items-center gap-4">
                <Label>Forme</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={shape === 'square' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShape('square')}
                    className="h-8 w-8 p-0"
                    title="Carré"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={shape === 'rounded' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShape('rounded')}
                    className="h-8 w-8 p-0"
                    title="Arrondi"
                  >
                    <Square className="h-4 w-4 rounded-sm" />
                  </Button>
                  <Button
                    type="button"
                    variant={shape === 'circle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShape('circle')}
                    className="h-8 w-8 p-0"
                    title="Cercle"
                  >
                    <Circle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Supprimer la photo
                </Button>

                 <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Changer de photo
                </Button>
                 <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileChange(file)
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
