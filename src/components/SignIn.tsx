import { useGoogleLogin } from "@react-oauth/google";

interface SignInProps {
  onToken: (token: string) => void;
  error: string | null;
}

export function SignIn({ onToken, error }: SignInProps) {
  const login = useGoogleLogin({
    onSuccess: (response) => onToken(response.access_token),
    onError: () =>
      onToken(""), // triggers error handling in App
    scope:
      "https://www.googleapis.com/auth/calendar.freebusy https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  });

  return (
    <div className="sign-in">
      <h1>What's My Availability</h1>
      <p>
        Check your Google Calendar availability for the next 5 business days and
        share it instantly.
      </p>
      <button onClick={() => login()} className="btn">
        Sign in with Google
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
