import { getFindings } from '@/server/actions/findings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'Critical':
      return <Badge className="bg-red-600 hover:bg-red-700">Critical</Badge>
    case 'High':
      return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>
    case 'Medium':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950">Medium</Badge>
    case 'Low':
      return <Badge className="bg-blue-500 hover:bg-blue-600">Low</Badge>
    default:
      return <Badge>{severity}</Badge>
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Open':
      return <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">Open</Badge>
    case 'Resolved':
      return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Resolved</Badge>
    case 'Ignored':
      return <Badge variant="outline" className="text-muted-foreground">Ignored</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default async function FindingsDashboardPage() {
  const findings = await getFindings()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            Findings
          </h1>
          <p className="text-muted-foreground text-lg mt-1">Manage and track issues discovered during audits.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Findings</CardTitle>
          <CardDescription>All flagged issues across your organization's stores.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Flagged On</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {findings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No findings reported yet. Excellent!
                  </TableCell>
                </TableRow>
              ) : (
                findings.map((finding: any) => (
                  <TableRow key={finding.id}>
                    <TableCell className="font-medium max-w-[250px] truncate" title={finding.title}>
                      {finding.title}
                    </TableCell>
                    <TableCell>{finding.audit?.store?.name || 'Unknown Store'}</TableCell>
                    <TableCell>{getSeverityBadge(finding.severity)}</TableCell>
                    <TableCell>{getStatusBadge(finding.status)}</TableCell>
                    <TableCell>{new Date(finding.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/audits/${finding.audit_id}/summary`}>
                        <Button variant="ghost" size="sm">
                          View Audit
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
