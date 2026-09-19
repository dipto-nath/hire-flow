import { unstable_noStore } from "next/cache";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  unstable_noStore();

  return (
    <div className="relative min-h-screen w-full">
      <LoginForm />
    </div>
  );
}
