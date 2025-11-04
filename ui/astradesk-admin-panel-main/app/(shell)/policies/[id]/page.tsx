import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { apiFetch } from "@/lib/api"
import type { Policy } from "@/openapi/openapi-types"
import { PolicySimulator } from "./policy-simulator"

async function getPolicy(id: string) {
  try {
    return await apiFetch<Policy>(`/policies/${id}`, { method: "GET" }).catch(() => null)
  } catch (error) {
    console.error("[v0] Failed to fetch policy:", error)
    return null
  }
}

export default async function PolicyDetailPage({ params }: { params: { id: string } }) {
  const policy = await getPolicy(params.id)

  if (!policy) {
    return (
      <>
        <Topbar title="Policy Not Found" breadcrumbs={[{ label: "Policies", href: "/policies" }]} />
        <main className="flex-1 p-6">
          <p className="text-muted-foreground">Unable to load policy details.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title={policy.name} breadcrumbs={[{ label: "Policies", href: "/policies" }, { label: policy.name }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Policy Definition</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-muted p-4 text-xs overflow-auto font-mono">
                <code>{policy.rego_text}</code>
              </pre>
            </CardContent>
          </Card>

          <PolicySimulator policyId={params.id} />
        </div>
      </main>
    </>
  )
}
