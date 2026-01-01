'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  };
  post: {
    id: string;
    name: string;
  };
}

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [page]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminReports(page, 20);
      setReports(data.items);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
    setResolving(reportId);
    try {
      await api.resolveAdminReport(reportId, status);
      toast({
        title: 'Success',
        description: status === 'RESOLVED' ? 'Report resolved' : 'Report dismissed',
      });
      loadReports();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-1">Review and manage user reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Pending Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">No pending reports</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 bg-card hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{report.reason}</span>
                      </div>
                      {report.details && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {report.details}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Reported by: <strong>{report.user.displayName}</strong>
                        </span>
                        <span>|</span>
                        <span>
                          Post: <strong>{report.post.name}</strong>
                        </span>
                        <span>|</span>
                        <span>
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolve(report.id, 'DISMISSED')}
                        disabled={resolving === report.id}
                      >
                        {resolving === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Dismiss
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResolve(report.id, 'RESOLVED')}
                        disabled={resolving === report.id}
                      >
                        {resolving === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Resolve
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
