import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-amber-800">Se connecter</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez vos réservations de brocante
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
