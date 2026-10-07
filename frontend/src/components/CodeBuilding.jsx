import { Html } from "@react-three/drei";

function CodeBuilding({
  file,
  position,
  onSelect,
  isSelected,
  isRelated,
}) {
  const height = Math.max(
    Math.log2(file.lines + 1),
    1
  );

  const complexity =
    file.functions.length > 0
      ? file.functions.reduce(
          (total, fn) => total + fn.complexity,
          0
        ) / file.functions.length
      : 1;

  let buildingColor = "orange";

  if (isSelected) {
    buildingColor = "yellow";
  } else if (isRelated) {
    buildingColor = "skyblue";
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
          1.5 + complexity * 0.15,
          height,
          1.5 + complexity * 0.15,
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