import { useState, useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import { GoogleAuth } from "../../../services/google-auth";
import { toast, Toaster } from "sonner";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);
  const hasProcessedCallback = useRef(false);

  const handleCallback = async (code: string) => {
    if (!isMountedRef.current || hasProcessedCallback.current) return;

    hasProcessedCallback.current = true;
    setIsLoading(true);

    try {
      await GoogleAuth.getTokensFromCode(code);

      if (isMountedRef.current) {
        toast.success("Successfully signed in!", {
          description: "Welcome back to DailyNote",
        });

        setTimeout(() => {
          if (isMountedRef.current) {
            onAuthSuccess();
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Auth callback error:", error);

      if (isMountedRef.current) {
        toast.error("Authentication failed. Please try again.", {
          description: "Unable to complete sign-in process",
        });
        setIsLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const authUrl = await GoogleAuth.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to get auth URL:", error);

      if (isMountedRef.current) {
        toast.error("Failed to start authentication. Please try again.", {
          description: "Unable to connect to Google",
        });
        setIsLoading(false);
      }
    }
  };

  // Effects
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      handleCallback(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        duration={3000}
        toastOptions={{
          style: {
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "16px",
          },
          className: "shadow-lg",
        }}
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <div className="text-center">
          {/* Logo */}
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <BookOpen className="w-12 h-12 text-blue-600" />
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-white mb-4">DailyNote</h1>
          <p className="text-xl text-blue-100 mb-12">
            Your thoughts, synced everywhere
          </p>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="cursor-pointer flex items-center gap-3 bg-white px-8 py-4 rounded-xl shadow-2xl hover:shadow-3xl transition-all mx-auto disabled:opacity-50 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:scale-102 duration-500 transition-all"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-6 h-6"
            />
            <span className="text-lg font-semibold text-gray-900">
              {isLoading ? "Signing in..." : "Sign in with Google"}
            </span>
          </button>

          {/* Info */}
          <p className="text-sm text-blue-200 mt-8">
            By signing in, you agree to sync your notes to Google Drive
          </p>
        </div>
      </div>
    </>
  );
}
