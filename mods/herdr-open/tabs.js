import { div, svg, image } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { spaces, panes, theme, run, openOverlay, layout, shared, window, settings } from "herdr";
import { net, mark, find, NUM } from "./kit.js";

const stop = (_e, cx) => cx.stop_propagation();

function tabName(c) {
  if (c.named) return c.name;
  const ps = panes().filter((p) => p.tab === c.id);
  return (ps.find((p) => p.program?.agent) ?? ps[0])?.program?.name ?? c.name;
}

// The tab bar above the net: tabs as pills numbered like courts on the order
// of play (the number is also the cmd-<n> key), each with its ball, a serve
// button for a new tab, the Files and Changes switches, then the net with its
// right post.
export class Tabs {
  constructor() {
    this.pressed = null;
    this.panels = JSON.parse(localStorage.getItem("panels") ?? "{}");
  }

  // As the shipped tab bar: the side panel is remembered per space.
  syncPanel(space, panel, body, enabled) {
    if (!space || !panel) return;
    const now = panel.hidden ? null : body?.active ?? null;
    if (space.id !== this.space) {
      const first = this.space === undefined;
      this.space = space.id; this.pending = null;
      if (!(first && !(space.id in this.panels))) {
        const stored = this.panels[space.id] ?? null, want = enabled.includes(stored) ? stored : null;
        if (want !== now) {
          this.pending = { want, until: Date.now() + 1000 };
          if (want) { run("layout.select", { stack: "panel-body", child: want }); run("layout.show", { id: "panel" }); }
          else run("layout.hide", { id: "panel" });
          return;
        }
      }
    }
    if (this.pending) {
      if (this.pending.want !== now && Date.now() < this.pending.until) return;
      this.pending = null;
    }
    if (this.panels[space.id] === now) return;
    this.panels[space.id] = now;
    localStorage.setItem("panels", JSON.stringify(this.panels));
  }

