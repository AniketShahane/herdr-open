// Herdr Open: the pieces every part shares. Balls, the net, lettering, the
// three court surfaces and the tennis words for agent states.

import { div, image, svg, PathBuilder, Background } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, layout, shared, setShared, settings, window as appWindow } from "herdr";

export const ASSETS = "mods/herdr-open";
export const BALL = `${ASSETS}/ball.svg`;

// Type: a tournament serif for the name and the umpire, scoreboard numerals,
// condensed capitals for labels. All ship with macOS; elsewhere they fall back.
export const SERIF = "Hoefler Text";
export const NUM = "DIN Condensed";
export const COND = "Avenir Next Condensed";

// Letter-spaced capitals: GPUI has no tracking, so hair spaces do it.
export const tracked = (s) => [...String(s)].join(" ");

// The courts. Clicking one sets the theme, so the whole window follows.
export const SURFACES = [
  { id: "grass", theme: "herdr-open-grass", label: "Grass", court: "#3a8a4c", bg: "#0f2117" },
  { id: "clay", theme: "herdr-open-clay", label: "Clay", court: "#c8643c", bg: "#2a1711" },
  { id: "hard", theme: "herdr-open-hard", label: "Hard", court: "#3468b4", bg: "#0e1d33" },
];
export const surfaceOf = (t) => SURFACES.find((s) => s.bg === String(t.background ?? "").toLowerCase().slice(0, 7))?.id ?? null;

// What each agent state is called on court.
export const WORD = { working: "Rally", blocked: "Your serve", done: "Game", idle: "Changeover" };

export function ball(size) {
  return image(BALL).size(size).flex_none();
}

// A one-color ball (seams cut out), for states that need their own color.
export function glyph(size, color) {
  return svg(`${ASSETS}/ball-glyph.svg`).size(size).flex_none().text_color(color);
}

// A ball bouncing in place: native motion, no timers. Eased in on the way down,
// so it speeds up into the ground and floats at the top like a real bounce.
export function bounce(size = 7, height = 13, period = 640) {
  return div().relative().w(size).h(height).flex_none()
    .child(div().absolute().left(0).top(0).size(size)
      .loop("top", { from: 0, to: height - size, period, easing: "ease-in" })
      .child(image(BALL).size(size)));
}

// An agent's state as a ball: bouncing in a rally, colored when it needs you or
// won its game, an empty outline at the changeover.
export function mark(t, status, size = 8) {
  if (status === "working") return bounce(size, size + 6);
  if (status === "blocked") return glyph(size + 1, t.blocked);
  if (status === "done") return glyph(size, t.done);
  if (status === "idle") return div().size(size - 1).flex_none().rounded_full().border(1.5).border_color(t.idle ?? t.dim);
  return div().size(size).flex_none();
}

// The state named in condensed capitals on a tinted pill.
export function chip(t, status) {
  const c = t[status] ?? t.dim;
  return h_flex().flex_none().h(17).px(7).items_center().rounded(9).bg(c + "26").text_color(c)
    .font_family(COND).font_semibold().text_size(10.5).child(WORD[status]?.toUpperCase() ?? "");
}

const RECT = () => PathBuilder.fill().move_to("0%", "0%").line_to("100%", "0%").line_to("100%", "100%").line_to("0%", "100%").close().build();

// The net: white tape over black mesh, with a post at either end when asked.
// It runs under the sidebar's brand and the tab bar, across the whole window.
export function net(t, { left = false, right = false } = {}) {
  const zoom = Number(settings()?.zoom) || 1;
  const mesh = window.paint_path(RECT(), Background.checkerboard(t.foreground + "30", Math.max(1, Math.round(2 * zoom))))
    .absolute().top(0).left(0).size_full();
  const post = () => div().w(4).h(11).flex_none().rounded_t(2).bg(t.muted);
  return h_flex().w_full().h(11).flex_none().items_start()
    .when(left, (el) => el.child(post()))
    .child(v_flex().flex_1().min_w(0).h(10)
      .child(div().h(2).w_full().flex_none().bg(t.foreground))
      .child(div().relative().flex_1().w_full().bg("#00000055").child(mesh))
      .child(div().h(1).w_full().flex_none().bg(t.foreground + "40")))
    .when(right, (el) => el.child(post()));
}

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

// The sidebar's rail goes by its width, as in the shipped mods.
export const narrow = () => (find(layout(), "sidebar")?.size?.px ?? Infinity) < 160;

export function toggleSidebar() {
  const width = find(layout(), "sidebar")?.size?.px;
  if (!narrow()) setShared("sidebar.width", width);
  setShared("sidebar.collapsed", !narrow());
  run("layout.resize", { id: "sidebar", px: narrow() ? (shared("sidebar.width") ?? 272) : appWindow()?.platform === "macos" ? 76 : 44 });
}

export { find };
