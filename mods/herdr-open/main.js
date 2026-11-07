// Herdr Open: a tennis stadium for your agents. One mod, several parts: the
// layout names `brand`, `tabs`, `status` or `score` in props; pane headers get
// { pane, terminal }. See kit.js for the shared pieces and match.js for the score.

import { View, div } from "gpui-kit";
import { props } from "herdr";
import { Brand } from "./brand.js";
import { Tabs } from "./tabs.js";
import { Status } from "./status.js";
import { Score } from "./score.js";
import { Pane } from "./pane.js";

const PARTS = { brand: Brand, tabs: Tabs, status: Status, score: Score };

export default class HerdrOpen extends View {
  init(_props, cx) {
    const Part = props()?.pane ? Pane : PARTS[props()?.part];
    this.part = Part ? new Part() : null;
    this.part?.init?.(cx);
  }

  render(cx) {
    return this.part ? this.part.render(cx) : div();
  }
}
