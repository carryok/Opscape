import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import CodeBuilding from "./components/CodeBuilding";
import DependencyLine from "./components/DependencyLine";

function App() {
  const [data, setData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const getPosition = (index) => [
  (index % 3) * 4,
  0,
  Math.floor(index / 3) * 4,
  ];


  useEffect(() => {
    fetch("http://127.0.0.1:8000/analyze?path=app")
      .then((response) => response.json())
      .then((result) => setData(result));
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{ position: [12, 10, 12], fov: 60 }}
        onPointerMissed={() => setSelectedFile(null)}
      >

    <ambientLight intensity={1} />

    {data?.files.map((file, sourceIndex) =>
      file.dependencies.map((dependency) => {
          const targetIndex = data.files.findIndex(
            (target) => target.path === dependency
          );

    if (targetIndex === -1) return null;

    const start = getPosition(sourceIndex);
    const end = getPosition(targetIndex);


    const startHeight = Math.max(
      Math.log2(file.lines + 1),
      1
    );

const targetFile = data.files[targetIndex];

const endHeight = Math.max(
  Math.log2(targetFile.lines + 1),
  1
);


    return (
      <DependencyLine
        key={`${file.path}-${dependency}`}
        start={[start[0], startHeight, start[2]]}
        end={[end[0], endHeight, end[2]]}
          />
        );
      })
    )}


        {data?.files.map((file, index) => (
          <CodeBuilding
            key={file.path}
            file={file}
            position={getPosition(index)}
            onSelect={setSelectedFile}
          />
        ))}

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[4, 0, 2]}
        >
          <planeGeometry args={[14, 10]} />
          <meshStandardMaterial color="#222222" />
        </mesh>

        <OrbitControls />
      </Canvas>

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
          }}
        >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
        <h2>{selectedFile.path}</h2>

          <button onClick={() => setSelectedFile(null)}>
            ×
          </button>
        </div>

          <p>
            <strong>Lines:</strong> {selectedFile.lines}
          </p>

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

          <h3>Functions</h3>

          {selectedFile.functions.length === 0 ? (
            <p>No functions</p>
          ) : (
            <ul>
              {selectedFile.functions.map((fn) => (
                <li key={fn.name}>
                  {fn.name} — complexity {fn.complexity}
                </li>
              ))}
            </ul>
          )}

        </div>
      )}
    </div>
  );
}

export default App;