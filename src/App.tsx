import { useState, useEffect } from "react";
import { SignIn } from "./components/SignIn";
import { AvailabilityView } from "./components/AvailabilityView";
import { ShareControls } from "./components/ShareControls";
import { getAvailability } from "./lib/calendar";
import { getNextBusinessDays } from "./lib/dates";
import { decodeAvailability } from "./lib/sharing";
import type { DayAvailability, SharedAvailabilityData } from "./lib/types";

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [availability, setAvailability] = useState<DayAvailability[] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharedData, setSharedData] = useState<SharedAvailabilityData | null>(
    null
  );

  // Check for shared availability URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");
    if (d) {
      const decoded = decodeAvailability(d);
      if (decoded) {
        setSharedData(decoded);
      } else {
        setError("Invalid or corrupted share link.");
      }
    }
  }, []);

  // Fetch user profile and calendar when access token is set
  useEffect(() => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    const fetchAll = async () => {
      // Fetch user name from Google
      const profileRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setUserName(profile.given_name || profile.name || "");
      }

      const businessDays = getNextBusinessDays(5);
      const avail = await getAvailability(accessToken, businessDays);
      setAvailability(avail);
    };

    fetchAll()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleToken = (token: string) => {
    if (!token) {
      setError("Sign-in failed. Calendar access is required.");
      return;
    }
    setError(null);
    setAccessToken(token);
  };

  // Shared view — no sign-in needed
  if (sharedData) {
    return (
      <div className="container">
        <AvailabilityView shared={sharedData} />
      </div>
    );
  }

  // Not signed in
  if (!accessToken) {
    return (
      <div className="container">
        <SignIn onToken={handleToken} error={error} />
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="container">
        <p className="loading">Fetching your calendar...</p>
      </div>
    );
  }

  // Error after sign-in
  if (error) {
    return (
      <div className="container">
        <p className="error">{error}</p>
        <button onClick={() => setAccessToken(null)} className="btn">
          Try Again
        </button>
      </div>
    );
  }

  // Availability loaded
  return (
    <div className="container">
      <AvailabilityView days={availability ?? undefined} />
      {availability && <ShareControls days={availability} name={userName} />}
    </div>
  );
}

export default App;
