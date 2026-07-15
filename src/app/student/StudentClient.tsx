"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, BookOpen, FileText, AlertTriangle, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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

// Define grade levels for filtering
const GRADE_LEVELS = {
  PRIMARY: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7"],
  HIGH_SCHOOL: ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
};

const ALL_GRADES = [...GRADE_LEVELS.PRIMARY, ...GRADE_LEVELS.HIGH_SCHOOL];

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

  // Filter states
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Get unique subjects from materials
  const subjects = [...new Set(materials.map(m => m.subject))].sort();

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    // Level filter
    if (selectedLevel !== "all") {
      const isPrimary = GRADE_LEVELS.PRIMARY.includes(material.grade);
      const isHighSchool = GRADE_LEVELS.HIGH_SCHOOL.includes(material.grade);
      if (selectedLevel === "primary" && !isPrimary) return false;
      if (selectedLevel === "highschool" && !isHighSchool) return false;
    }

    // Grade filter
    if (selectedGrade !== "all" && material.grade !== selectedGrade) return false;

    // Subject filter
    if (selectedSubject !== "all" && material.subject !== selectedSubject) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return material.title.toLowerCase().includes(query) ||
             material.subject.toLowerCase().includes(query) ||
             material.grade.toLowerCase().includes(query);
    }

    return true;
  });

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
    if (status === "authenticated" && session?.user?.id) {
      fetchAllData();
    }
  }, [status, session?.user?.id, fetchAllData]);

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
            <Tabs defaultValue="subjects" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-32 md:mb-12 gap-4 p-5 bg-muted/50 rounded-3xl">
                <TabsTrigger 
                  value="subjects" 
                  className="text-base py-7 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  Subjects & Materials
                </TabsTrigger>
                <TabsTrigger 
                  value="reports" 
                  className="text-base py-7 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Report Cards
                </TabsTrigger>
                <TabsTrigger 
                  value="behavior" 
                  className="text-base py-7 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Behavior
                </TabsTrigger>
              </TabsList>

              <div className="pt-12 md:pt-4">
                {/* SUBJECTS & MATERIALS TAB */}
                <TabsContent value="subjects" className="mt-20 md:mt-8">
                  <h3 className="text-xl mb-6">Learning Materials</h3>

                  {/* Filter Bar */}
                  <div className="bg-gray-50 p-4 rounded-xl mb-8 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Level</label>
                        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Levels" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="primary">Primary School</SelectItem>
                            <SelectItem value="highschool">High School</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Grade</label>
                        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Grades" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Grades</SelectItem>
                            {ALL_GRADES.map(grade => (
                              <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Subject</label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Subjects" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Subjects</SelectItem>
                            {subjects.map(subject => (
                              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Search</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search materials..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results count */}
                  <p className="text-sm text-muted-foreground mb-4">
                    Showing {filteredMaterials.length} of {materials.length} materials
                  </p>

                  {filteredMaterials.length > 0 ? (
                    <div className="space-y-4">
                      {filteredMaterials.map((material) => (
                        <div key={material.id} className="p-5 border rounded-2xl hover:shadow-md transition">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium text-lg">{material.title}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {material.subject} • {material.grade}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Uploaded: {new Date(material.uploadedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <a 
                              href={material.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline inline-block text-sm whitespace-nowrap ml-4"
                            >
                              📄 Open PDF
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 text-muted-foreground border border-dashed rounded-2xl">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      No learning materials match your filters.
                    </div>
                  )}
                </TabsContent>

                {/* REPORT CARDS TAB */}
                <TabsContent value="reports" className="mt-20 md:mt-8">
                  <h3 className="text-xl mb-8">Your Report Cards</h3>
                  {reports.length > 0 ? (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <a 
                          key={report.id} 
                          href={report.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-5 border rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <FileText className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">{report.title}</span>
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

                {/* BEHAVIOR TAB */}
                <TabsContent value="behavior" className="mt-20 md:mt-8">
                  <h3 className="text-xl mb-8">Behavior Reports</h3>
                  {behaviorReports.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {behaviorReports.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left">
                            {new Date(item.date).toLocaleDateString()} — {item.severity || "General"}
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