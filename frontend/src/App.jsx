import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";

import CodeBuilding from "./components/CodeBuilding";
import DependencyLine from "./components/DependencyLine";

function App() {
  const [data, setData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // --------------------------------------------------
  // Calculate 3D position of a file
  // --------------------------------------------------

  const getPosition = (file) => {
    const pathParts = file.path.split("\\");

    // Root-level files
    if (pathParts.length === 1) {
      const filesInRoot = data.files.filter(
        (item) => item.path.split("\\").length === 1
      );

      const fileIndex = filesInRoot.findIndex(
        (item) => item.path === file.path
      );

      return [
        (fileIndex % 3) * 4 - 4,
        0,
        Math.floor(fileIndex / 3) * 4,
      ];
    }

    // Files inside directories
    const directory = pathParts[0];

    const directoryIndex =
      data.directories.indexOf(directory);

    const districtX = directoryIndex * 10 + 12;
    const districtZ = 2;

    const filesInDirectory = data.files.filter(
      (item) =>
        item.path.split("\\")[0] === directory
    );

    const fileIndex = filesInDirectory.findIndex(
      (item) => item.path === file.path
    );

    return [
      districtX + (fileIndex % 3) * 4 - 4,
      0,
      districtZ +
        Math.floor(fileIndex / 3) * 4 -
        2,
    ];
  };

  // --------------------------------------------------
  // Calculate Git churn intensity
  // --------------------------------------------------

  const getChurnIntensity = (file) => {
    if (!data?.files?.length) {
      return 0;
    }

    const maxChanges = Math.max(
      ...data.files.map(
        (item) => item.git_metrics?.changes ?? 0
      )
    );

    if (maxChanges === 0) {
      return 0;
    }

    const changes =
      file.git_metrics?.changes ?? 0;

    return (
      Math.log2(changes + 1) /
      Math.log2(maxChanges + 1)
    );
  };

  // --------------------------------------------------
  // Load repository analysis
  // --------------------------------------------------

  useEffect(() => {
    fetch("http://127.0.0.1:8000/analyze?path=app")
      .then((response) => response.json())
      .then((result) => {
        console.log("Repository analysis:", result);
        setData(result);
      })
      .catch((error) => {
        console.error(
          "Failed to analyze repository:",
          error
        );
      });
  }, []);

  // --------------------------------------------------
  // Determine whether a file is related to the
  // currently selected file.
  // --------------------------------------------------

  const isRelatedFile = (file) => {
    if (!selectedFile) {
      return false;
    }

    // File imported by selected file
    const selectedDependsOn =
      selectedFile.dependencies.includes(file.path);

    // File that imports selected file
    const fileDependsOnSelected =
      file.dependencies.includes(selectedFile.path);

    return (
      selectedDependsOn ||
      fileDependsOnSelected
    );
  };

  // --------------------------------------------------
  // Check whether a dependency line is related to
  // the selected file.
  // --------------------------------------------------

  const isRelatedDependency = (
    sourceFile,
    targetFile
  ) => {
    if (!selectedFile) {
      return false;
    }

    return (
      sourceFile.path === selectedFile.path ||
      targetFile.path === selectedFile.path
    );
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{
          position: [16, 14, 18],
          fov: 60,
        }}
        onPointerMissed={() =>
          setSelectedFile(null)
        }
      >
        {/* --------------------------------------------------
            Lighting
        -------------------------------------------------- */}

        <ambientLight intensity={1} />

        <directionalLight
          position={[10, 15, 10]}
          intensity={2}
        />

        {/* --------------------------------------------------
            Dependency lines
        -------------------------------------------------- */}

        {data?.files.map((file) =>
          file.dependencies.map((dependency) => {
            const targetFile = data.files.find(
              (target) =>
                target.path === dependency
            );

            if (!targetFile) {
              return null;
            }

            const start = getPosition(file);
            const end = getPosition(targetFile);

            const startHeight = Math.max(
              Math.log2(file.lines + 1),
              1
            );

            const endHeight = Math.max(
              Math.log2(targetFile.lines + 1),
              1
            );

            const related = isRelatedDependency(
              file,
              targetFile
            );

            return (
              <DependencyLine
                key={`${file.path}-${dependency}`}
                start={[
                  start[0],
                  startHeight,
                  start[2],
                ]}
                end={[
                  end[0],
                  endHeight,
                  end[2],
                ]}
                highlighted={related}
              />
            );
          })
        )}

        {/* --------------------------------------------------
            Code buildings
        -------------------------------------------------- */}

        {data?.files.map((file) => (
          <CodeBuilding
            key={file.path}
            file={file}
            position={getPosition(file)}
            onSelect={setSelectedFile}
            churnIntensity={getChurnIntensity(file)}
            hotspotScore={file.hotspot_score}
            isSelected={
              selectedFile?.path === file.path
            }
            isRelated={isRelatedFile(file)}
          />
        ))}

        {/* ==================================================
            ROOT DISTRICT
        ================================================== */}

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-2, -0.05, 2]}
        >
          <planeGeometry args={[10, 7]} />

          <meshStandardMaterial color="#222222" />

          <Html
            position={[0, 0, 0]}
            center
            rotation={[Math.PI / 2, 0, 0]}
            distanceFactor={12}
          >
            <div
              style={{
                color: "white",
                background:
                  "rgba(0, 0, 0, 0.8)",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              ROOT
            </div>
          </Html>
        </mesh>

        {/* ==================================================
            SUBDIRECTORY DISTRICTS
        ================================================== */}

        {data?.directories.map(
          (directory, index) => {
            const metrics =
              data.directory_metrics?.[directory];

            return (
              <mesh
                key={directory}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[
                  index * 10 + 12,
                  -0.05,
                  2,
                ]}
              >
                <planeGeometry args={[10, 7]} />

                <meshStandardMaterial color="#222222" />

                <Html
                  position={[0, 0, 0]}
                  center
                  rotation={[Math.PI / 2, 0, 0]}
                  distanceFactor={12}
                >
                  <div
                    style={{
                      color: "white",
                      background:
                        "rgba(0, 0, 0, 0.8)",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                      lineHeight: "1.5",
                    }}
                  >
                    <div>
                      {directory.toUpperCase()}
                    </div>

                    {metrics && (
                      <>
                        <div>
                          Files: {metrics.files}
                        </div>

                        <div>
                          Lines: {metrics.lines}
                        </div>

                        <div>
                          Hotspot: {metrics.hotspot_score}
                        </div>
                      </>
                    )}
                  </div>
                </Html>
              </mesh>
            );
          }
        )}

        <OrbitControls />
      </Canvas>

      {/* ==================================================
          FILE INFORMATION PANEL
      ================================================== */}

      {selectedFile && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 280,
            padding: 20,
            background: "white",
            borderRadius: 10,
            boxShadow:
              "0 8px 30px rgba(0, 0, 0, 0.2)",
            fontFamily:
              "Arial, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                wordBreak: "break-word",
              }}
            >
              {selectedFile.path}
            </h2>

            <button
              onClick={() =>
                setSelectedFile(null)
              }
              style={{
                cursor: "pointer",
                border: "none",
                background: "transparent",
                fontSize: 20,
              }}
            >
              ×
            </button>
          </div>

          <p>
            <strong>Lines:</strong>{" "}
            {selectedFile.lines}
          </p>

          <p>
            <strong>Complexity:</strong>{" "}
            {selectedFile.complexity}
          </p>

          <p>
            <strong>Hotspot:</strong>{" "}
            {selectedFile.hotspot_score}
          </p>

          <p>
            <strong>Health:</strong>{" "}
            {selectedFile.health}
          </p>

          <div>
            <strong>Why was this classified this way?</strong>

            <ul>
              {selectedFile.health_reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>

          <p>
            <strong>Functions:</strong>{" "}
            {selectedFile.functions.length}
          </p>

          <p>
            <strong>Classes:</strong>{" "}
            {selectedFile.classes.length}
          </p>

          <p>
            <strong>Dependencies:</strong>{" "}
            {selectedFile.dependencies.length}
          </p>

          <h3>Git History</h3>

          <p>
            <strong>Commits:</strong>{" "}
            {selectedFile.git_metrics.commits}
          </p>

          <p>
            <strong>Insertions:</strong>{" "}
            {selectedFile.git_metrics.insertions}
          </p>

          <p>
            <strong>Deletions:</strong>{" "}
            {selectedFile.git_metrics.deletions}
          </p>

          <p>
            <strong>Total Changes:</strong>{" "}
            {selectedFile.git_metrics.changes}
          </p>

          <h3>Functions</h3>

          {selectedFile.functions.length === 0 ? (
            <p>No functions</p>
          ) : (
            <ul>
              {selectedFile.functions.map(
                (fn) => (
                  <li key={fn.name}>
                    {fn.name} — complexity{" "}
                    {fn.complexity}
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default App;