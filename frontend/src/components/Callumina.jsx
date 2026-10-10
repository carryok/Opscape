import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

const SAMPLE_CODE = `def greet():
    print("Hello")
    return 1

greet()`;

export default function Callumina({
  selectedFile,
  onActiveStepChange,
}) {
  const [source, setSource] = useState(SAMPLE_CODE);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [loadedPath, setLoadedPath] = useState("");

  useEffect(() => {
    if (!selectedFile?.path) {
      return;
    }

    let cancelled = false;

    async function loadSource() {
      setSourceLoading(true);
      setError("");
      setSteps([]);
      setCurrentStep(0);

      try {
        const path = selectedFile.path.replace(/\\/g, "/");
        const response = await fetch(
          `${API_URL}/source?path=${encodeURIComponent(path)}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.detail || "Could not load this file.");
        }

        if (!cancelled) {
          setSource(result.source);
          setLoadedPath(result.path);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load the selected file.");
        }
      } finally {
        if (!cancelled) {
          setSourceLoading(false);
        }
      }
    }

    loadSource();

    return () => {
      cancelled = true;
    };
  }, [selectedFile?.path]);

  async function startTrace() {
    setLoading(true);
    setError("");
    setSteps([]);
    setCurrentStep(0);

    try {
      const response = await fetch(`${API_URL}/trace`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "The trace request failed.");
      }

      if (result.status !== "ok") {
        throw new Error(
          result.message || "Could not parse Python source."
        );
      }

      setSteps(result.steps);
    } catch (err) {
      setError(err.message || "Could not connect to Opscape API.");
    } finally {
      setLoading(false);
    }
  }

  const activeStep = steps[currentStep];

  useEffect(() => {
    if (!activeStep || !selectedFile?.path) {
        onActiveStepChange?.(null);
        return;
    }

    onActiveStepChange?.({
        path: selectedFile.path,
        line: activeStep.line,
        step: activeStep.step,
    });
  }, [activeStep, selectedFile?.path, onActiveStepChange]);

  return (
    <section
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        width: 340,
        maxHeight: "calc(100vh - 40px)",
        overflowY: "auto",
        padding: 18,
        boxSizing: "border-box",
        background: "#101827",
        color: "#e5edf8",
        border: "1px solid #334155",
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        fontFamily: "Arial, sans-serif",
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <h2 style={{ margin: "0 0 6px", fontSize: 21 }}>
          Callumina
        </h2>

        <span
          style={{
            fontSize: 10,
            color: "#93c5fd",
            border: "1px solid #3b82f6",
            borderRadius: 20,
            padding: "4px 7px",
          }}
        >
          STATIC OUTLINE
        </span>
      </div>

      <p style={{ color: "#94a3b8", fontSize: 13 }}>
        Explore function calls and control-flow statements in Python.
      </p>

      {loadedPath && (
        <p
          style={{
            color: "#7dd3fc",
            fontSize: 11,
            overflowWrap: "anywhere",
          }}
        >
          Selected file: {loadedPath}
        </p>
      )}

      <label
        htmlFor="callumina-source"
        style={{
          display: "block",
          marginBottom: 8,
          fontWeight: "bold",
        }}
      >
        Python source
      </label>

      <textarea
        id="callumina-source"
        value={source}
        onChange={(event) => {
          setSource(event.target.value);
          setSteps([]);
          setCurrentStep(0);
        }}
        spellCheck={false}
        style={{
          width: "100%",
          minHeight: 190,
          boxSizing: "border-box",
          resize: "vertical",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #475569",
          background: "#020617",
          color: "#dbeafe",
          fontFamily: "Consolas, monospace",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      />

      <button
        onClick={startTrace}
        disabled={loading || sourceLoading}
        style={{
          width: "100%",
          marginTop: 12,
          padding: 11,
          border: "none",
          borderRadius: 8,
          background:
            loading || sourceLoading ? "#475569" : "#2563eb",
          color: "white",
          fontWeight: "bold",
          cursor:
            loading || sourceLoading ? "wait" : "pointer",
        }}
      >
        {sourceLoading
          ? "Loading source..."
          : loading
            ? "Analyzing..."
            : "Start Trace"}
      </button>

      {error && (
        <p role="alert" style={{ color: "#fca5a5", fontSize: 13 }}>
          {error}
        </p>
      )}

      <hr style={{ borderColor: "#334155", margin: "18px 0" }} />

      <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>
        Execution steps
      </h3>

      {steps.length === 0 && !error && (
        <p style={{ color: "#94a3b8", fontSize: 13 }}>
          {sourceLoading
            ? "Loading the selected file..."
            : "Run a trace to explore the steps."}
        </p>
      )}

      {activeStep && (
        <div
          style={{
            padding: 12,
            background: "#1e293b",
            borderRadius: 8,
            borderLeft: "3px solid #38bdf8",
          }}
        >
          <div style={{ color: "#7dd3fc", fontSize: 12 }}>
            Step {currentStep + 1} of {steps.length}
          </div>

          <h4 style={{ margin: "8px 0" }}>
            {activeStep.event.replaceAll("_", " ")}
          </h4>

          <p style={{ fontSize: 13 }}>
            <strong>Line:</strong> {activeStep.line}
          </p>

          <p style={{ fontSize: 13, overflowWrap: "anywhere" }}>
            <strong>Function:</strong> {activeStep.function}
          </p>

          <p style={{ fontSize: 13, overflowWrap: "anywhere" }}>
            {activeStep.detail}
          </p>
        </div>
      )}

      {steps.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={() =>
                setCurrentStep((step) => Math.max(0, step - 1))
              }
              disabled={currentStep === 0}
              style={buttonStyle(currentStep === 0)}
            >
              Previous
            </button>

            <button
              onClick={() =>
                setCurrentStep((step) =>
                  Math.min(steps.length - 1, step + 1)
                )
              }
              disabled={currentStep === steps.length - 1}
              style={buttonStyle(currentStep === steps.length - 1)}
            >
              Next Step
            </button>
          </div>

          <div
            style={{
              height: 4,
              marginTop: 14,
              background: "#334155",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                height: "100%",
                background: "#38bdf8",
              }}
            />
          </div>
        </>
      )}

      <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 0 }}>
        This is a static outline. It does not execute the submitted code.
      </p>
    </section>
  );
}

function buttonStyle(disabled) {
  return {
    flex: 1,
    padding: 9,
    border: "1px solid #475569",
    borderRadius: 7,
    background: disabled ? "#1e293b" : "#334155",
    color: disabled ? "#64748b" : "#f8fafc",
    cursor: disabled ? "not-allowed" : "pointer",
  };
}