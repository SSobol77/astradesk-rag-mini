interface JsonViewerProps {
  data: unknown
  className?: string
}

export function JsonViewer({ data, className }: JsonViewerProps) {
  return (
    <pre className={`rounded-lg bg-muted p-4 text-xs overflow-auto ${className || ""}`}>
      <code>{JSON.stringify(data, null, 2)}</code>
    </pre>
  )
}
