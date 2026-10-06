import { Line } from "@react-three/drei";

function DependencyLine({ start, end }) {
  return (
    <Line
      points={[start, end]}
      color="cyan"
      lineWidth={2}
    />
  );
}

export default DependencyLine;