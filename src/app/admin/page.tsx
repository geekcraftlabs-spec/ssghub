"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type ApplicationWithSchool = {
  id: string;
  fullName: string;
  applicantEmail: string;
  grade: string;
  school: { name: string };
  status: string;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithSchool[]>([]);
  const [schoolName, setSchoolName] = useState<string>("Loading school...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Protect route
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.push("/login");
    }
  }, [session, status, router]);

  // Fetch applications + school name
  useEffect(() => {
    if (status !== "authenticated" || !session || session.user?.role !== "ADMIN") return;

    const fetchData = async () => {
      try {
        setError(null);

        // 1. Fetch pending applications
        const appsRes = await fetch("/api/admin/applications", { cache: "no-store" });
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData);
        }

        // 2. Fetch school name using schoolId
        const schoolId = session.user?.schoolId;
        console.log("🔍 Session schoolId:", schoolId);

        if (!schoolId) {
          setSchoolName("No school assigned");
          setLoading(false);
          return;
        }

        const schoolRes = await fetch(`/api/school/${schoolId}`);
        console.log("School API status:", schoolRes.status);

        if (schoolRes.ok) {
          const schoolData = await schoolRes.json();
          setSchoolName(schoolData.name || "Unnamed School");
        } else if (schoolRes.status === 404) {
          setSchoolName("School not found");
          setError(`School with ID "${schoolId}" was not found in the database`);
        } else {
          setSchoolName("Failed to load school");
          setError(`API returned status ${schoolRes.status}`);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setSchoolName("Error loading school");
        setError("Network or server error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status]);

  const approveApplication = async (applicationId: string) => {
    if (!confirm("Approve this student and send login details?")) return;

    const res = await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId }),
    });

    const result = await res.json();

    if (res.ok) {
      setApplications((prev) => prev.filter((app) => app.id !== applicationId));
      alert("✅ Student approved successfully! Welcome email sent.");
    } else {
      alert(`Failed to approve: ${result.error || 'Unknown error'}`);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Welcome, Admin of <span className="font-semibold text-foreground">{schoolName}</span>
            </p>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/" })}>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Applications ({applications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email (will receive login)</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.fullName}</TableCell>
                    <TableCell className="font-mono text-sm">{app.applicantEmail}</TableCell>
                    <TableCell>{app.grade}</TableCell>
                    <TableCell>{app.school.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">PENDING</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        onClick={() => approveApplication(app.id)}
                      >
                        Approve & Send Login
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {applications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No pending applications at the moment.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}