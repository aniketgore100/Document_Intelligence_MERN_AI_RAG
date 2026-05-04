import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, register } from '../features/auth/authSlice';

const Register = () => {

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });


  const onSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearAuthError());
    await dispatch(register(form));
  };

  const ROLES = {
    1 : "OrgAdmin",
    2 : "DeptAdmin",
    3 : "User"
  }


  // if creating the user then, check for department to which department he needs to assign
  // if creating the department admin, check the organization, under which organization this department needs to assign,
  // create organization for selection if there is no one present, 
  // 

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-800">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Create your account to continue.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Full name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
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
            minLength={6}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-slate-800 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
