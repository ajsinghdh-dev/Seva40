"use client";

import { useState } from "react";
import { ArrowRight, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { Logo } from "./ui";
import { googleSignIn } from "@/lib/auth";

type Destination = "student" | "committee";

export default function AuthGate({
  problem,
  retry,
}: {
  problem: string;
  retry: () => void;
}) {
  const [destination, setDestination] = useState<Destination>("student");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const connect = async () => {
    setBusy(true);
    setError("");
    try {
      await googleSignIn(destination);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const isStudent = destination === "student";

  return (
    <main className="auth-page auth-reference-page">
      <section className="auth-reference-shell" aria-labelledby="auth-title">
        <div className="auth-art-panel" aria-hidden="true">
          <div className="auth-art-brand"><Logo /></div>
          <div className="art-ribbon ribbon-one" />
          <div className="art-ribbon ribbon-two" />
          <div className="art-ribbon ribbon-three" />
          <div className="art-ribbon ribbon-four" />
          <div className="art-ribbon ribbon-five" />
          <div className="art-orb orb-one" />
          <div className="art-orb orb-two" />
          <div className="art-orb orb-three" />
          <div className="art-statement">
            <strong>Small acts.<br />Lasting impact.</strong>
            <p>Give your time. Record your service. Reach 40 hours.</p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-content">
            <div className="auth-mark"><ShieldCheck size={25} /></div>
            <h1 id="auth-title">Your community is waiting.</h1>
            <p className="auth-subtitle">Sign in to continue your seva.</p>

            <div className="auth-role-switch" role="tablist" aria-label="Choose your workspace">
              <button
                type="button"
                role="tab"
                aria-selected={isStudent}
                className={isStudent ? "active" : ""}
                onClick={() => setDestination("student")}
              >
                <GraduationCap size={16} /> Student
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isStudent}
                className={!isStudent ? "active" : ""}
                onClick={() => setDestination("committee")}
              >
                <Users size={16} /> Committee
              </button>
            </div>

            <div className="auth-role-summary">
              <span className="auth-summary-icon">
                {isStudent ? <GraduationCap size={20} /> : <ShieldCheck size={20} />}
              </span>
              <div>
                <strong>{isStudent ? "Student workspace" : "Committee workspace"}</strong>
                <p>
                  {isStudent
                    ? "Find opportunities, submit evidence and build your verified 40-hour logbook."
                    : "Publish opportunities, review evidence and verify student service hours."}
                </p>
              </div>
            </div>

            <div className="auth-divider"><span>CONTINUE SECURELY</span></div>

            <button
              type="button"
              className="auth-google-button"
              disabled={busy || !!problem}
              onClick={connect}
            >
              <span className="google-gmark" aria-hidden="true">G</span>
              <span>{busy ? "Connecting…" : "Sign in with Google"}</span>
              <ArrowRight size={17} />
            </button>

            {(error || problem) && (
              <div className="auth-error" role="alert">{error || problem}</div>
            )}
            {problem && (
              <button type="button" className="auth-retry" onClick={retry}>Try again</button>
            )}

            <p className="auth-privacy">
              Google protects your sign-in. Evidence stays private until you submit it for committee review.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
