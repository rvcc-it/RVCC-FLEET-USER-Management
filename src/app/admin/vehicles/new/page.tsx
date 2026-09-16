import { redirect } from "next/navigation";
import { createVehicle } from "@/app/admin/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

async function action(formData: FormData) {
  "use server";
  await createVehicle(formData);
  redirect("/admin/vehicles");
}

export default function NewVehiclePage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold text-slate-900">Add Vehicle</h1>
      <Card className="mt-4">
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="code">Vehicle code</Label>
                <Input id="code" name="code" required placeholder="RVCC-006" />
              </div>
              <div>
                <Label htmlFor="plate_number">Plate number</Label>
                <Input id="plate_number" name="plate_number" required placeholder="ABC-1239" />
              </div>
            </div>
            <div>
              <Label htmlFor="name">Vehicle name</Label>
              <Input id="name" name="name" required placeholder="Toyota Hilux" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="make">Make</Label>
                <Input id="make" name="make" placeholder="Toyota" />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" placeholder="Hilux" />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input id="year" name="year" type="number" placeholder="2024" />
              </div>
            </div>
            <div>
              <Label htmlFor="vehicle_type">Vehicle type</Label>
              <Select id="vehicle_type" name="vehicle_type" defaultValue="">
                <option value="">Select type</option>
                <option value="Pickup">Pickup</option>
                <option value="SUV">SUV</option>
                <option value="Sedan">Sedan</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Bus">Bus</option>
                <option value="Other">Other</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Optional notes" />
            </div>
            <Button type="submit" variant="primary">
              Create vehicle
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
