"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type ResourceField = {
  name: string
  label: string
  type?: "text" | "number" | "password" | "email" | "select"
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
}

export type ResourceColumn<T> = {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
}

type Props<T> = {
  title: string
  description?: string
  addLabel: string
  fields: ResourceField[]
  columns: ResourceColumn<T>[]
  rows: T[]
  isLoading?: boolean
  creating?: boolean
  onCreate: (values: Record<string, unknown>) => Promise<unknown>
}

export function ResourceManager<T extends { id: number }>({
  title,
  description,
  addLabel,
  fields,
  columns,
  rows,
  isLoading,
  creating,
  onCreate,
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})

  const set = (name: string, value: string) =>
    setValues((v) => ({ ...v, [name]: value }))

  const submit = async () => {
    const payload: Record<string, unknown> = {}
    for (const f of fields) {
      const raw = values[f.name]
      if (raw === undefined || raw === "") continue
      payload[f.name] = f.type === "number" ? Number(raw) : raw
    }
    await onCreate(payload)
    setValues({})
    setOpen(false)
  }

  const missingRequired = fields.some(
    (f) => f.required && !values[f.name]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {addLabel}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? "Loading…" : `${rows.length} record${rows.length === 1 ? "" : "s"}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nothing here yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        {c.render
                          ? c.render(row)
                          : String((row as Record<string, unknown>)[c.key] ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{addLabel}</DialogTitle>
            <DialogDescription>
              Fields marked * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {fields.map((f) => (
              <div key={f.name} className="grid gap-2">
                <Label htmlFor={f.name}>
                  {f.label}
                  {f.required && " *"}
                </Label>
                {f.type === "select" ? (
                  <Select
                    value={values[f.name] ?? ""}
                    onValueChange={(v) => set(f.name, v)}
                  >
                    <SelectTrigger id={f.name}>
                      <SelectValue placeholder={f.placeholder ?? "Select…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={f.name}
                    type={f.type === "number" ? "number" : f.type ?? "text"}
                    placeholder={f.placeholder}
                    value={values[f.name] ?? ""}
                    onChange={(e) => set(f.name, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={creating || missingRequired}>
              {creating ? "Saving…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
