import { useState } from "react";
import { flushSync } from "react-dom";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/auth/AuthLayout";
import PasswordInput from "../../components/auth/PasswordInput";
import RequiredMark from "../../components/auth/RequiredMark";
import {
  fieldErrorClass,
  inputClass,
  labelClass,
  linkClass,
  primaryButtonClass,
} from "../../components/auth/styles";
import { EMAIL_PATTERN, toLocalMobile } from "../../utils/contactDetails";

// Fields in the order they appear, so we can focus the first one with an error
const FIELD_ORDER = ["name", "email", "mobile", "password", "confirmPassword"];

// Returns { fieldName: 'error message' } for anything invalid.
function validate({ name, email, mobile, password, confirmPassword }) {
  const errors = {};
  const localMobile = toLocalMobile(mobile);

  if (name.trim().length < 2) {
    errors.name = "Enter your full name.";
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Enter a valid email address, like juan@email.com.";
  }
  // Mobile number is optional, but if they type one it must be valid
  if (localMobile && (localMobile.length !== 10 || !localMobile.startsWith("9"))) {
    errors.mobile = "Enter your 10-digit mobile number, like 917 123 4567.";
  }
  if (
    password.length < 8 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    errors.password = "Use at least 8 characters with letters and numbers.";
  }
  if (confirmPassword === "") {
    errors.confirmPassword = "Re-enter your password.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Passwords don’t match.";
  }
  return errors;
}

// Error message under a field (renders nothing when there's no error)
function FieldError({ field, errors }) {
  if (!errors[field]) return null;
  return (
    <p className={fieldErrorClass} id={`register-${field}-error`}>
      {errors[field]}
    </p>
  );
}

export default function Register() {
  const { register, role } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (role) return <Navigate to={`/${role}`} replace />;

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    // Clear a field's error as soon as the user edits it
    if (errors[field])
      setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    // Render the errors right away so the field's error message is linked
    // before we focus it (screen readers then read the message aloud)
    flushSync(() => setErrors(found));
    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(`register-${firstInvalid}`)?.focus();
      return;
    }

    setError("");
    setLoading(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        // Saved like the mock data: 09171234567
        // Optional: left out (undefined) if blank, never sent as ''
        contactNumber: form.mobile.trim()
          ? `0${toLocalMobile(form.mobile)}`
          : undefined,
      });
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  // Props shared by each text field: error state + link to its message
  const fieldProps = (field) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `register-${field}-error` : undefined,
  });

  return (
    <AuthLayout
      title="Start saving the smart way."
      subtitle="Create your sinop account in a minute. All you need is your name and email."
    >
      <form
        className="flex w-full max-w-[400px] flex-col gap-5"
        onSubmit={handleSubmit}
        noValidate
      >
        <Link
          to="/login"
          className="-mb-1 inline-flex h-10 items-center gap-1 self-start rounded-full bg-ground pr-3.5 pl-2 text-sm font-bold text-ink hover:bg-mint-mid"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to log in
        </Link>

        <div>
          <h2 className="mb-1.5 text-[30px] font-extrabold tracking-[-0.8px]">
            Create your account
          </h2>
          <p className="text-[15px] text-muted">It only takes a minute.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="register-name" className={labelClass}>
            Full name <RequiredMark />
          </label>
          <input
            aria-required="true"
            id="register-name"
            autoComplete="name"
            placeholder="Juan Dela Cruz"
            value={form.name}
            onChange={update("name")}
            className={inputClass}
            {...fieldProps("name")}
          />
          <FieldError field="name" errors={errors} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="register-email" className={labelClass}>
            Email <RequiredMark />
          </label>
          <input
            aria-required="true"
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={form.email}
            onChange={update("email")}
            className={inputClass}
            {...fieldProps("email")}
          />
          <FieldError field="email" errors={errors} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="register-mobile" className={labelClass}>
            Mobile number{" "}
            <span className="font-normal text-muted">(optional)</span>
            <span className="sr-only">, Philippine number, +63</span>
          </label>
          <div className="flex gap-2">
            <span
              aria-hidden="true"
              className="flex h-13 items-center rounded-2xl border-[1.5px] border-line bg-ground px-3.5 text-[15px] font-bold"
            >
              +63
            </span>
            <input
              id="register-mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={16}
              placeholder="917 123 4567"
              value={form.mobile}
              onChange={update("mobile")}
              className={`${inputClass} flex-1`}
              {...fieldProps("mobile")}
            />
          </div>
          <FieldError field="mobile" errors={errors} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="register-password" className={labelClass}>
            Password <RequiredMark />
          </label>
          <PasswordInput
            required
            id="register-password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={form.password}
            onChange={update("password")}
            invalid={Boolean(errors.password)}
            describedBy="register-password-help"
          />
          {errors.password ? (
            <p className={fieldErrorClass} id="register-password-help">
              {errors.password}
            </p>
          ) : (
            <p className="text-xs text-muted" id="register-password-help">
              At least 8 characters, with letters and numbers.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="register-confirmPassword" className={labelClass}>
            Confirm password <RequiredMark />
          </label>
          <PasswordInput
            required
            id="register-confirmPassword"
            autoComplete="new-password"
            placeholder="Type it again"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            invalid={Boolean(errors.confirmPassword)}
            describedBy={
              errors.confirmPassword
                ? "register-confirmPassword-error"
                : undefined
            }
          />
          <FieldError field="confirmPassword" errors={errors} />
        </div>

        {error && (
          <p
            className="-mt-1.5 text-[13px] font-semibold text-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`${primaryButtonClass} cursor-pointer`}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className={linkClass}>
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
