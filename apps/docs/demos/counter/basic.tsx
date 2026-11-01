"use client";

import { useState } from "react";
import { Button } from "pleate/button";
import { Counter } from "pleate/effects/counter";

export default function Demo() {
  const [value, setValue] = useState(1284);
  return (
    <div className="flex flex-col items-center gap-6">
      <Counter value={value} minDigits={4} fontSize={72} />
      <div className="flex gap-2">
        <Button variant="gray" onClick={() => setValue((v) => Math.max(0, v - 1))}>Minus 1</Button>
        <Button variant="gray" onClick={() => setValue((v) => v + 1)}>Plus 1</Button>
        <Button onClick={() => setValue(Math.floor(Math.random() * 10000))}>Random</Button>
      </div>
    </div>
  );
}
