import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLoginMutation } from '../features/auth/authApiSlice';


const Login = () => {
  const [login, { isLoading, error }] = useLoginMutation();
  const [form, setForm] = useState({ email: '', password: '' });


  const onSubmit = async (event) => {
    event.preventDefault();
    await login(form);
  };
  

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-800">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Access your account.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />

          {error?.data?.message && (
            <p className="text-sm text-red-600">{error.data.message}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
          {/* {loading && <LoadingSpinner text="Authenticating" />} */}
        </form>

        
      </div>
    </div>
  );
};

export default Login;
