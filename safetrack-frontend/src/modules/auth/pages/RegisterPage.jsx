import AuthCard from "../components/AuthCard";
import RegisterForm from "../components/RegisterForm";
import Logo from "../components/Logo";



export default function RegisterPage() {
  return (
    <AuthCard>
      <div className="mb-6 flex justify-center">
        <Logo size="lg" />
      </div>
      <RegisterForm />
    </AuthCard>
  );
}
