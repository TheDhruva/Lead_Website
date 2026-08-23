import fs from "node:fs";
import path from "node:path";

const files = [
  [
    "public/images/hero/portrait-left-1.svg",
    256,
    384,
    "#1a1a1a",
    "Portrait L1",
  ],
  [
    "public/images/hero/portrait-left-2.svg",
    256,
    384,
    "#222222",
    "Portrait L2",
  ],
  [
    "public/images/hero/portrait-right-1.svg",
    256,
    384,
    "#1a1a1a",
    "Portrait R1",
  ],
  [
    "public/images/hero/portrait-right-2.svg",
    256,
    384,
    "#222222",
    "Portrait R2",
  ],
  [
    "public/images/services/video-editing.svg",
    800,
    1200,
    "#151515",
    "Video Editing",
  ],
  [
    "public/images/services/web-development.svg",
    800,
    1200,
    "#181818",
    "Web Dev",
  ],
  [
    "public/images/services/graphic-design.svg",
    800,
    1200,
    "#1a1a1a",
    "Graphic Design",
  ],
  ["public/images/videos/video-1.svg", 720, 1280, "#121212", "Video 1"],
  ["public/images/videos/video-2.svg", 720, 720, "#161616", "Video 2"],
  ["public/images/videos/video-3.svg", 720, 1280, "#141414", "Video 3"],
  [
    "public/images/projects/digital/ecommerce.svg",
    1280,
    720,
    "#171717",
    "E-Commerce",
  ],
  ["public/images/projects/digital/agency.svg", 1280, 720, "#1b1b1b", "Agency"],
  [
    "public/images/projects/brand/tech-startup.svg",
    800,
    800,
    "#151515",
    "Tech Brand",
  ],
  [
    "public/images/projects/brand/restaurant.svg",
    800,
    800,
    "#191919",
    "Restaurant",
  ],
  ["public/images/projects/brand/apparel.svg", 800, 800, "#131313", "Apparel"],
  [
    "public/images/projects/brand/event-poster.svg",
    800,
    800,
    "#1c1c1c",
    "Event",
  ],
  ["public/images/og.svg", 1200, 630, "#0e0e0e", "DHRUVA"],
];

function svg(w, h, bg, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#2a2a2a"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="50%" fill="#666666" font-family="Inter, Arial, sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle">${label}</text>
</svg>`;
}

for (const [file, w, h, bg, label] of files) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, svg(w, h, bg, label));
  console.log("created", file);
}

fs.mkdirSync("public/videos", { recursive: true });
fs.writeFileSync("public/videos/.gitkeep", "");
fs.writeFileSync(
  "public/videos/README.md",
  [
    "# Video assets",
    "",
    "Place muted looping showcase videos here:",
    "- showcase-1.mp4",
    "- showcase-2.mp4",
    "- showcase-3.mp4",
    "- showcase-4.mp4",
    "",
  ].join("\n"),
);

console.log("done");
