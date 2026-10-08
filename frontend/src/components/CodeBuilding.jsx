import { Html } from "@react-three/drei";
import { useState } from "react";

function CodeBuilding({
  file,
  position,
  onSelect,
  isSelected,
  isRelated,
  churnIntensity = 0,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const complexity = Number(file.complexity ?? 1);

  const height = Math.max(
    Math.log2(file.lines + 1),
    1
  );

  const changes = file.git_metrics?.changes ?? 0;
  const commits = file.git_metrics?.commits ?? 0;

  let buildingColor = "limegreen";

  if (complexity >= 6) {
    buildingColor = "crimson";
  } else if (complexity >= 4) {
    buildingColor = "orange";
  }

  if (isRelated) {
    buildingColor = "skyblue";
  }

  if (isSelected) {
    buildingColor = "yellow";
  }

  return (
    <mesh
      position={[
        position[0],
        height / 2,
        position[2],
      ]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(file);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setIsHovered(true);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setIsHovered(false);
      }}
    >
      <boxGeometry
        args={[
          1.4 + complexity * 0.3,
          height,
          1.4 + complexity * 0.3,
        ]}
      />

      <meshStandardMaterial
        color={buildingColor}
        emissive={buildingColor}
        emissiveIntensity={churnIntensity * 0.6}
      />

      <Html
        position={[
          0,
          height / 2 + 0.5,
          0,
        ]}
        center
        distanceFactor={10}
        occlude={false}
      >
        <div
          style={{
            background: isSelected
              ? "gold"
              : "black",
            color: isSelected
              ? "black"
              : "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            fontWeight: isSelected
              ? "bold"
              : "normal",
          }}
        >
          {file.path}
        </div>
      </Html>

      {isHovered && (
        <Html
          position={[
            0,
            height + 1.2,
            0,
          ]}
          center
          distanceFactor={10}
          occlude={false}
        >
          <div
            style={{
              background: "rgba(0, 0, 0, 0.9)",
              color: "white",
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <div>
              <strong>{file.path}</strong>
            </div>

            <div>
              Lines: {file.lines}
            </div>

            <div>
              Complexity: {file.complexity}
            </div>

            <div>
              Git commits: {commits}
            </div>

            <div>
              Git changes: {changes}
            </div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

export default CodeBuilding;