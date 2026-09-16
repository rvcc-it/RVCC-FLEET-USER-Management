import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold text-slate-900">Reports</h1>
      <p className="text-sm text-slate-500">Export data as CSV for further analysis in Excel.</p>

      <div className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Usage Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Every usage session: vehicle, employee, start/end time, status, and identification
              method.
            </p>
            <a
              href="/api/reports/vehicle-usage"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}
            >
              Download CSV
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Usage Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Per employee: number of trips, total usage hours, and vehicles used.
            </p>
            <a
              href="/api/reports/employee-usage"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}
            >
              Download CSV
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
