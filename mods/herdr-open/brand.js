import { div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme, run, window } from "herdr";
import { ball, net, narrow, toggleSidebar, SERIF, NUM, tracked } from "./kit.js";

// The sidebar's head: a ball and "Herdr OPEN" like a tournament's wordmark,
// find and fold on the right, and the net's left post below, so the net runs
// on under the tab bar.
export class Brand {
  button(t, id, icon, tip, action) {
    return div().id(id).size(26).flex_none().flex().items_center().justify_center().rounded(13).text_color(t.muted)
      .hover((s) => s.bg(t.hover).text_color(t.foreground)).tooltip(tip)
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(action)
      .child(svg(`mods/workspace-chrome/${icon}.svg`).size(15));
  }

  render() {
    const t = theme();
    const collapsed = narrow();
    const mac = window()?.platform === "macos";
    const row = h_flex().h(39).flex_none().pl(collapsed ? 6 : 14).pr(10).gap(4).items_center()
      .when(mac && !window()?.fullscreen && !collapsed, (el) => el.pl(84))
      .when(!collapsed, (el) => el
        .child(h_flex().flex_1().min_w(0).gap(7).items_center()
          .child(ball(15))
          .child(h_flex().gap(6).items_baseline()
            .child(div().font_family(SERIF).italic().text_size(19).text_color(t.foreground).child("Herdr"))
            .child(div().font_family(NUM).font_bold().text_size(14).text_color(t.accent).child(tracked("OPEN")))))
        .child(this.button(t, "search", "search", "Find", () => run("mod.open", { name: "picker" }))))
      .when(!(collapsed && mac), (el) => el.child(this.button(t, "sidebar-toggle", "sidebar", "Fold the sidebar", toggleSidebar)));
    return v_flex().size_full().bg(t.chrome).justify_end()
      .child(div().flex_1())
      .child(row)
      .child(net(t, { left: true }));
  }
}
