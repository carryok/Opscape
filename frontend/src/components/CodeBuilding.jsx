import { Html } from "@react-three/drei";

function CodeBuilding({
  file,
  position,
  onSelect,
  isSelected,
  isRelated,
}) {
  const complexity = Number(file.complexity ?? 1);

  const height = Math.max(
    Math.log2(file.lines + 1),
    1
  );

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
    >
      <boxGeometry
        args={[
          1.4 + complexity * 0.3,
          height,
          1.4 + complexity * 0.3,
        ]}
      />

      <meshStandardMaterial color={buildingColor} />

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
    </mesh>
  );
}

export default CodeBuilding;