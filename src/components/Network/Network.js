import React, { Component } from "react";
import * as si from "systeminformation";

export default class Network extends Component {
  constructor(props) {
    super(props);
    this.state = {
      up: 0,
      down: 0
    };
    this.getRates = this.getRates.bind(this);
    this.calculate = this.calculate.bind(this);
  }

  componentDidMount() {
    this.getRates();
    this.interval = setInterval(() => this.getRates(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  calculate(data) {
    const rawData = data / 1024;
    return (rawData > 0 ? rawData : 0).toFixed();
  }

  getRates() {
    si.networkStats("Wi-Fi", rates => {
      this.setState({
        up: this.calculate(rates[0].tx_sec),
        down: this.calculate(rates[0].rx_sec)
      });
    });
  }

  render() {
    const { up, down } = this.state;
    return (
      <React.Fragment>
        {down}kB/s {up}kB/s
      </React.Fragment>
    );
  }
}
