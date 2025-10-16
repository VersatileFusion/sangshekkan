import * as React from "react";
import { useSession } from "@auth/create/react";

const useUser = () => {
  const { data: session, status } = useSession();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [mounted, setMounted] = React.useState(false);

  // Handle hydration
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUser = React.useCallback(async () => {
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/users/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        console.error("Failed to fetch user:", response.status);
        setError("Failed to load user data");
        setUser(null);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("User fetch timeout");
        setError("Request timeout");
      } else {
        console.error("Error fetching user:", error);
        setError("Network error");
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  React.useEffect(() => {
    if (!mounted) return; // Prevent hydration mismatch
    
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "authenticated" && session?.user) {
      fetchUser();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [status, session?.user, fetchUser, mounted]);

  const refetch = React.useCallback(() => {
    if (session?.user && mounted) {
      fetchUser();
    }
  }, [fetchUser, session?.user, mounted]);

  return {
    data: session?.user || null,
    user: user,
    loading: !mounted || status === "loading" || loading,
    error: error,
    refetch: refetch,
  };
};

export { useUser };
export default useUser;
