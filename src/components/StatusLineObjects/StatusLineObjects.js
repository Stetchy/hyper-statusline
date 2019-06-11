import React from "react";
const tildify = require("tildify");

const Footer = props => (
  <footer className="footer_footer">{props.children}</footer>
);

const FooterGroup = props => (
  <div className="footer_group">{props.children}</div>
);

const FooterGroupOverflow = props => (
  <div className="footer_group group_overflow">{props.children}</div>
);

const ComponentC = props => (
  <div
    className={`component_component component_${props.type ? props.type : ""}`}
  >
    {props.children}
  </div>
);

const ComponentType = props => (
  <div className={`component_${props.type}`}>{props.children}</div>
);

const ItemType = props => (
  <div className={`item_${props.type}`}>{props.children}</div>
);

const Cwd = props => (
  <div
    className="component_item item_icon item_cwd item_clickable"
    title={props.title}
    hidden={props.hidden}
    onClick={props.onClick}
  >
    {tildify(String(props.cwd))}
  </div>
);

const Branch = props => (
  <div
    className={`component_item item_icon item_branch ${
      props.remote ? "item_clickable" : ""
    }`}
    title={props.title}
    onClick={props.onClick}
    hidden={!props.branch}
  >
    {props.branch}
  </div>
);

const Dirty = props => (
  <div
    className="component_item item_icon item_number item_dirty"
    title={props.title}
    hidden={!props.dirty}
  >
    {props.dirty}
  </div>
);

const Ahead = props => (
  <div
    className="component_item item_icon item_number item_ahead"
    title={props.title}
    hidden={!props.ahead}
  >
    {props.ahead}
  </div>
);

export {
  Footer,
  FooterGroup,
  FooterGroupOverflow,
  ComponentC,
  ComponentType,
  ItemType,
  Cwd,
  Branch,
  Dirty,
  Ahead
};
