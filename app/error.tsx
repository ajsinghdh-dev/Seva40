"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="loading-screen">
      <h1>Let’s get your workspace back.</h1>
      <p>
        Something interrupted this screen. Please try loading your workspace
        again.
      </p>
      <button className="orange-button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
