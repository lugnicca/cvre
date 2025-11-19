"use client"

import { useState, useMemo, useCallback } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
  type Column,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  FileEdit,
  Calendar as CalendarIcon,
  Copy,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { OptimizedCV } from "@/lib/db"
import { db } from "@/lib/db"
import { JobDetailsDialog } from "./job-details-dialog"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CVTrackingGridProps {
  data: OptimizedCV[]
  onDataChange: () => void
}

export function CVTrackingGrid({ data, onDataChange }: CVTrackingGridProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [selectedCV, setSelectedCV] = useState<OptimizedCV | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cvToDelete, setCvToDelete] = useState<string | null>(null)

  // Helper component for sort icons
  const SortIcon = ({ isSorted }: { isSorted: false | "asc" | "desc" }) => {
    if (isSorted === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    if (isSorted === "desc") {
      return <ArrowDown className="ml-2 h-4 w-4" />
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  // Helper function for cycling through sort states: none → asc → desc → none
  const handleSortCycle = (column: Column<OptimizedCV, unknown>) => {
    const currentSort = column.getIsSorted()
    if (currentSort === false) {
      column.toggleSorting(false) // Set to asc
    } else if (currentSort === "asc") {
      column.toggleSorting(true) // Set to desc
    } else {
      column.clearSorting() // Clear sorting
    }
  }

  const handleStatusChange = useCallback(async (id: string, newStatus: OptimizedCV['status']) => {
    try {
      const updates: Partial<OptimizedCV> = {
        status: newStatus,
        updatedAt: Date.now(), // Always update timestamp
      }

      // If status becomes 'sent', update the date to today (user requirement)
      if (newStatus === 'sent') {
        updates.sentAt = Date.now()
      } 
      // If status goes back to 'optimized', remove the date
      else if (newStatus === 'optimized') {
        updates.sentAt = null
      }
      // For other statuses, do not remove the date (keep existing sentAt)

      await db.optimizedCVs.update(id, updates)
      toast.success("Status mis à jour", {
        description: "Le statut de la candidature a été modifié.",
        duration: 3000,
      })
      onDataChange()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error("Erreur", {
        description: "Impossible de mettre à jour le statut.",
        duration: 3000,
      })
    }
  }, [onDataChange])

  const handleDelete = async (id: string) => {
    try {
      await db.optimizedCVs.delete(id)
      toast.success("Candidature supprimée", {
        description: "La candidature a été supprimée avec succès.",
        duration: 3000,
      })
      onDataChange()
    } catch (error) {
      console.error('Error deleting CV:', error)
      toast.error("Erreur", {
        description: "Impossible de supprimer la candidature.",
        duration: 3000,
      })
    }
  }

  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key])
    try {
      await Promise.all(selectedIds.map(id => db.optimizedCVs.delete(id)))
      toast.success(`${selectedIds.length} candidature(s) supprimée(s)`, {
        description: "Les candidatures ont été supprimées avec succès.",
        duration: 3000,
      })
      setRowSelection({})
      onDataChange()
    } catch (error) {
      console.error('Error deleting CVs:', error)
      toast.error("Erreur", {
        description: "Impossible de supprimer les candidatures.",
        duration: 3000,
      })
    }
  }

  const openDeleteDialog = (id: string) => {
    setCvToDelete(id)
    setDeleteDialogOpen(true)
  }

  const columns = useMemo<ColumnDef<OptimizedCV>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        id: "details",
        header: "",
        size: 50,
        cell: ({ row }) => {
          const cv = row.original
          return (
            <div className="flex justify-start -ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCV(cv)}
                className="h-8 w-8 p-0"
                title="Voir les détails"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
      {
        accessorKey: "jobTitle",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => handleSortCycle(column)}
              className="h-8 px-0 hover:bg-transparent -ml-2"
            >
              Titre du poste
              <SortIcon isSorted={column.getIsSorted()} />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="font-medium truncate max-w-[50ch]" title={row.getValue("jobTitle")}>
            {row.getValue("jobTitle")}
          </div>
        ),
      },
      {
        accessorKey: "company",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => handleSortCycle(column)}
              className="h-8 px-0 hover:bg-transparent -ml-2"
            >
              Entreprise
              <SortIcon isSorted={column.getIsSorted()} />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="truncate max-w-[50ch]" title={row.getValue("company")}>
            {row.getValue("company")}
          </div>
        ),
      },
      {
        accessorKey: "sentAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => handleSortCycle(column)}
              className="h-8 px-0 hover:bg-transparent -ml-2"
            >
              Date d&apos;envoi
              <SortIcon isSorted={column.getIsSorted()} />
            </Button>
          )
        },
        cell: ({ row }) => {
          const sentAt = row.original.sentAt ? new Date(row.original.sentAt) : undefined
          
          return (
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-8 w-full justify-start text-left font-normal -ml-2 px-2 hover:bg-transparent",
                      !sentAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className={cn("h-4 w-4", sentAt && "mr-2")} />
                    {sentAt ? format(sentAt, "P", { locale: fr }) : ""}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={sentAt}
                    onSelect={async (date: Date | undefined) => {
                      await db.optimizedCVs.update(row.original.id, {
                        sentAt: date ? date.getTime() : null
                      })
                      onDataChange()
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )
        },
      },
      {
        accessorKey: "matchScore",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => handleSortCycle(column)}
              className="h-8 px-0 hover:bg-transparent -ml-2"
            >
              Score
              <SortIcon isSorted={column.getIsSorted()} />
            </Button>
          )
        },
        cell: ({ row }) => {
          const score = row.getValue("matchScore") as number
          return (
            <div className={`text-sm font-medium ${
              score >= 80 ? 'text-green-600' :
              score >= 60 ? 'text-blue-600' :
              'text-amber-600'
            }`}>
              {score}%
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => handleSortCycle(column)}
              className="h-8 px-0 hover:bg-transparent -ml-2"
            >
              Status
              <SortIcon isSorted={column.getIsSorted()} />
            </Button>
          )
        },
        cell: ({ row }) => {
          const status = row.getValue("status") as OptimizedCV['status']
          const id = row.original.id

          const getStatusColor = (status: OptimizedCV['status']) => {
            switch (status) {
              case 'optimized':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
              case 'sent':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
              case 'interview':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
              case 'rejected':
                return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
              case 'offer':
                return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
            }
          }

          return (
            <div>
              <Select value={status} onValueChange={(value) => handleStatusChange(id, value as OptimizedCV['status'])}>
                <SelectTrigger className={`w-[105px] h-7 text-xs px-2 ${getStatusColor(status)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="optimized">Optimisé</SelectItem>
                  <SelectItem value="sent">Envoyé</SelectItem>
                  <SelectItem value="interview">Entretien</SelectItem>
                  <SelectItem value="rejected">Refusé</SelectItem>
                  <SelectItem value="offer">Offre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        size: 130,
        cell: ({ row }) => {
          const cv = row.original
          
          const handleCopyJson = async (e: React.MouseEvent) => {
            e.stopPropagation()
            try {
              // We copy the optimizedCV content (the structured data)
              await navigator.clipboard.writeText(JSON.stringify(cv.optimizedCV, null, 2))
              toast.success("JSON copié dans le presse-papier")
            } catch (_) {
              toast.error("Erreur lors de la copie")
            }
          }

          return (
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/editor/${cv.id}`)}
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                title="Modifier le CV"
              >
                <FileEdit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyJson}
                className="h-8 w-8 p-0 text-zinc-600 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/20"
                title="Copier le JSON"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {cv.jobUrl ? (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                  title="Voir l'offre"
                >
                  <a href={cv.jobUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <div className="w-8 h-8" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDeleteDialog(cv.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [handleStatusChange, router]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const selectedCount = Object.keys(rowSelection).filter(key => rowSelection[key]).length

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center gap-4 mt-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre ou entreprise..."
            value={(table.getColumn("jobTitle")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("jobTitle")?.setFilterValue(event.target.value)
            }
            className="pl-9"
          />
        </div>
        {selectedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setCvToDelete(null)
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer ({selectedCount})
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`py-4 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider ${
                        header.column.id === 'select' ? 'px-4' :
                        header.column.id === 'details' ? 'px-2' :
                        header.column.id === 'actions' ? 'px-2' :
                        'pl-4 pr-2'
                      }`}
                      style={
                        header.column.id === 'actions' ? { width: '130px', minWidth: '130px' } :
                        header.column.id === 'details' ? { width: '50px', minWidth: '50px' } :
                        header.column.id === 'select' ? { width: '40px', minWidth: '40px' } :
                        undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-zinc-950 divide-y divide-zinc-200 dark:divide-zinc-800">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`py-4 whitespace-nowrap text-sm ${
                          cell.column.id === 'select' ? 'px-4' :
                          cell.column.id === 'details' ? 'px-2' :
                          cell.column.id === 'actions' ? 'px-2' :
                          'pl-4 pr-2'
                        }`}
                        style={
                          cell.column.id === 'actions' ? { width: '130px', minWidth: '130px' } :
                          cell.column.id === 'details' ? { width: '50px', minWidth: '50px' } :
                          cell.column.id === 'select' ? { width: '40px', minWidth: '40px' } :
                          undefined
                        }
                       >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    Aucun CV optimisé. Commencez par optimiser un CV dans la page Match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {table.getRowModel().rows?.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} sur{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Job Details Dialog */}
      {selectedCV && (
        <JobDetailsDialog
          open={!!selectedCV}
          onOpenChange={(open) => !open && setSelectedCV(null)}
          optimizedCV={selectedCV}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          if (cvToDelete) {
            handleDelete(cvToDelete)
          } else {
            handleDeleteSelected()
          }
        }}
        count={cvToDelete ? 1 : selectedCount}
      />
    </div>
  )
}
