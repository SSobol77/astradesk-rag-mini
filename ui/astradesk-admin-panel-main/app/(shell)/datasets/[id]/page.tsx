import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/primitives/tabs"
import { Badge } from "@/components/primitives/badge"
import { JsonViewer } from "@/components/misc/json-viewer"
import { apiFetch } from "@/lib/api"
import type { Dataset } from "@/openapi/openapi-types"

async function getDatasetDetails(id: string) {
  try {
    const [dataset, schema, embeddings] = await Promise.all([
      apiFetch<Dataset>(`/datasets/${id}`, { method: "GET" }).catch(() => null),
      apiFetch<Record<string, unknown>>(`/datasets/${id}/schema`),
      apiFetch<Array<Record<string, unknown>>>(`/datasets/${id}/embeddings`),
    ])
    return { dataset, schema, embeddings }
  } catch (error) {
    console.error("[v0] Failed to fetch dataset details:", error)
    return null
  }
}

export default async function DatasetDetailPage({ params }: { params: { id: string } }) {
  const data = await getDatasetDetails(params.id)

  if (!data?.dataset) {
    return (
      <>
        <Topbar title="Dataset Not Found" breadcrumbs={[{ label: "Datasets", href: "/datasets" }]} />
        <main className="flex-1 p-6">
          <p className="text-muted-foreground">Unable to load dataset details.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar
        title={data.dataset.name}
        breadcrumbs={[{ label: "Datasets", href: "/datasets" }, { label: data.dataset.name }]}
      />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Badge variant="neutral">{data.dataset.type}</Badge>
            <Badge
              variant={
                data.dataset.indexing_status === "completed"
                  ? "success"
                  : data.dataset.indexing_status === "indexing"
                    ? "warning"
                    : "neutral"
              }
            >
              {data.dataset.indexing_status}
            </Badge>
          </div>

          <Tabs defaultValue="schema">
            <TabsList>
              <TabsTrigger value="schema">Schema</TabsTrigger>
              <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
            </TabsList>

            <TabsContent value="schema">
              <Card>
                <CardHeader>
                  <CardTitle>Dataset Schema</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.schema ? (
                    <JsonViewer data={data.schema} />
                  ) : (
                    <p className="text-sm text-muted-foreground">No schema available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="embeddings">
              <Card>
                <CardHeader>
                  <CardTitle>Embeddings Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.embeddings && data.embeddings.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Total embeddings: {data.embeddings.length}</p>
                      <JsonViewer data={data.embeddings} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No embeddings available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
