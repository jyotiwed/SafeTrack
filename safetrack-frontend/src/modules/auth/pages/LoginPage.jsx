// LoginPage.jsx or Login.jsx
import AuthCard from "../components/AuthCard";
import LoginForm from "../components/LoginForm";
import Logo from "../components/Logo";

export default function LoginPage() {
  return (
    <AuthCard>
      <div className="mb-6 flex justify-center">
        <Logo size="lg" />
      </div>
      <LoginForm />
    </AuthCard>
  );
}
