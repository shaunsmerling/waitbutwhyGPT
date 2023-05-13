import { useState, useEffect } from "react";

export const LoadingBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) =>
        prevProgress >= 100 ? 0 : prevProgress + 5
      );
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-2 w-full bg-gray-200">
      <div
        className="h-full bg-blue-500"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};


export default LoadingBar;



