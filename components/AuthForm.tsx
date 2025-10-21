import React, { useState } from 'react';
import Spinner from './Spinner';

interface AuthFormProps {
  onLogin: (name: string, password: string) => Promise<void>;
  onRegister: (name: string, password: string) => Promise<void>;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onRegister }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      setError("El nombre de usuario y la contraseña no pueden estar vacíos.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (isLoginView) {
        await onLogin(name.trim(), password);
      } else {
        await onRegister(name.trim(), password);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
    setName('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400 mb-2">
          {isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          {isLoginView ? 'Introduce tus credenciales para entrar.' : 'Regístrate para participar o votar.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            aria-label="Nombre de usuario"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            aria-label="Contraseña"
            required
          />

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center disabled:bg-indigo-400"
          >
            {isLoading ? <Spinner /> : (isLoginView ? 'Entrar' : 'Registrar y Entrar')}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {isLoginView ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
          <button onClick={toggleView} className="ml-1 font-semibold text-indigo-600 hover:text-indigo-500">
            {isLoginView ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
