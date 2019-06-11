import React, { Component } from "react";
import { ComponentType } from "../StatusLineObjects/StatusLineObjects";

export default class Revolut extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentInfo: 0
    };
    this.handleChangeInfo = this.handleChangeInfo.bind(this);
  }

  handleChangeInfo() {
    this.setState({
      currentInfo: (this.state.currentInfo + 1) % [...this.props.info].length
    });
  }

  render() {
    const { currentInfo } = this.state;
    let { info } = this.props;
    info = [...info];
    return (
      <div onClick={this.handleChangeInfo} className="revolut">
        <ComponentType
          type="item"
          title={info[currentInfo]}
          hidden={!info[currentInfo]}
        >
          {info[currentInfo]}
        </ComponentType>
      </div>
    );
  }
}
