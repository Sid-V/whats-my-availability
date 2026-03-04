import { useGoogleLogin } from "@react-oauth/google";

interface SignInProps {
  onToken: (token: string, expiresIn: number) => void;
  error: string | null;
  loginHint?: string;
}

export function SignIn({ onToken, error, loginHint }: SignInProps) {
  const login = useGoogleLogin({
    onSuccess: (response) =>
      onToken(response.access_token, response.expires_in),
    onError: () =>
      onToken("", 0), // triggers error handling in App
    scope:
      "https://www.googleapis.com/auth/calendar.freebusy https://www.googleapis.com/auth/calendar.calendarlist.readonly",
    hint: loginHint,
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
