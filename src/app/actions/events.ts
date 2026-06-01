"use server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Types
export type EventFormState = {
  errors?: { name?: string[]; date?: string[]; location?: string[]; general?: string[] };
} | undefined;

const EventSchema = z.object({
  name: z.string().min(2, { error: "Nom requis (min 2 caractères)" }),
  date: z.string().min(1, { error: "Date requise" }),
  location: z.string().min(2, { error: "Lieu requis" }),
  description: z.string().optional(),
  choiceSupplement: z.coerce.number().min(0).default(5),
  onlinePaymentEnabled: z.coerce.boolean().default(true),
});

export async function createEventAction(state: EventFormState, formData: FormData): Promise<EventFormState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const validated = EventSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors };

  const event = await db.event.create({
    data: {
      name: validated.data.name,
      date: new Date(validated.data.date),
      location: validated.data.location,
      description: validated.data.description || null,
      choiceSupplement: validated.data.choiceSupplement,
      onlinePaymentEnabled: validated.data.onlinePaymentEnabled,
      status: "DRAFT",
    },
  });

  redirect(`/admin/events/${event.id}`);
}

export async function updateEventStatusAction(eventId: string, status: "DRAFT" | "OPEN" | "CLOSED") {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  await db.event.update({ where: { id: eventId }, data: { status } });
  revalidatePath(`/admin/events/${eventId}`);
}
