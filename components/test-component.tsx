"use client";

import React from "react";

const TestComponent = () => {
  const [angka, setAngka] = React.useState<number>(0);

  const handlePlus = () => {
    setAngka((prevAngka) => angka + 1);
  };
  return (
    <div>
      <label htmlFor="">{angka}</label>

      <button onClick={handlePlus}>PLUS</button>
    </div>
  );
};

export default TestComponent;
