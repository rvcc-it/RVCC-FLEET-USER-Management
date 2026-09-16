import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createIncident } from "@/app/admin/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

async function action(formData: FormData) {
  "use server";
  const { incidentId } = await createIncident(formData);
  redirect(`/admin/incidents/${incidentId}`);
}

export default async function NewIncidentPage() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase.from("vehicle_portal_vehicles").select("id, code, name").order("code");

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold text-slate-900">New Incident</h1>
      <p className="text-sm text-slate-500">
        The driver will be automatically matched from vehicle usage sessions once you save.
      </p>

      <Card className="mt-4">
        <CardContent>
          <form action={action} className="space-y-4">
            <div>
              <Label htmlFor="vehicle_id">Vehicle</Label>
              <Select id="vehicle_id" name="vehicle_id" required defaultValue="">
                <option value="" disabled>
                  Select vehicle
                </option>
                {vehicles?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.code} — {v.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="incident_type">Incident type</Label>
                <Select id="incident_type" name="incident_type" defaultValue="TRAFFIC_FINE">
                  <option value="TRAFFIC_FINE">Traffic Fine</option>
                  <option value="ACCIDENT">Accident</option>
                  <option value="PARKING_FINE">Parking Fine</option>
                  <option value="SPEEDING">Speeding</option>
                  <option value="VEHICLE_DAMAGE">Vehicle Damage</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="incident_at">Incident date/time</Label>
                <Input id="incident_at" name="incident_at" type="datetime-local" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="reference_number">Reference number</Label>
                <Input id="reference_number" name="reference_number" />
              </div>
              <div>
                <Label htmlFor="fine_number">Fine number</Label>
                <Input id="fine_number" name="fine_number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" />
              </div>
              <div>
                <Label htmlFor="amount">Amount (SAR)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" />
            </div>
            <Button type="submit" variant="primary">
              Create incident
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