  tab(t, c, i, shown, space, n) {
    const on = c.active;
    const name = tabName(c);
    return h_flex().id(`tab-${c.id}`).h(28).pl(10).pr(on ? 7 : 12).gap(7).flex_none().max_w(240).items_center().rounded(14)
      .text_size(12.8).border(1)
      .when(on, (el) => el.bg(t.raised).border_color(t.foreground + "38").text_color(t.foreground))
      .when(!on, (el) => el.border_color("#00000000").text_color(t.muted).hover((s) => s.bg(t.hover).text_color(t.foreground)))
      .on_mouse_down("left", (e, cx) => { cx.stop_propagation(); this.pressed = i; if (e.click_count === 2) run("tab.rename", { id: c.id }); })
      .on_mouse_up("left", () => {
        const from = this.pressed;
        this.pressed = null;
        if (from !== null && from !== i) run("tab.move", { id: shown[from].id, index: c.index });
        else run("tab.select", { id: c.id });
      })
      .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); openOverlay({ mod: "menu", kind: "popup", width: 200, props: { tab: "tab", target: { id: c.id, space: space.id } } }); })
      .child(div().flex_none().font_family(NUM).font_bold().text_size(14).pt(2).text_color(on ? t.accent : t.dim).child(n ? String(n) : "·"))
      .child(div().min_w(0).truncate().child(c.zoomed ? `${name} ⤢` : name))
      .when(Boolean(c.status) && c.status !== "idle", (el) => el.child(mark(t, c.status, 8)))
      .when(on, (el) => el.child(div().id(`close-${c.id}`).flex_none().p(2).rounded(8).text_color(t.dim)
        .hover((s) => s.bg(t.hover).text_color(t.foreground))
        .on_mouse_down("left", stop).on_click((_e, cx) => { cx.stop_propagation(); run("tab.close", { id: c.id }); })
        .child(svg("mods/pane/close.svg").size(11))));
  }

  toggle(t, id, icon, label, on, action) {
    return h_flex().id(id).h(26).px(9).gap(6).flex_none().items_center().rounded(13).border(1)
      .border_color(on ? t.accent : t.border).text_size(12).text_color(on ? t.foreground : t.muted)
      .when(on, (el) => el.bg(t.accent + "1a"))
      .hover((s) => s.border_color(on ? t.accent : t.input).text_color(t.foreground))
      .on_mouse_down("left", stop).on_click(action)
      .child(svg(icon).size(13)).child(label);
  }

  render() {
    const t = theme();
    const space = spaces().find((s) => s.active);
    const shown = space?.tabs ?? [];
    // Numbers count only tabs that aren't settled, as tab.select (cmd-<n>) does.
    const numbers = new Map(shown.filter((c) => !c.settled).map((c, n) => [c.id, n + 1]));
    const root = layout(), sidebar = find(root, "sidebar"), panel = find(root, "panel"), body = find(root, "panel-body");
    const enabled = shared("workspace.panels") ?? ["files", "changes"];
    this.syncPanel(space, panel, body, enabled);
    const showing = panel && !panel.hidden ? body?.active : null;
    const showPanel = (id) => {
      if (showing === id) run("layout.hide", { id: "panel" });
      else { run("layout.select", { stack: "panel-body", child: id }); run("layout.show", { id: "panel" }); }
    };
    // Room for the traffic lights when the sidebar is folded or hidden.
    const w = window();
    const lights = w?.platform === "macos" && w.titlebar === "none" && !w.fullscreen && root?.traffic_lights
      ? Math.max(10, (root.traffic_lights[0] + 64) / (Number(settings().zoom) || 1) - (sidebar?.hidden ? 0 : sidebar?.size?.px ?? 0))
      : 10;
    const button = (id, label, action) => div().id(id).size(26).flex_none().flex().items_center().justify_center().rounded(13)
      .text_color(t.muted).hover((s) => s.bg(t.hover).text_color(t.foreground)).on_mouse_down("left", stop).on_click(action).child(label);
    const row = h_flex().h(39).flex_none().min_w(0).pl(lights).pr(10).gap(6).items_center()
      .on_mouse_up("left", () => { this.pressed = null; })
      .on_scroll_wheel((e) => { if (Math.abs(e.delta.y) >= 1) run(e.delta.y > 0 ? "tab.prev" : "tab.next"); })
      .child(h_flex().id("tab-scroll").flex_1().min_w(0).h_full().items_center().gap(4).overflow_x_scrollbar()
        .children(shown.map((c, i) => this.tab(t, c, i, shown, space, numbers.get(c.id))))
        // A new tab is a new ball into play.
        .child(div().id("tab-new").size(24).ml(4).flex_none().flex().items_center().justify_center().rounded_full()
          .bg(t.accent).text_color(t.accent_foreground).tooltip("New tab")
          .hover((s) => s.opacity(0.85)).on_mouse_down("left", stop)
          .on_click(() => openOverlay({ mod: "new-menu", kind: "popup", width: 250, height: 512 }))
          .child(svg("mods/herdr-open/plus.svg").size(12))))
      .when(enabled.includes("files"), (el) => el.child(this.toggle(t, "panel-files", "mods/files/file.svg", "Files", showing === "files", () => showPanel("files"))))
      .when(enabled.includes("changes"), (el) => el.child(this.toggle(t, "panel-changes", "mods/changes/changes.svg", "Changes", showing === "changes", () => showPanel("changes"))))
      .when(w?.buttons, (el) => el.child(button("minimize", "−", () => run("window.minimize")))
        .child(button("maximize", "□", () => run("window.maximize")))
        .child(button("close-window", svg("mods/pane/close.svg").size(13), () => run("window.close"))));
    return v_flex().size_full().min_w(0).bg(t.chrome).justify_end()
      .child(div().flex_1())
      .child(row)
      .child(net(t, { right: true }));
  }
}
