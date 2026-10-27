import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../component/common/Button";
import Checkbox from "../component/common/CheckBox";
import Input from "../component/common/Input";
import { useAuth } from "../context/authContext";
import { createOrganization, getMyOrganizations } from "../lib/organizationApi";
import { loginUser } from "../service/authService";
import type { LoginForm } from "../types";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, checked, type } = event.target;

    setForm((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginUser({
        email: form.email,
        password: form.password,
      });
      login(result.user, result.accessToken);
      sessionStorage.setItem("accessToken", result.accessToken);
      sessionStorage.setItem("user", JSON.stringify(result.user));

      const organizations = await getMyOrganizations(result.accessToken);

      let organizationId = organizations[0]?.id ?? null;

      if (!organizationId) {
        const createdOrganization = await createOrganization(
          result.accessToken,
          "My Workspace",
        );
        organizationId = createdOrganization.id;
      }

      if (!organizationId) {
        setError("Your account has no organization yet.");
        return;
      }

      sessionStorage.setItem("organizationId", organizationId);
      navigate("/home");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto my-10 flex min-h-screen w-[92%] max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.10)]">
      <section className="flex w-full items-center justify-center bg-slate-50 px-6 py-10 sm:px-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Welcome back
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Log in
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Login to your account and continue your journey.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <Input
              label="Email"
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              className="mb-5"
              value={form.email}
              onChange={handleChange}
            />
            <Input
              label="Password"
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              className="mb-5"
              value={form.password}
              onChange={handleChange}
            />

            <div className="mb-6 flex items-center justify-between gap-3">
              <Checkbox
                label="Remember me"
                name="remember"
                checked={Boolean(form.remember)}
                onChange={handleChange}
                value="true"
              />
              <a
                href="#"
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                Forgot password?
              </a>
            </div>

            {error ? (
              <p className="mb-4 text-sm text-red-600">{error}</p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </Button>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <a
                href="/signup"
                className="font-semibold text-emerald-700 hover:text-emerald-800">
                Create account
              </a>
            </p>
          </form>
        </div>
      </section>

      <section className="hidden w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-sky-700 px-10 text-white lg:flex">
        <div className="max-w-lg">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100">
            Welcome
          </p>
          <h1 className="text-5xl font-black leading-tight tracking-tight">
            Our site for
            <span className="mt-2 block text-emerald-100">
              shopping brands ✨
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-emerald-50">
            Welcome to a place where simple ideas become beautiful experiences.
            Login and discover what we have for you.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {["✨ Beautiful", "🚀 Brands", "💙 Simple"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
