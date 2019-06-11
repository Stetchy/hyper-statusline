import React, { Component } from "react";
import {
  Footer,
  FooterGroup,
  FooterGroupOverflow,
  ComponentC,
  ComponentType,
  Cwd,
  Branch,
  Dirty,
  Ahead
} from "../StatusLineObjects/StatusLineObjects";
import Revolut from "../Revolut/Revolut";
import Network from "../Network/Network";
import arrows from "../../../resources/icons/arrows.svg";
import internet from "../../../resources/icons/internet.svg";
const revolut = require("../../../resources/icons/revolut.png");
const { exec } = require("child_process");
const axios = require("axios").default;
const afterAll = require("after-all-results");
const { shell } = require("electron");

let pid;
let cwd;

let git = {
  branch: "",
  remote: "",
  dirty: 0,
  ahead: 0
};

const setCwd = (pid, action) => {
  if (process.platform == "win32") {
    let directoryRegex = /([a-zA-Z]:[^\:\[\]\?\"\<\>\|]+)/im;
    if (action && action.data) {
      let path = directoryRegex.exec(action.data);
      if (path) {
        cwd = path[0];
        setGit(cwd);
      }
    }
  } else {
    exec(
      `lsof -p ${pid} | awk '$4=="cwd"' | tr -s ' ' | cut -d ' ' -f9-`,
      (err, stdout) => {
        cwd = stdout.trim();
        setGit(cwd);
      }
    );
  }
};

const isGit = (dir, cb) => {
  exec(
    `git rev-parse --is-inside-work-tree`,
    {
      cwd: dir
    },
    err => {
      cb(!err);
    }
  );
};

const gitBranch = (repo, cb) => {
  exec(
    `git symbolic-ref --short HEAD || git rev-parse --short HEAD`,
    {
      cwd: repo
    },
    (err, stdout) => {
      if (err) {
        return cb(err);
      }

      cb(null, stdout.trim());
    }
  );
};

const gitRemote = (repo, cb) => {
  exec(
    `git ls-remote --get-url`,
    {
      cwd: repo
    },
    (err, stdout) => {
      cb(
        null,
        stdout
          .trim()
          .replace(/^git@(.*?):/, "https://$1/")
          .replace(/[A-z0-9\-]+@/, "")
          .replace(/\.git$/, "")
      );
    }
  );
};

const gitDirty = (repo, cb) => {
  exec(
    `git status --porcelain --ignore-submodules -uno`,
    {
      cwd: repo
    },
    (err, stdout) => {
      if (err) {
        return cb(err);
      }

      cb(null, !stdout ? 0 : parseInt(stdout.trim().split("\n").length, 10));
    }
  );
};

const gitAhead = (repo, cb) => {
  exec(
    `git rev-list --left-only --count HEAD...@'{u}' 2>/dev/null`,
    {
      cwd: repo
    },
    (err, stdout) => {
      cb(null, parseInt(stdout, 10));
    }
  );
};

const gitCheck = (repo, cb) => {
  const next = afterAll((err, results) => {
    if (err) {
      return cb(err);
    }

    const branch = results[0];
    const remote = results[1];
    const dirty = results[2];
    const ahead = results[3];

    cb(null, {
      branch: branch,
      remote: remote,
      dirty: dirty,
      ahead: ahead
    });
  });

  gitBranch(repo, next());
  gitRemote(repo, next());
  gitDirty(repo, next());
  gitAhead(repo, next());
};

const setGit = repo => {
  isGit(repo, exists => {
    if (!exists) {
      git = {
        branch: "",
        remote: "",
        dirty: 0,
        ahead: 0
      };

      return;
    }

    gitCheck(repo, (err, result) => {
      if (err) {
        throw err;
      }

      git = {
        branch: result.branch,
        remote: result.remote,
        dirty: result.dirty,
        ahead: result.ahead
      };
    });
  });
};

export const middleware = store => next => action => {
  const uids = store.getState().sessions.sessions;

  switch (action.type) {
    case "SESSION_SET_XTERM_TITLE":
      pid = uids[action.uid].pid;
      break;

    case "SESSION_ADD":
      pid = action.pid;
      setCwd(pid);
      break;

    case "SESSION_ADD_DATA":
      const { data } = action;
      const enterKey = data.indexOf("\n") > 0;

      if (enterKey) {
        setCwd(pid, action);
      }
      break;

    case "SESSION_SET_ACTIVE":
      pid = uids[action.uid].pid;
      setCwd(pid);
      break;
  }

  next(action);
};

export default class StatusLine extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cwd,
      branch: "",
      remote: "",
      dirty: 0,
      ahead: 0,
      balance: new Set(),
      vaults: new Set(),
      ip: "",
      git
    };

    this.balanceCurrencies = {
      EUR: ["€", 3],
      GBP: ["£", 5],
      USD: ["$", 7]
    };

    this.vaultCurrencies = {
      EUR: ["€", 9],
      GBP: ["£", 11],
      USD: ["$", 13]
    };

    this.handleBranchClick = this.handleBranchClick.bind(this);
    this.handleCwdClick = this.handleCwdClick.bind(this);
    this.setBalance = this.setBalance.bind(this);
    this.setVaults = this.setVaults.bind(this);
  }

  handleCwdClick(event) {
    shell.openExternal("file://" + this.state.cwd);
  }

  handleBranchClick(event) {
    shell.openExternal(this.state.remote);
  }

  getInfo() {
    this.setBalance();
    this.setVaults();
  }

  async getIp() {
    let ip = "";
    await axios.get("https://api.ipify.org?format=json").then(resp => {
      ip = resp.data.ip;
    });
    return ip;
  }

  setBalance() {
    let { config } = this.props;
    let revConfig = config.getConfig().revolut;
    let token = revConfig.REV_TOKEN;
    let apiPath = revConfig.REV_API_PATH;
    let balance = new Set();
    exec(
      `cd ${apiPath} && python3 revolut_cli.py -l en --token=${token}`,
      (err, stdout) => {
        setTimeout(() => {
          revConfig.balanceCurrencies.map(c => {
            balance.add(
              `Balance: ${this.balanceCurrencies[c][0]}` +
                stdout.split(",")[this.balanceCurrencies[c][1]]
            );
          });
        }, 2000);
      }
    );
    this.setState({ balance });
  }

  setVaults() {
    let { config } = this.props;
    let revConfig = config.getConfig().revolut;
    let token = revConfig.REV_TOKEN;
    let apiPath = revConfig.REV_API_PATH;
    let vaults = new Set();
    exec(
      `cd ${apiPath} && python3 revolut_cli.py -l en --token=${token}`,
      (err, stdout) => {
        setTimeout(() => {
          revConfig.vaultCurrencies.map(c => {
            vaults.add(
              `Vault: ${this.vaultCurrencies[c][0]}` +
                stdout.split(",")[this.vaultCurrencies[c][1]]
            );
          });
        }, 2000);
      }
    );
    this.setState({ vaults });
  }

  async componentDidMount() {
    this.getInfo();
    this.interval2 = setInterval(() => this.getInfo(), 200000);
    this.interval = setInterval(() => {
      this.setState({
        cwd,
        branch: git.branch,
        remote: git.remote,
        dirty: git.dirty,
        ahead: git.ahead
      });
    }, 100);
    let ip = await this.getIp();
    this.setState({ ip });
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    clearInterval(this.interval2);
  }

  render() {
    return (
      <React.Fragment>
        <Footer>
          <FooterGroupOverflow>
            <Cwd
              title={this.state.cwd}
              onClick={this.handleCwdClick}
              hidden={!this.state.cwd}
              cwd={this.state.cwd}
            />
            <div
              style={{
                margin: "auto",
                marginLeft: "3px",
                marginRight: "3px"
              }}
            >
              &nbsp;
            </div>
            <ComponentC type="git">
              <Branch
                title={this.state.remote}
                onClick={this.handleBranchClick}
                hidden={!this.state.branch}
                branch={this.state.branch}
              />
              <Dirty
                title={`${this.state.dirty} dirty ${
                  this.state.dirty > 1 ? "files" : "file"
                }`}
                hidden={!this.state.dirty}
                dirty={this.state.dirty}
              />
              <Ahead
                title={`${this.state.ahead} ${
                  this.state.ahead > 1 ? "commits" : "commit"
                } ahead`}
                hidden={!this.state.ahead}
                ahead={this.state.ahead}
              />
            </ComponentC>
          </FooterGroupOverflow>
          <FooterGroup>
            <ComponentC type="cwd rev">
              <img
                src={revolut}
                style={{
                  height: "15px",
                  width: "15px",
                  margin: "auto"
                }}
              />
              <Revolut info={this.state.balance} />
              <div
                style={{
                  margin: "auto",
                  marginLeft: "3px",
                  marginRight: "3px"
                }}
              />
              <Revolut info={this.state.vaults} />
            </ComponentC>
            <ComponentType type="item">
              <img
                src={internet}
                style={{ margin: "auto", marginRight: "3px" }}
              />
              {this.state.ip}
            </ComponentType>
            <ComponentType type="item">
              <img
                src={arrows}
                style={{
                  margin: "auto",
                  marginRight: "3px"
                }}
              />
              <Network />
            </ComponentType>
          </FooterGroup>
        </Footer>
      </React.Fragment>
    );
  }
}
