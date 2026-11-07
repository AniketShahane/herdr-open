import { div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, props, run, theme, home } from "herdr";
import { ball, chip, bounce, COND } from "./kit.js";

function folder(cwd) {
  if (!cwd) return "";
  const h = home();
  return cwd === h ? "~" : cwd.startsWith(h + "/") ? "~" + cwd.slice(h.length) : cwd;
}

// A pane's header as a player's name strip: the ball sits by the pane you're
// typing in (on serve), the program in condensed capitals, its state in tennis
// words, the folder, and on hover split, zoom and close.
export class Pane {
  constructor() {
    this.hovered = false;
  }

  button(t, id, icon, command, args) {
    return div().id(id).p(3).rounded(4).text_color(t.dim)
      .hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click((_e, cx) => { cx.stop_propagation(); run(command, args); })
      .child(svg(`mods/pane/${icon}.svg`).size(13));
  }

  render() {
    const t = theme();
    const p = panes().find((x) => x.pane === props()?.pane);
    if (!p) return div();
    const pane = p.pane;
    const name = ((p.program?.agent || p.program?.shell) && p.program.name) || p.title || p.program?.name || "shell";
    return h_flex().id(`pane-head-${pane}`).size_full().px(10).gap(8).items_center()
      .bg(t.background).border_b(1).border_color(p.focused ? t.accent + "55" : t.border).text_size(11.5)
      .on_hover((hovered, cx) => { this.hovered = hovered; cx.notify(); })
      .on_click(() => run("pane.focus", { pane }))
      .child(h_flex().w(10).flex_none().justify_center()
        .child(p.focused ? ball(9) : div().size(7).rounded_full().border(1).border_color(t.dim)))
      .child(div().flex_none().max_w(220).truncate().font_family(COND).font_semibold().text_size(12.5)
        .text_color(p.focused ? t.foreground : t.muted).child(name.toUpperCase()))
      .when(p.status === "working", (el) => el.child(h_flex().flex_none().gap(5).items_center().text_color(t.working)
        .font_family(COND).font_semibold().text_size(10.5).child(bounce(7, 12)).child("RALLY")))
      .when(p.status === "blocked" || p.status === "done", (el) => el.child(chip(t, p.status)))
      .child(div().flex_1().min_w(0).truncate().text_color(t.dim).child(folder(p.cwd)))
      .when(this.hovered, (el) => el
        .child(this.button(t, `ph-r-${pane}`, "split-right", "pane.split", { direction: "right", pane }))
        .child(this.button(t, `ph-d-${pane}`, "split-down", "pane.split", { direction: "down", pane }))
        .child(this.button(t, `ph-z-${pane}`, p.zoomed ? "unzoom" : "zoom", "pane.zoom", { pane }))
        .child(this.button(t, `ph-x-${pane}`, "close", "pane.close", { pane })));
  }
}
