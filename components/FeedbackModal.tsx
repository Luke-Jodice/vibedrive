"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface FeedbackPayload {
  title: string;
  body: string;
  labels: string[];
}

interface StatusState {
  message: string;
  variant: "idle" | "loading" | "ok" | "err";
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<StatusState>({ message: "", variant: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const closeModal = useCallback(() => {
    setStatus({ message: "", variant: "idle" });
    onClose();
    lastFocusRef.current?.focus();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      lastFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeModal]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("");
    setEmail("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: "Submitting...", variant: "loading" });
    setIsSubmitting(true);

    const payload: FeedbackPayload = {
      title,
      body: `**Type:** ${type}\n\n**From**\n${email}\n\n**Description:**\n${description}`,
      labels: [type],
    };

    try {
      const res = await fetch("https://github-issue-pusher.vercel.app/feedback/vibedrive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON Response:", text);
        throw new Error("Backend not active. Please ensure the feedback service is deployed.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server Error: ${res.status}`);

      setStatus({ message: "Your report has been submitted. Thank you!", variant: "ok" });
      resetForm();
      setTimeout(closeModal, 2500);
    } catch (err) {
      console.error("Feedback Submission Error:", err);
      setStatus({
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "err",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .fm-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          animation: fm-fade-in 0.15s ease;
        }

        @keyframes fm-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes fm-slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .fm-modal {
          background: #181818;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          width: 100%;
          max-width: 440px;
          margin: 1rem;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
          animation: fm-slide-up 0.2s ease;
          outline: none;
        }

        .fm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem 0 1.5rem;
        }

        .fm-title {
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .fm-close {
          background: none;
          border: none;
          color: #6a6a6a;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
          border-radius: 4px;
          transition: color 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
        }

        .fm-close:hover { color: #fff; }

        .fm-divider {
          height: 1px;
          background: #2a2a2a;
          margin: 1.25rem 0 0 0;
        }

        .fm-form {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .fm-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .fm-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .fm-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6a6a6a;
        }

        .fm-input,
        .fm-textarea,
        .fm-select {
          background: #242424;
          border: 1px solid #2e2e2e;
          border-radius: 6px;
          color: #fff;
          font-size: 0.875rem;
          padding: 0.6rem 0.75rem;
          outline: none;
          transition: border-color 0.15s ease, background 0.15s ease;
          width: 100%;
          font-family: inherit;
          box-sizing: border-box;
        }

        .fm-input::placeholder,
        .fm-textarea::placeholder {
          color: #444;
        }

        .fm-input:focus,
        .fm-textarea:focus,
        .fm-select:focus {
          border-color: #1DB954;
          background: #282828;
        }

        .fm-textarea {
          resize: vertical;
          min-height: 88px;
          line-height: 1.5;
        }

        .fm-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236a6a6a' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          padding-right: 2rem;
          cursor: pointer;
        }

        .fm-select option {
          background: #242424;
          color: #fff;
        }

        .fm-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 0.25rem;
        }

        .fm-status {
          font-size: 0.8rem;
          flex: 1;
          min-height: 1.2em;
          color: transparent;
          transition: color 0.2s ease;
        }

        .fm-status.ok  { color: #1DB954; }
        .fm-status.err { color: #ff4d4d; }
        .fm-status.loading { color: #6a6a6a; }

        .fm-submit {
          background: #1DB954;
          color: #000;
          border: none;
          border-radius: 20px;
          padding: 0.6rem 1.4rem;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .fm-submit:hover:not(:disabled) {
          background: #1ed760;
          transform: scale(1.02);
        }

        .fm-submit:active:not(:disabled) {
          transform: scale(0.98);
        }

        .fm-submit:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>

      <div
        className="fm-backdrop"
        aria-hidden={false}
        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div
          className="fm-modal"
          role="dialog"
          aria-modal={true}
          aria-labelledby="fm-title"
          tabIndex={-1}
          ref={modalRef}
        >
          <div className="fm-header">
            <h2 className="fm-title" id="fm-title">Feedback / Bug Report</h2>
            <button className="fm-close" aria-label="Close" onClick={closeModal}>✕</button>
          </div>
          <div className="fm-divider" />

          <form className="fm-form" onSubmit={handleSubmit}>
            <div className="fm-field">
              <label className="fm-label" htmlFor="fm-title-input">Title</label>
              <input
                className="fm-input"
                id="fm-title-input"
                type="text"
                required
                autoComplete="off"
                placeholder="Short summary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="fm-field">
              <label className="fm-label" htmlFor="fm-desc">Description</label>
              <textarea
                className="fm-textarea"
                id="fm-desc"
                required
                placeholder="Describe the issue or feedback in detail…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="fm-row">
              <div className="fm-field">
                <label className="fm-label" htmlFor="fm-type">Type</label>
                <select
                  className="fm-select"
                  id="fm-type"
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="" disabled>Choose…</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Product-Defect">Product Defect</option>
                </select>
              </div>

              <div className="fm-field">
                <label className="fm-label" htmlFor="fm-email">Email</label>
                <input
                  className="fm-input"
                  id="fm-email"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="fm-footer">
              <p
                className={`fm-status${status.variant !== "idle" ? ` ${status.variant}` : ""}`}
                role="status"
              >
                {status.message}
              </p>
              <button className="fm-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
