import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { Badge } from "@/components/primitives/badge"
import { apiFetch } from "@/lib/api"
import type { Job } from "@/openapi/openapi-types"

async function getJob(id: string) {
  try {
    return await apiFetch<Job>(`/jobs/${id}`, { method: "GET" }).catch(() => null)
  } catch (error) {
    console.error("[v0] Failed to fetch job:", error)
    return null
  }
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id)

  if (!job) {
    return (
      <>
        <Topbar title="Job Not Found" breadcrumbs={[{ label: "Jobs", href: "/jobs" }]} />
        <main className="flex-1 p-6">
          <p className="text-muted-foreground">Unable to load job details.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title={job.name} breadcrumbs={[{ label: "Jobs", href: "/jobs" }, { label: job.name }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="text-sm font-mono">{job.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-sm">{job.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Schedule</p>
                  <code className="text-sm">{job.schedule_expr}</code>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge
                    variant={job.status === "active" ? "success" : job.status === "paused" ? "warning" : "neutral"}
                  >
                    {job.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
