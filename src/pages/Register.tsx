import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';
import { ApiError } from '@/services/api';

interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

const MIN_PASSWORD_LENGTH = 6;

export default function Register(): React.JSX.Element {
  const navigate = useNavigate();
  const { register } = useAuth();

  
  useAuthRedirect();

  const [formData, setFormData] = React.useState<RegisterFormState>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState<boolean>(false);

  
  React.useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => navigate('/login'), 2000);
    return () => clearTimeout(timer);
  }, [isSuccess, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): string | null => {
    if (!formData.email.trim()) {
      return 'El correo electrónico es obligatorio.';
    }
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErrorMsg(null);

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: formData.email.trim(),
        password: formData.password,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.errors.length > 0 ? err.errors.join(', ') : err.message);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Ocurrió un error inesperado al crear la cuenta.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 relative overflow-hidden font-sans w-full">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="glass-panel rounded-xl p-8 shadow-2xl relative overflow-hidden z-10 w-full max-w-md">
        <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

        {isSuccess ? (
          
          <div className="relative z-10 flex flex-col items-center text-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined text-[28px]">check_circle</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-zinc-100">¡Cuenta creada con éxito!</h1>
              <p className="text-xs text-zinc-400">
                Te estamos redirigiendo para que inicies sesión...
              </p>
            </div>
            <Link
              to="/login"
              className="text-amber-500 hover:text-amber-400 transition-colors font-semibold text-sm"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        ) : (
          
          <div className="relative z-10 flex flex-col gap-6">
            <div className="text-left">
              <h1 className="text-2xl font-bold text-zinc-100 mb-1">Crea tu cuenta</h1>
              <p className="text-xs text-zinc-400">
                Regístrate para reservar tus funciones premium.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-lg p-3 font-medium text-left">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="floating-input w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3.5 text-zinc-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm peer placeholder-transparent outline-none"
                  placeholder="Correo electrónico"
                  required
                />
                <label
                  htmlFor="email"
                  className="floating-label absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 transition-all pointer-events-none origin-left"
                >
                  Correo electrónico
                </label>
              </div>

              
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="floating-input w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3.5 text-zinc-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm peer placeholder-transparent outline-none pr-10"
                  placeholder="Contraseña"
                  required
                />
                <label
                  htmlFor="password"
                  className="floating-label absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 transition-all pointer-events-none origin-left"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="floating-input w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3.5 text-zinc-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm peer placeholder-transparent outline-none"
                  placeholder="Confirmar contraseña"
                  required
                />
                <label
                  htmlFor="confirmPassword"
                  className="floating-label absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 transition-all pointer-events-none origin-left"
                >
                  Confirmar contraseña
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-500 text-zinc-950 font-bold py-3 rounded-lg hover:bg-amber-600 transition-all gold-glow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creando cuenta...
                  </>
                ) : (
                  'Registrarse'
                )}
              </button>
            </form>

            <div className="text-center mt-2">
              <p className="text-xs text-zinc-400">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="text-amber-500 hover:text-amber-400 transition-colors font-semibold">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
