import React, { Component } from "react";
import { Spin } from "antd";
import jwt from "jsonwebtoken";
import moment from "moment";
import Layout from "./components/Layout/Layout";
import Signup from "./pages/Signup/Signup";

import styles from "./App.module.scss";

class App extends Component {
  state = { authenticated: null, userDetails: {} };

  componentDidMount = async () => {
    try {
      const tokenObj = await localStorage.getItem("token");
      if (tokenObj === null) {
        return this.setState({ authenticated: false });
      }
      const decodeToken = await jwt.decode(tokenObj);
      const { exp, id, name, email } = decodeToken;
      let authenticated = moment().isBefore(moment.unix(exp));
      this.setState({
        authenticated,
        userDetails: { id, name, email, token: tokenObj },
      });
    } catch (err) {
      console.log(err);
      this.setState({ authenticated: false });
    }
  };

  authHandler = async (value) => {
    this.setState({ authenticated: value });
  };

  render() {
    const { authenticated, userDetails } = this.state;
    if (authenticated === null) {
      return (
        <div className={styles.appContainer}>
          <Spin size="large" />
        </div>
      );
    }

    return (
      <>
        {authenticated ? (
          <Layout userDetails={userDetails} onAuth={this.authHandler} />
        ) : (
          <Signup onAuth={this.authHandler} />
        )}
      </>
    );
  }
}

export default App;
