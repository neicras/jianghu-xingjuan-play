// The height of a planted foot and the apparent size of the figure come from the same depth.
const WIDTH = 1200,
  HEIGHT = 750,
  HORIZON = 300,
  CAMERA_HEIGHT = 307,
  FOCAL = 1420;
const TAU = Math.PI * 2;
export const DURATION = 6.4;
const clamp = (n, a, b) => Math.max(a, Math.min(n, b));
const smooth = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

// Seconds, pose in atlas-key units, pelvis X, distance toward camera.
const blocking = {
  traveller: [
    [0, 0, -300, 0],
    [0.62, 0, -300, 0],
    [1.07, 0.8, -254, 20],
    [1.48, 1, -203, 32],
    [1.77, 1, -207, 31],
    [1.93, 1.25, -170, 24],
    [2.1, 2, -36, 8],
    [2.19, 2, -36, 8],
    [2.47, 3, -43, 1],
    [2.76, 3, -52, -5],
    [3.15, 3.75, -95, 3],
    [3.43, 4, -108, 10],
    [3.59, 4, -108, 10],
    [3.73, 2, -108, 10],
    [3.85, 2, -108, 10],
    [4.01, 4.6, -134, 16],
    [4.28, 5, -172, 17],
    [4.58, 5, -175, 17],
    [5.14, 5.6, -256, 3],
    [5.6, 6, -300, 0],
    [6.4, 6, -300, 0],
  ],
  assassin: [
    [0, 0, 304, -26],
    [0.55, 0, 304, -26],
    [1.1, 0.8, 251, -39],
    [1.47, 1, 201, -52],
    [1.84, 1, 173, -49],
    [2.06, 1.08, 170, -44],
    [2.16, 1.75, 178, -41],
    [2.33, 2, 216, -47],
    [2.58, 2.18, 232, -62],
    [2.95, 3, 274, -84],
    [3.36, 3, 278, -89],
    [3.55, 3.15, 280, -91],
    [3.75, 4, 260, -197],
    [3.86, 4, 260, -197],
    [4.19, 4.8, 237, -68],
    [4.43, 5, 249, -60],
    [4.8, 5.1, 255, -52],
    [5.36, 5.8, 296, -29],
    [5.62, 6, 304, -26],
    [6.4, 6, 304, -26],
  ],
};
function at(track, t) {
  const next = track.findIndex((k) => k[0] > t);
  if (next <= 0) return track[next === 0 ? 0 : track.length - 1].slice(1);
  const a = track[next - 1],
    b = track[next],
    k = smooth((t - a[0]) / (b[0] - a[0]));
  return a.slice(1).map((v, i) => mix(v, b[i + 1], k));
}
export const beats = [
  [0, "對峙"],
  [0.7, "探步"],
  [1.81, "斗篷客進劍"],
  [2.23, "刺客避鋒"],
  [3.42, "刺客還刀"],
  [3.75, "架開短刀"],
  [4.55, "收勢"],
];
function project(x, z, cam) {
  const angle = cam * 0.075,
    sn = Math.sin(angle),
    cs = Math.cos(angle);
  const d = x * sn + z * cs,
    s = FOCAL / (FOCAL - d);
  return {
    x: WIDTH / 2 + (x * cs - z * sn - cam * 36) * s,
    y: HORIZON + CAMERA_HEIGHT * s,
    s,
    d,
  };
}
function actorAt(id, [pose, x, z], cam, m) {
  const p = project(x, z, cam);
  const step = Math.round(pose) % m.frameCount;
  const scale = p.s * (id === "traveller" ? 1.18 : 1.14) * (m.actors[id].worldScale ?? 1);
  const blade = m.actors[id].weaponWristAndTip[step].map(([u,v]) => [
    p.x + scale * (u - m.pivot[0]), p.y + scale * (v - m.pivot[1])
  ]);
  return { ...p, id, step, scale, blade };
}
function dot(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
}
function spark(ctx, x, y, age, index) {
  const a = -2.7 + index * 0.79,
    len = 12 + (index % 3) * 9,
    d = age * (85 + index * 14);
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d + age * age * 75);
  ctx.lineTo(
    x + Math.cos(a) * (d + len),
    y + Math.sin(a) * (d + len) + age * age * 75,
  );
  ctx.lineWidth = index % 2 ? 1.6 : 2.5;
  ctx.strokeStyle = "rgba(255,222,148," + Math.max(0, 1 - age / 0.23) + ")";
  ctx.stroke();
}
function shadow(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.s * 95, p.s * 14);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, "#080c10bb");
  g.addColorStop(1, "#080c1000");
  ctx.fillStyle = g;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}
