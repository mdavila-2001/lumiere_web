import * as React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';
import { ApiError } from '@/services/api';

export default function Login(): React.JSX.Element {
  const { login } = useAuth();

  // Once the session holds a user, route it to its role-based landing page
  // (Admin -> dashboard, Customer -> billboard) with the JWT already persisted.
  useAuthRedirect();

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth || 1280;
    const height = canvas.clientHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          vec3 color = vec3(0.06, 0.07, 0.1);
          float n = noise(uv + u_time * 0.05);
          float smoke = smoothstep(0.3, 0.7, sin(uv.x * 3.0 + u_time) * cos(uv.y * 2.0 + u_time * 0.5) * 0.5 + 0.5);
          vec3 gold = vec3(1.0, 0.84, 0.0);
          color = mix(color, gold * 0.15, smoke * (1.0 - uv.y));
          color += (noise(uv + u_time) - 0.5) * 0.02;
          gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compileShader = (type: number, src: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Shader linking error:', gl.getProgramInfoLog(prog));
      return;
    }

    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    const mouse = { x: width / 2, y: height / 2 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    globalThis.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;

    const syncSize = () => {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      syncSize();
    });
    resizeObserver.observe(canvas);

    const render = (t: number) => {
      syncSize();
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    return () => {
      globalThis.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await login(formData);
      // Redirection is handled reactively by useAuthRedirect once the
      // authenticated user lands in the global auth state.
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred during sign in.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 relative overflow-hidden font-sans w-full">
      <div className="fixed inset-0 w-screen h-screen z-0 pointer-events-none">
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>

      <div className="glass-panel rounded-xl p-8 shadow-2xl relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col gap-6">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-zinc-100 mb-1">Bienvenido de nuevo</h1>
            <p className="text-xs text-zinc-400">Inicia sesión para acceder a tu experiencia cinematográfica.</p>
          </div>

          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-lg p-3 font-medium text-left">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

            {/* Password Input */}
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>

            {/* Actions */}
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
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          {/* Footer Register Link */}
          <div className="text-center mt-2">
            <p className="text-xs text-zinc-400">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="text-amber-500 hover:text-amber-400 transition-colors font-semibold">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
