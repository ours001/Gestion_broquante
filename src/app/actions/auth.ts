"use server";

import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";

// Types for form state
export type AuthFormState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    general?: string[];
  };
  success?: boolean;
} | undefined;

// Register schema
const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, { error: "Le nom doit contenir au moins 2 caractères" })
      .trim(),
    email: z.email({ error: "Adresse email invalide" }).trim(),
    password: z
      .string()
      .min(8, { error: "Le mot de passe doit contenir au moins 8 caractères" })
      .trim(),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

// Login schema
const LoginSchema = z.object({
  email: z.email({ error: "Adresse email invalide" }).trim(),
  password: z.string().min(1, { error: "Mot de passe requis" }),
});

export async function registerAction(
  state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, password } = validated.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["Cette adresse email est déjà utilisée"] } };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.create({ data: { name, email, passwordHash, role: "EXPOSANT" } });

  // Sign in immediately after registration
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        errors: {
          general: [
            "Inscription réussie mais connexion échouée. Veuillez vous connecter.",
          ],
        },
      };
    }
    throw error; // re-throw redirect
  }
}

export async function loginAction(
  state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { errors: { general: ["Email ou mot de passe incorrect"] } };
    }
    throw error;
  }
}
