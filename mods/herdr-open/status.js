import { div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, agents, theme, run, window, keys, shared } from "herdr";
import { ball, bounce, glyph, SURFACES, surfaceOf, SERIF, COND, tracked } from "./kit.js";
import { MATCH } from "./match.js";

// The status bar as the umpire's chair: the last call ("Thirty–Fifteen",
// "Deuce", "Game and first set, You") and who earned it, what's in play,
// the branch, the court surface switch and the palette key.
export class Status {
  hint() {
    const mac = window()?.platform === "macos";
    const mod = { cmd: mac ? "⌘" : "Ctrl+", ctrl: mac ? "⌃" : "Ctrl+", shift: mac ? "⇧" : "Shift+", alt: mac ? "⌥" : "Alt+", option: mac ? "⌥" : "Alt+" };
    const b = keys().find((k) => k.section === "global" && k.action === "app.palette");
    const parts = b && b.keys.endsWith("--") ? [...b.keys.slice(0, -2).split("-"), "-"] : b?.keys.split("-");
    return parts ? parts.map((p) => mod[p.toLowerCase()] ?? p.toUpperCase()).join("") : "Commands";
  }

  render() {
    const t = theme();
    const m = shared(MATCH);
    const list = agents();
    const count = (s) => list.filter((a) => a.status === s).length;
    const space = spaces().find((s) => s.active);
    const on = surfaceOf(t);
    const caption = (text) => div().flex_none().font_family(COND).font_semibold().text_size(10.5).text_color(t.dim).child(tracked(text));
    const swatch = (s) => div().id(`surface-${s.id}`).size(16).flex_none().flex().items_center().justify_center().rounded_full()
      .border(1.5).border_color(on === s.id ? t.foreground : "#00000000").cursor_pointer().tooltip(`${s.label} court`)
      .hover((el) => el.border_color(on === s.id ? t.foreground : t.dim))
      .on_click(() => run("app.theme", { name: s.theme }))
      .child(div().size(9).rounded_full().bg(s.court));
    return h_flex().size_full().px(14).gap(14).items_center().bg(t.chrome).border_t(1).border_color(t.border).text_size(11.8).text_color(t.muted)
      .child(h_flex().flex_1().min_w(0).gap(8).items_center()
        .child(ball(11))
        .child(caption("UMPIRE"))
        .child(div().flex_none().font_family(SERIF).italic().text_size(14).text_color(t.foreground).child(m?.call ?? "Love all. Play."))
        .when(Boolean(m?.note), (el) => el.child(div().min_w(0).truncate().text_color(t.dim).child(m.note))))
      .when(count("working") > 0, (el) => el.child(h_flex().flex_none().gap(6).items_center().child(bounce(7, 12)).child(`${count("working")} in rally`)))
      .when(count("blocked") > 0, (el) => el.child(h_flex().flex_none().gap(6).items_center().text_color(t.blocked).child(glyph(9, t.blocked)).child(`${count("blocked")} your serve`)))
      .when(Boolean(space?.branch), (el) => el.child(h_flex().flex_none().gap(6).items_center()
        .child(svg("mods/workspace-chrome/branch.svg").size(13)).child(space.branch)))
      .child(h_flex().flex_none().gap(4).items_center().child(caption("COURT")).child(div().w(2)).children(SURFACES.map(swatch)))
      .child(div().id("palette").flex_none().text_color(t.dim).hover((s) => s.text_color(t.foreground)).cursor_pointer()
        .on_click(() => run("app.palette")).child(this.hint()));
  }
}
