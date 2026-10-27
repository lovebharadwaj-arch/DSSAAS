import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../component/common/Button";
import Input from "../component/common/Input";
import { signupUser } from "../service/authService";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    cnf_password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.cnf_password) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const result = await signupUser({
        name: form.username,
        email: form.email,
        password: form.password,
      });

      console.log("Signup successful:", result.message);

      navigate("/home");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Signup failed");
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
              Create account
            </p>

            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Sign up
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create your account and start your journey with us.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5">
              <Input
                label="User name"
                id="username"
                name="username"
                type="text"
                placeholder="Enter your name"
                required={true}
                value={form.username}
                onChange={handleChange}
              />
            </div>

            <div className="mb-5">
              <Input
                label="Email"
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required={true}
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="mb-5">
              <Input
                label="Password"
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required={true}
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div className="mb-6">
              <Input
                label="Confirm password"
                id="cnf_password"
                name="cnf_password"
                type="password"
                placeholder="Confirm your password"
                required={true}
                value={form.cnf_password}
                onChange={handleChange}
              />
            </div>

            {error && (
              <p className="mb-4 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </Button>

            <p className="mt-6 text-center text-sm text-slate-500">
              Have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-emerald-700 hover:text-emerald-800">
                Login
              </Link>
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
            Sign up and start shopping with confidence.
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

export default Signup;
