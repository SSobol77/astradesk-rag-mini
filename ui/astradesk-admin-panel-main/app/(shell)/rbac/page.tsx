"use client"

import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/primitives/button"
import { Badge } from "@/components/primitives/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/primitives/tabs"
import { DataTable } from "@/components/data/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { apiFetch } from "@/lib/api"
import type { User } from "@/openapi/openapi-types"
import { UserActions } from "./user-actions"
import { useEffect, useState } from "react"

export default function RBACPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRBACData() {
      try {
        const [usersData, rolesData] = await Promise.all([apiFetch<User[]>("/users"), apiFetch<string[]>("/roles")])
        setUsers(usersData)
        setRoles(rolesData)
      } catch (error) {
        console.error("[v0] Failed to fetch RBAC data:", error)
        setUsers([])
        setRoles([])
      } finally {
        setLoading(false)
      }
    }
    fetchRBACData()
  }, [])

  if (loading) {
    return (
      <>
        <Topbar title="Users & Roles" breadcrumbs={[{ label: "RBAC" }]} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Loading RBAC data...</div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title="Users & Roles" breadcrumbs={[{ label: "RBAC" }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Manage user access and permissions</p>
                  <Button>Invite User</Button>
                </div>

                <DataTable
                  data={users}
                  columns={[
                    {
                      key: "email",
                      label: "Email",
                    },
                    {
                      key: "role",
                      label: "Role",
                      render: (user) => (
                        <Badge
                          variant={user.role === "admin" ? "success" : user.role === "operator" ? "warning" : "neutral"}
                        >
                          {user.role}
                        </Badge>
                      ),
                    },
                    {
                      key: "actions",
                      label: "Actions",
                      render: (user) => <UserActions user={user} />,
                    },
                  ]}
                  emptyMessage="No users found. Invite your first user to get started."
                />
              </div>
            </TabsContent>

            <TabsContent value="roles">
              <Card>
                <CardHeader>
                  <CardTitle>Available Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  {roles.length > 0 ? (
                    <div className="space-y-2">
                      {roles.map((role) => (
                        <div key={role} className="flex items-center justify-between rounded-lg border p-3">
                          <span className="font-medium">{role}</span>
                          <Badge variant="neutral">{role}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No roles available</p>
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