function stance(ctx, p, img, m, tile) {
  const [w, h] = m.cell,
    [cols] = m.grid;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.lean || 0);
  ctx.scale(p.scale, p.scale);
  ctx.drawImage(
    tile ?? img,
    tile ? 0 : (p.step % cols) * w,
    tile ? 0 : Math.floor(p.step / cols) * h,
    w,
    h,
    -m.pivot[0],
    -m.pivot[1],
    w,
    h,
  );
  ctx.restore();
}
export async function loadScene(assets = new URL("./assets/", import.meta.url), actorOverrides = {}, layerOverrides = {}) {
  const response = await fetch(new URL("manifest.json", assets));
  if (!response.ok) throw new Error("manifest");
  const m = await response.json();
  Object.assign(m.actors, actorOverrides);
  Object.assign(m.layers, layerOverrides);
  const files = {
    ...m.layers,
    traveller: m.actors.traveller.file,
    assassin: m.actors.assassin.file,
  };
  const images = Object.fromEntries(
    await Promise.all(
      Object.entries(files).map(async ([k, f]) => {
        const im = new Image();
        im.src = new URL(f, assets).href;
        await im.decode();
        return [k, im];
      }),
    ),
  );
  return { images, m };
}
export function drawScene(ctx, resources, t, view = 0, duel = null) {
  const { images, m } = resources;
  const phase = (TAU * t) / DURATION;
  const cam = clamp(view + 0.23 * Math.sin(phase), -1.2, 1.2);
  const push = (0.034 * (1 - Math.cos(phase))) / 2;
  const shakeAge = duel ? -1 : t - 3.76,
    shake =
      shakeAge >= 0 && shakeAge < 0.17
        ? Math.sin(shakeAge * 89) * 2.9 * Math.exp(-22 * shakeAge)
        : 0;
  ctx.save();
  ctx.setTransform(
    ctx.canvas.width / WIDTH,
    0,
    0,
    ctx.canvas.height / HEIGHT,
    0,
    0,
  );
  ctx.fillStyle = "#10161c";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.translate(WIDTH / 2 + shake, HEIGHT * 0.63);
  ctx.scale(1 + push, 1 + push);
  ctx.translate(-WIDTH / 2, -HEIGHT * 0.63);
  // The far architecture and the floor share a painted plate. Varying the floor
  // offset by depth preserves the continuous stairs and stone paving.
  const landscape=resources.scenery;
  const back = landscape?.back ?? images.court;
  const aspect=duel?.stageAspect;
  const floorScale=aspect ? Math.max(1,aspect/(WIDTH/HEIGHT)) : 1;
  for (let y = 0; y < HEIGHT; y += 10) {
    const floor = clamp((y - 490) / 260, 0, 1),
      dx = -cam * (12 + floor * 47);
    const span = Math.min(10, HEIGHT - y);
    const scale = 1.1;
    const worldH = floorScale * WIDTH * scale * back.height / back.width;
    const sy = ((y + (worldH - HEIGHT) * 0.56) * back.height) / worldH;
    ctx.drawImage(
      back,
      0,
      sy,
      back.width,
      (span * back.height) / worldH,
      -WIDTH * 0.05 + dx,
      y,
      WIDTH * scale,
      span + 0.15,
    );
  }
  resources.lighting?.ground(ctx, t, cam);
  if(landscape)landscape.midground(ctx,phase,cam);
  else {
  // Ash stays upstage; the nearer actors obscure it when they cross.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 13; i++) {
    const a = (t / DURATION + i * 0.137) % 1;
    const x = 597 - cam * 15 + (i % 4) * 3 + Math.sin(a * 6 + i) * 16 + a * 24;
    dot(
      ctx,
      x,
      290 - a * 122,
      1.05 + (i % 3) * 0.35,
      "rgba(242,165,78," + 0.38 * Math.sin(a * Math.PI) + ")",
    );
  }
  ctx.restore();
  }
  ctx.save();
  if(aspect){
    // Panoramic trial: keep actor silhouettes at their natural aspect and
    // on the same ground line while the landscape fills the whole screen.
    const zoom=Math.min(1.56,aspect/1.6);
    ctx.translate(WIDTH/2,HEIGHT*.9);
    ctx.scale(zoom*(WIDTH/HEIGHT)/aspect,zoom);
    ctx.translate(-WIDTH/2,-607);
  }
  const hero = actorAt("traveller", duel?.traveller ?? at(blocking.traveller, t), cam, m);
  hero.lean = duel?.heroLean ?? 0;
  const opponents = duel?.opponents ?? [
    { id: "assassin", track: duel?.assassin ?? at(blocking.assassin, t) },
    ...(duel?.second ? [{ id: "assassin", track: duel.second }] : []),
  ];
  const foes = opponents.map(({id, track, lean}) => ({
    ...actorAt(id, track, cam, m), lean,
  }));
  const foe = foes[0];
  const actors = [hero, ...foes];
  actors.sort((a, b) => a.d - b.d);
  for (const p of actors) resources.lighting?.castShadow(ctx, p);
  for (const p of actors) shadow(ctx, p);
  for (const p of actors) stance(ctx, p, (p.step===0 && duel?.idle?.[p.id]) || images[p.id], m, resources.lighting?.cel(p));
  // Spark at the defender's actual painted blade, anchored to the contact pose.
  const age = duel ? duel.flashAge : t - 3.75;
  if (foe && age >= 0 && age < 0.23) {
    const weapon = (duel?.source === "assassin" ? foe : hero).blade;
    const tip = duel ? weapon[1] : foe.blade[1];
    const [x, y] = tip;
    for (let i = 0; i < 7; i++) spark(ctx, x, y, age, i);
    if (age < 0.055) dot(ctx, x, y, 4 * (1 - age / 0.055), "#fff3c3");
  }
  ctx.restore();
  if(landscape){
    landscape.foreground(ctx,phase,cam,duel);
    ctx.restore();
    return;
  }
  // Each lantern swings about its attachment point, on a nearer plane.
  const gate = images.lanterns,
    half = gate.width / 2,
    gw = WIDTH * 1.07,
    gh = (gw * gate.height) / gate.width;
  for (let i = 0; i < 2; i++) {
    const pivot = (i ? 0.9 : 0.12) * gw;
    ctx.save();
    ctx.translate((WIDTH - gw) / 2 - cam * 78 + pivot + (i ? -1 : 1) * (duel?.lanternInset ?? 0),
      -19 + (duel?.lanternDrop ?? 0));
    if(aspect)ctx.scale(Math.min(1,1.6/aspect),1);
    ctx.rotate(0.011 * Math.sin(phase * (i ? 2 : 1) + i * 2));
    ctx.drawImage(
      gate,
      i * half,
      0,
      half,
      gate.height,
      (i * gw) / 2 - pivot,
      0,
      gw / 2,
      gh,
    );
    ctx.restore();
  }
  ctx.restore();
}
