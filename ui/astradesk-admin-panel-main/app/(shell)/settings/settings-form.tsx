"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { Button } from "@/components/primitives/button"
import { JsonViewer } from "@/components/misc/json-viewer"
import { apiFetch } from "@/lib/api"
import type { Setting } from "@/openapi/openapi-types"
import { useRouter } from "next/navigation"

interface SettingsFormProps {
  setting: Setting
  endpoint: string
}

export function SettingsForm({ setting, endpoint }: SettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [value, setValue] = useState(JSON.stringify(setting.value, null, 2))

  const handleSave = async () => {
    setLoading(true)
    try {
      const parsedValue = JSON.parse(value)
      await apiFetch(endpoint, {
        method: "PUT",
        body: JSON.stringify({
          group: setting.group,
          key: setting.key,
          value: parsedValue,
        }),
      })
      alert("Settings saved successfully")
      setEditMode(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Save failed:", error)
      alert("Failed to save settings. Check your JSON syntax.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {setting.group} / {setting.key}
        </CardTitle>
        <div className="flex gap-2">
          {!editMode && (
            <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
              Edit
            </Button>
          )}
          {editMode && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editMode ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono min-h-64"
          />
        ) : (
          <JsonViewer data={setting.value} />
        )}
      </CardContent>
    </Card>
  )
}
