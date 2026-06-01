import { CreateEventForm } from "@/components/admin/create-event-form";

export default function NewEventPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-amber-800 mb-6">Nouvel événement</h1>
      <CreateEventForm />
    </main>
  );
}
