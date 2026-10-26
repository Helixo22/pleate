"use client";

import { TwoFactorSetup } from "pleate/auth/two-factor-setup";
import { Button } from "pleate/button";
import { toast } from "pleate/toast";
import { useState } from "react";

// Your server returns the QR code as an SVG string (e.g. from the qrcode package). This one is a stand-in.
function fakeQrSvg(seed: string) {
  const n = 25;
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const finder = (x: number, y: number) =>
    `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  let cells = "";
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const inFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      h = Math.imul(h ^ (x * 31 + y), 2654435761) >>> 0;
      if (!inFinder && h % 7 < 3) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges">${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}${cells}</svg>`;
}

const SECRET = "JBSWY3DPEHPK3PXPJBSWY3DP";

export default function Demo() {
  const [key, setKey] = useState(0);
  return (
    <div className="grid w-full place-items-center rounded-3xl sm:bg-bg sm:px-4 sm:py-10">
      <div className="w-full max-w-[26rem] rounded-3xl bg-surface p-6 shadow-md sm:p-8">
        <TwoFactorSetup
          key={key}
          qrSvg={fakeQrSvg(SECRET)}
          secret={SECRET}
          downloadHeader="Plate backup codes for jane@plate.app"
          downloadName="plate-backup-codes.txt"
          onVerify={async (code) => {
            await new Promise((r) => setTimeout(r, 900)); // your API call
            if (code !== "123456") throw new Error("That code didn't work. Try 123456.");
            return { backupCodes: ["7KQ2-M9XD", "P4TZ-8WHN", "R2VC-6JLE", "BX5N-3QFA", "H8DM-T2KR", "Z6WP-4CYU", "N3GE-9VBS", "Q7LA-5XJT"] };
          }}
          onDone={() => {
            toast.success("Two-step verification is on");
            setKey((k) => k + 1);
          }}
        />
      </div>
      <Button variant="plain" size="sm" className="mt-3" onClick={() => setKey((k) => k + 1)}>
        Restart demo
      </Button>
    </div>
  );
}
