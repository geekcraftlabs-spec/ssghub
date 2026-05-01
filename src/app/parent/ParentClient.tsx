"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";

type Report = {
  id: string;
  title: string;
  fileUrl: string;
  term?: string;
  uploadedAt: string;
};

type BehaviorReport = {
  id: string;
  date: string;
  description: string;
  severity?: "Positive" | "Minor" | "Major";
};

type InitialSession = {
  user?: {
    id?: string;
    email?: string;
    fullName?: string;
    grade?: string;
    role?: string;
  };
} | null;

export default function ParentClient({
  initialSession,
}: {
  initialSession: InitialSession;
}) {
  const { data: session, status } = useSession();

  const [reports, setReports] = useState<Report[]>([]);
  const [behaviorReports, setBehaviorReports] = useState<BehaviorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [reportsRes, behaviorRes] = await Promise.all([
        fetch("/api/student/reports"),
        fetch("/api/student/behavior"),
      ]);

      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(Array.isArray(data) ? data : []);
      }
      if (behaviorRes.ok) {
        const data = await behaviorRes.json();
        setBehaviorReports(Array.isArray(data) ? data : []);
      }
    } catch (err: unknown) {
      console.error("Fetch error:", err);
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAllData();
    }
  }, [status, fetchAllData]);

  const currentSession = session || initialSession;
  const studentName = currentSession?.user?.fullName || 
                      currentSession?.user?.email?.split("@")[0] || 
                      "Student";

  if (loading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading parent view...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header - Parent branding */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Parent Portal</h1>
            <p className="text-muted-foreground text-lg mt-1">
              Welcome, Parent of <span className="font-semibold text-foreground">{studentName}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              You are viewing your child&apos;s academic progress and reports
            </p>
          </div>

          <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/" })}>
            Logout
          </Button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <Card className="shadow-sm">
          <CardHeader className="pb-8">
            <CardTitle>{studentName}&apos;s Academic Information</CardTitle>
          </CardHeader>

          <CardContent className="p-5 md:p-8">
            <Tabs defaultValue="reports" className="w-full">
              {/* Generous mobile spacing for 2 tabs */}
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-20 md:mb-10 gap-4 p-4 bg-muted/50 rounded-3xl">
                <TabsTrigger 
                  value="reports" 
                  className="text-base py-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >
                  Report Cards
                </TabsTrigger>
                <TabsTrigger 
                  value="behavior" 
                  className="text-base py-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >
                  Behavior Report
                </TabsTrigger>
              </TabsList>

              <div className="pt-10 md:pt-4">
                <TabsContent value="reports" className="mt-16 md:mt-8">
                  <h3 className="text-xl mb-8">Report Cards</h3>
                  {reports.length > 0 ? (
                    <div className="space-y-5">
                      {reports.map((report) => (
                        <a 
                          key={report.id} 
                          href={report.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-5 border rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          📄 <span className="font-medium">{report.title}</span>
                          {report.term && <span className="text-sm text-muted-foreground ml-auto">({report.term})</span>}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-24 text-muted-foreground border border-dashed rounded-2xl">
                      No report cards uploaded yet.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="behavior" className="mt-16 md:mt-8">
                  <h3 className="text-xl mb-8">Behavior Report</h3>
                  {behaviorReports.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {behaviorReports.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left">
                            {item.date} — {item.severity || "General"}
                          </AccordionTrigger>
                          <AccordionContent className="pt-4 text-[15px]">{item.description}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-24 text-muted-foreground border border-dashed rounded-2xl">
                      No behavior reports yet.
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}