"use client"

import { useState } from "react"
import { Button } from "@/components/primitives/button"
import { Modal, ModalHeader, ModalTitle, ModalFooter } from "@/components/primitives/modal"
import { apiFetch } from "@/lib/api"
import type { User, UserRole } from "@/openapi/openapi-types"
import { useRouter } from "next/navigation"

interface UserActionsProps {
  user: User
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)

  const handleResetMFA = async () => {
    if (!confirm("Are you sure you want to reset MFA for this user?")) return

    setLoading("mfa")
    try {
      await apiFetch(`/users/${user.id}:reset-mfa`, { method: "POST" })
      alert("MFA reset successfully")
      router.refresh()
    } catch (error) {
      console.error("[v0] MFA reset failed:", error)
      alert("MFA reset failed")
    } finally {
      setLoading(null)
    }
  }

  const handleUpdateRole = async () => {
    setLoading("role")
    try {
      await apiFetch(`/users/${user.id}:role`, {
        method: "POST",
        body: JSON.stringify({ role: selectedRole }),
      })
      alert("Role updated successfully")
      setShowRoleModal(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Role update failed:", error)
      alert("Role update failed")
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setShowRoleModal(true)}>
          Update Role
        </Button>
        <Button variant="ghost" size="sm" onClick={handleResetMFA} disabled={loading !== null}>
          {loading === "mfa" ? "Resetting..." : "Reset MFA"}
        </Button>
      </div>

      <Modal open={showRoleModal} onClose={() => setShowRoleModal(false)}>
        <ModalHeader>
          <ModalTitle>Update User Role</ModalTitle>
        </ModalHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">User</label>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">New Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateRole} disabled={loading !== null}>
            {loading === "role" ? "Updating..." : "Update Role"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
