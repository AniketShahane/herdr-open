import { div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { agents, theme, run, shared, setShared, notify, updates } from "herdr";
import { ball, narrow, NUM, COND, tracked, ASSETS, BALL } from "./kit.js";
import { MATCH, award, copy, fresh, points } from "./match.js";

// The sidebar's foot: the match scoreboard, You against the Net, as a TV score
// bug (serve ball, sets, games, the point in a yellow box), then Settings, Add
// machine and your match record. This copy is the one that keeps score: it
// watches agents change state and calls each point.
export class Score {
  init(cx) {
    this.prev = null;
    // The first time this layout runs, the match starts fresh at love all.
    if (shared("herdr-open.started") !== 1) {
      setShared(MATCH, fresh(shared(MATCH)?.record ?? [0, 0]));
      setShared("herdr-open.started", 1);
    }
    // Data, not animation: a backstop for state changes while hidden.
    cx.timer.every(1500, () => this.track());
  }

  track() {
    const list = agents();
    const prev = this.prev;
    this.prev = new Map(list.map((a) => [a.address, a.status]));
    // The first look is only a look: agents already done score nothing.
    if (!prev) return;
    let m = null;
    const news = [];
    for (const a of list) {
      const was = prev.get(a.address);
      if (!was || was === a.status) continue;
      let who = null;
      if (was === "working" && (a.status === "done" || a.status === "idle")) who = 0;
      else if (a.status === "blocked") who = 1;
      if (who === null) continue;
      m ??= copy(shared(MATCH));
      const what = award(m, who, `${a.program?.name ?? "An agent"} · ${a.space_name}`);
      if (what === "set" || what === "match") news.push({ what, call: m.call, sets: m.sets.map((s) => s.join("–")).join("  ") });
    }
    if (!m) return;
    setShared(MATCH, m);
    for (const n of news) {
      notify({
        title: n.call,
        body: n.what === "match" ? `${n.sets}. A new match starts with the next point.` : `Sets so far: ${n.sets}`,
        level: n.call.endsWith("You") ? "success" : "info",
        icon: BALL,
        timeout: 8000,
      });
    }
  }

  box(t, text, width, strong) {
    return div().w(width).h(18).flex_none().flex().items_center().justify_center().rounded(3)
      .bg(strong ? t.accent : t.raised).text_color(strong ? t.accent_foreground : t.foreground)
      .font_family(NUM).font_bold().text_size(15).pt(2).child(text);
  }

  side(t, m, s, name) {
    const serving = !m.done && m.server === s;
    const won = m.done && ((m.done === "won") === (s === 0));
    return h_flex().h(22).px(8).gap(5).items_center()
      .child(h_flex().w(10).flex_none().justify_center().child(serving || won ? ball(won ? 10 : 8) : div()))
      .child(div().flex_1().min_w(0).truncate().font_family(COND).font_semibold().text_size(12.5)
        .text_color(s === 0 ? t.foreground : t.muted).child(tracked(name)))
      .children(m.sets.map((set) => div().w(12).flex_none().text_center().font_family(NUM).font_bold().text_size(15).pt(2)
        .text_color(set[s] > set[1 - s] ? t.foreground : t.dim).child(String(set[s]))))
      .when(!m.done, (el) => el.child(this.box(t, String(m.g[s]), 18, false)).child(this.box(t, points(m, s), 28, true)));
  }

  link(t, id, icon, label, action) {
    return h_flex().id(id).h(22).px(6).gap(6).items_center().rounded(11).text_size(12).text_color(t.muted)
      .hover((s) => s.bg(t.hover).text_color(t.foreground)).cursor_pointer().on_click(action)
      .child(svg(`mods/workspace-chrome/${icon}.svg`).size(13))
      .when(Boolean(label), (el) => el.child(label));
  }

  render() {
    this.track();
    const t = theme();
    const m = shared(MATCH) ?? fresh();
    const ready = Boolean(updates().app.ready);
    const settingsLink = this.link(t, "settings", "settings", narrow() ? null : "Settings", () => run("app.settings"))
      .when(ready, (el) => el.child(div().size(6).rounded_full().bg(t.accent)));
    if (narrow()) {
      return v_flex().size_full().bg(t.chrome).border_t(1).border_color(t.border).items_center().justify_end().pb(8).child(settingsLink);
    }
    const [w, l] = m.record ?? [0, 0];
    return v_flex().size_full().bg(t.chrome).border_t(1).border_color(t.border).px(8).pt(8).pb(5).gap(4)
      .child(v_flex().id("scoreboard").flex_none().py(3).rounded(6).bg("#00000038").border(1).border_color(t.border)
        .tooltip("Every agent that finishes wins you a point. Every agent that gets stuck gives one to the Net. Best of three sets. Double-click for a new match.")
        .on_mouse_down("left", (e) => { if (e.click_count === 2) setShared(MATCH, fresh(copy(shared(MATCH)).record)); })
        .child(this.side(t, m, 0, "YOU"))
        .child(this.side(t, m, 1, "THE NET")))
      .child(h_flex().h(22).items_center().gap(2)
        .child(settingsLink)
        .child(this.link(t, "machine", "plus", "Machine", () => run("mod.open", { name: "machine-add" })))
        .child(div().flex_1())
        .child(h_flex().gap(5).items_center().pr(4).tooltip("Matches won and lost")
          .child(div().font_family(COND).font_semibold().text_size(10.5).text_color(t.dim).child(tracked("RECORD")))
          .child(div().font_family(NUM).font_bold().text_size(14).pt(2).text_color(t.muted).child(`${w}–${l}`))));
  }
}
