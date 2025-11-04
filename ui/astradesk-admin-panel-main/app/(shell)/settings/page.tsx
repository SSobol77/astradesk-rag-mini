import { Topbar } from "@/components/layout/topbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/primitives/tabs"
import { apiFetch } from "@/lib/api"
import type { Setting } from "@/openapi/openapi-types"
import { SettingsForm } from "./settings-form"

async function getSettings() {
  try {
    const [integrations, localization, platform] = await Promise.all([
      apiFetch<Setting>("/settings/integrations"),
      apiFetch<Setting>("/settings/localization"),
      apiFetch<Setting>("/settings/platform"),
    ])
    return { integrations, localization, platform }
  } catch (error) {
    console.error("[v0] Failed to fetch settings:", error)
    return null
  }
}

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <>
      <Topbar title="Settings" breadcrumbs={[{ label: "Settings" }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <p className="text-sm text-muted-foreground">Configure platform settings and integrations</p>

          <Tabs defaultValue="integrations">
            <TabsList>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="localization">Localization</TabsTrigger>
              <TabsTrigger value="platform">Platform</TabsTrigger>
            </TabsList>

            <TabsContent value="integrations">
              {settings?.integrations ? (
                <SettingsForm setting={settings.integrations} endpoint="/settings/integrations" />
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load integrations settings</p>
              )}
            </TabsContent>

            <TabsContent value="localization">
              {settings?.localization ? (
                <SettingsForm setting={settings.localization} endpoint="/settings/localization" />
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load localization settings</p>
              )}
            </TabsContent>

            <TabsContent value="platform">
              {settings?.platform ? (
                <SettingsForm setting={settings.platform} endpoint="/settings/platform" />
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load platform settings</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
