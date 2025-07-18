// src/components/LoginPage.jsx
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const { loginWithGoogle } = useAuth();

    return (
        <div className="w-full h-screen flex items-center justify-center bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold mb-2">Please Log In</h1>
                <p className="text-gray-600 mb-6">
                    Sign in with your mimic Google account to continue.
                </p>
                <button
                    onClick={() => loginWithGoogle()}
                    className="px-4 py-2 border flex gap-2 border-slate-200 rounded-lg text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:shadow transition duration-150"
                >
                    <img className="w-6 h-6" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="google logo" />
                    <span>Login with Google</span>
                </button>
            </div>
        </div>
    )
}

export default LoginPage;