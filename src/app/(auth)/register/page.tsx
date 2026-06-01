import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-amber-800">Créer un compte</h1>
          <p className="text-gray-500 text-sm mt-1">
            Rejoignez la plateforme de gestion de brocante
          </p>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
