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

type Material = {
  id: string;
  title: string;
  fileUrl: string;
  subject: string;
  grade: string;
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

export default function StudentClient({
  initialSession,
  initialSchoolName,
}: {
  initialSession: InitialSession;
  initialSchoolName: string;
}) {
  const { data: session, status } = useSession();

  const [schoolName] = useState(initialSchoolName);
  const [reports, setReports] = useState<Report[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [behaviorReports, setBehaviorReports] = useState<BehaviorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [reportsRes, materialsRes, behaviorRes] = await Promise.all([
        fetch("/api/student/reports"),
        fetch("/api/student/materials"),
        fetch("/api/student/behavior"),
      ]);

      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(Array.isArray(data) ? data : []);
      }
      if (materialsRes.ok) {
        const data = await materialsRes.json();
        setMaterials(Array.isArray(data) ? data : []);
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
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Student Portal</h1>
            <p className="text-muted-foreground text-lg mt-1">
              Welcome to <span className="font-semibold text-foreground">{schoolName}</span>
            </p>
            <p className="text-sm text-muted-foreground">Hello, {studentName}</p>
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
            <CardTitle>{studentName}&apos;s Academic Dashboard</CardTitle>
          </CardHeader>

          <CardContent className="p-5 md:p-8">
            <Tabs defaultValue="reports" className="w-full">
              {/* MASSIVE spacing for mobile vertical tabs */}
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-32 md:mb-12 gap-4 p-5 bg-muted/50 rounded-3xl">
                <TabsTrigger 
                  value="reports" 
                  className="text-base py-7 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >
                  Report Cards
                </TabsTrigger>
                <TabsTrigger 
                  value="subjects" 
                  className="text-base py-7 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >
                  Subjects & Materials
                </TabsTrigger>
                <TabsTrigger 
                  value="behavior" 
                  className="text-base py-7 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >
                  Behavior Report
                </TabsTrigger>
              </TabsList>

              {/* Very strong content push on mobile */}
              <div className="pt-12 md:pt-4">
                <TabsContent value="reports" className="mt-20 md:mt-8">
                  <h3 className="text-xl mb-8">Your Report Cards</h3>
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
                    <div className="text-center py-28 text-muted-foreground border border-dashed rounded-2xl">
                      No report cards uploaded yet.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="subjects" className="mt-20 md:mt-8">
                  <h3 className="text-xl mb-8">Your Subjects & Materials</h3>
                  {materials.length > 0 ? (
                    <div className="space-y-8">
                      {materials.map((material) => (
                        <div key={material.id} className="p-7 border rounded-2xl">
                          <div className="font-medium text-lg">{material.title}</div>
                          <div className="text-sm text-muted-foreground mt-2">
                            {material.subject} • Grade {material.grade}
                          </div>
                          <a 
                            href={material.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline mt-6 inline-block text-base"
                          >
                            📝 Download PDF
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-28 text-muted-foreground border border-dashed rounded-2xl">
                      No learning materials available yet.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="behavior" className="mt-20 md:mt-8">
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
                    <div className="text-center py-28 text-muted-foreground border border-dashed rounded-2xl">
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