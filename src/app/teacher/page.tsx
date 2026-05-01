"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, FileText, AlertTriangle, Upload, BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const COMMON_SUBJECTS = [
  "Mathematics", "English", "Shona", "Science", "History", "Geography",
  "Physics", "Chemistry", "Biology", "Commerce", "Accounting", "Economics",
  "Literature", "Religious Studies"
];

type Student = {
  id: string;
  fullName: string;
  grade: string;
};

export default function TeacherPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [schoolName, setSchoolName] = useState<string>("Loading school...");
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [grades, setGrades] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const [materialGrade, setMaterialGrade] = useState<string>("");
  const [materialSubject, setMaterialSubject] = useState<string>("");
  const [materialTitle, setMaterialTitle] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [reportFile, setReportFile] = useState<File | null>(null);

 useEffect(() => {
  if (status === "loading") return;

  const user = session?.user;

  if (status === "unauthenticated" || !user?.schoolId || user.role !== "TEACHER") {
    router.push("/login");
    return;
  }

  const loadTeacherData = async () => {
    try {
      setLoadingSchool(true);

      const schoolRes = await fetch(`/api/school/${user!.schoolId}`);
      if (schoolRes.ok) {
        const schoolData = await schoolRes.json();
        setSchoolName(schoolData.name || "Your School");
      }

      const studentsRes = await fetch(`/api/teacher/students?schoolId=${user!.schoolId}`);
      if (studentsRes.ok) {
        const realStudents: Student[] = await studentsRes.json();
        setStudents(realStudents);

        const uniqueGrades = [...new Set(realStudents.map((s) => s.grade))].sort();
        setGrades(uniqueGrades);

        if (uniqueGrades.length > 0) {
          setSelectedGrade(uniqueGrades[0]);
          setMaterialGrade(uniqueGrades[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load teacher data:", error);
      setSchoolName("Error loading school");
    } finally {
      setLoadingSchool(false);
    }
  };

  loadTeacherData();
}, [status, session, router]);

  const filteredStudents = students.filter((s) => s.grade === selectedGrade);
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // ===================== UPLOAD HANDLERS =====================

const handleReportUpload = async () => {
  if (!reportFile || !selectedStudentId) {
    alert("Please select a student and a PDF file");
    return;
  }

  setUploading(true);
  const formData = new FormData();
  formData.append("file", reportFile);
  formData.append("studentId", selectedStudentId);
  formData.append("term", "Term 1");
  formData.append("year", new Date().getFullYear().toString());
  formData.append("title", `Report Card - ${new Date().toLocaleDateString()}`);

  try {
    const res = await fetch("/api/teacher/upload-report", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert(`✅ Report Card uploaded successfully`);
      setReportFile(null);
    } else {
      const errorData = await res.json().catch(() => ({}));
      alert(`Upload failed: ${errorData.error || "Unknown error"}`);
    }
  } catch {
    alert("Upload failed. Please check your connection.");
  } finally {
    setUploading(false);
  }
};

  const handleBehaviorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert("Please select a student first");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const description = formData.get("description") as string;
    const severity = formData.get("severity") as string;

    try {
      const res = await fetch("/api/teacher/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          studentId: selectedStudentId, 
          date, 
          description, 
          severity 
        }),
      });

      if (res.ok) {
        alert(`✅ Behavior report saved for ${selectedStudent?.fullName}`);
        (e.target as HTMLFormElement).reset();
      } else {
        alert("Failed to save behavior report");
      }
    } catch {
      alert("Failed to save behavior report");
    }
  };

  const handleMaterialUpload = async () => {
    if (!materialGrade || !materialSubject || !materialTitle) {
      alert("Please fill Grade, Subject and Title");
      return;
    }

    const fileInput = document.getElementById("materialFile") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      alert("Please select a PDF file");
      return;
    }

   setUploading(true);
const formData = new FormData();
formData.append("file", file);
formData.append("grade", materialGrade);
formData.append("subject", materialSubject);
formData.append("title", materialTitle);

    try {
      const res = await fetch("/api/teacher/upload-material", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert(`✅ Material uploaded for Grade ${materialGrade} - ${materialSubject}`);
        fileInput.value = "";
        setMaterialTitle("");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Upload failed: ${errorData.error || "Unknown error"}`);
      }
    } catch {
      alert("Upload failed. Please check your connection.");
    } finally {
      setUploading(false);
    }
  };

  if (status === "loading" || loadingSchool) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // safe session.user access
  const teacherName = session?.user?.fullName || "Educator";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Teacher Portal</h1>
            <p className="text-muted-foreground text-lg mt-1">
              Welcome, Educator of <span className="font-semibold text-foreground">{schoolName}</span>
            </p>
            <p className="text-sm text-muted-foreground">Hello, {teacherName}</p>
          </div>

          <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/" })}>
            Logout
          </Button>
        </div>

        {/* Grade → Student Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              Grade → Student Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex flex-wrap gap-6">
              <div className="flex-1 min-w-56">
                <Label className="text-sm font-medium mb-2 block">Select Grade</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-56">
                <Label className="text-sm font-medium mb-2 block">Select Student</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose student" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedStudent && (
              <div className="pt-6 border-t">
                <p className="mb-6 text-sm text-muted-foreground">
                  Currently working with: <span className="font-semibold text-foreground">{selectedStudent.fullName}</span>
                </p>

                <Tabs defaultValue="reports" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="reports" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Report Cards
                    </TabsTrigger>
                    <TabsTrigger value="behavior" className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Behavior
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="reports" className="mt-8">
                    <div className="p-6 border rounded-lg">
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Upload className="h-5 w-5" /> Upload Report Card (PDF)
                      </h3>
                      <Input 
                      type="file" 
                      accept=".pdf" 
                      onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                      disabled={uploading}
                      />
                  <Button onClick={handleReportUpload} className="mt-4 w-full" disabled={uploading}>
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Report"}
                  </Button>
                      <p className="text-xs text-muted-foreground mt-3">
                        This will appear in both student and parent portals.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="behavior" className="mt-8">
                    <div className="p-6 border rounded-lg">
                      <h3 className="text-xl font-semibold mb-4">Add Behavior Report</h3>
                      <form onSubmit={handleBehaviorSubmit} className="space-y-4">
                        <Input type="date" name="date" required />
                        <Textarea 
                          name="description"
                          placeholder="Describe the behavior, conduct, or incident..." 
                          className="min-h-32"
                          required 
                        />
                        <Select name="severity">
                          <SelectTrigger>
                            <SelectValue placeholder="Severity Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Positive">Positive</SelectItem>
                            <SelectItem value="Minor">Minor Concern</SelectItem>
                            <SelectItem value="Major">Major Concern</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="submit" className="w-full" disabled={uploading}>
                          Save Behavior Entry
                        </Button>
                      </form>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grade-wide Materials Upload */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BookOpen className="h-6 w-6" />
              Upload Learning Materials for Entire Grade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">Grade</Label>
                <Select value={materialGrade} onValueChange={setMaterialGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Subject</Label>
                <Select value={materialSubject} onValueChange={setMaterialSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Title</Label>
                <Input
                  placeholder="e.g. Algebra Notes - Week 5"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">PDF File</Label>
              <Input id="materialFile" type="file" accept=".pdf" />
            </div>

            <Button onClick={handleMaterialUpload} className="w-full" disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Material to Grade"}
            </Button>

            <p className="text-xs text-muted-foreground">
              This material will be visible to all students in the selected grade and subject.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}