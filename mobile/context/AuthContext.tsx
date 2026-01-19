import { createContext, useContext, type PropsWithChildren } from "react";
import { useStorageState } from "@/hooks/useStorageState";
import { authService } from "@/services/auth.service";
import { User, LoginCredentials, RegisterCredentials } from "@/types/auth";

interface AuthContextType {
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: RegisterCredentials) => Promise<void>;
  signOut: () => void;
  session: string | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useSession() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState("session");
  const [[, userJson], setUserJson] = useStorageState("user");

  const user: User | null = userJson ? JSON.parse(userJson) : null;

  const signIn = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setSession(response.data.token.token);
    setUserJson(JSON.stringify(response.data.user));
  };

  const signUp = async (credentials: RegisterCredentials) => {
    // Registrar usuario
    await authService.register(credentials);
    // Después del registro, hacer login automático
    await signIn({
      email: credentials.email,
      password: credentials.password,
    });
  };

  const signOut = () => {
    setSession(null);
    setUserJson(null);
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signUp,
        signOut,
        session,
        user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
