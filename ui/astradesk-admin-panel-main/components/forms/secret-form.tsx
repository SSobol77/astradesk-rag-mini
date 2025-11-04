"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/primitives/input"
import { Textarea } from "@/components/primitives/textarea"
import { Button } from "@/components/primitives/button"
import { Modal, ModalHeader, ModalTitle, ModalFooter } from "@/components/primitives/modal"
import { createSecret } from "@/lib/actions"
import { toast } from "@/hooks/use-toast"

interface SecretFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function SecretForm({ open, onClose, onSuccess }: SecretFormProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createSecret(formData)

    setLoading(false)

    if (result.success) {
      toast({
        title: "Secret created",
        description: "Successfully created secret",
      })
      onSuccess?.()
      onClose()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Create Secret</ModalTitle>
        </ModalHeader>
        <div className="flex flex-col gap-4 my-4">
          <Input name="name" label="Name" placeholder="API_KEY" required />
          <Input name="value" label="Value" type="password" placeholder="Enter secret value..." required />
          <Textarea name="description" label="Description" placeholder="Describe this secret..." />
        </div>
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Secret"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
