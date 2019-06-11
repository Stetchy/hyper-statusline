import decorateConfig from "./src/utils/decorateConfig";
import StatusLine, { middleware } from "./src/components/StatusLine/StatusLine";

exports.decorateConfig = decorateConfig;

exports.decorateHyper = (Hyper, { React }) =>
  class extends React.Component {
    constructor(props) {
      super(props);
    }
    componentDidUnmount() {
      clearInterval(this.interval);
    }

    render() {
      const { customChildren } = this.props;
      const existingChildren = customChildren
        ? customChildren instanceof Array
          ? customChildren
          : [customChildren]
        : [];

      return React.createElement(
        Hyper,
        Object.assign({}, this.props, {
          customInnerChildren: existingChildren.concat(
            React.createElement(StatusLine, { config }, null)
          )
        })
      );
    }
  };

exports.middleware = middleware;
