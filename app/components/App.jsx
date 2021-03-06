import React, {Component} from "react";
import {connect} from "react-redux";
import {isAuthenticated} from "datawheel-canon";
import Helmet from "react-helmet";

import header from "../helmet.js";

import "./App.css";
import "./Islands.css";

import Clouds from "./Clouds";
import Footer from "./Footer";
import Nav from "./Nav";
import Loading from "./Loading";

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {userInit: false};
  }

  componentWillMount() {
    this.props.isAuthenticated();
  }

  componentDidUpdate() {
    const {auth} = this.props;
    const {userInit} = this.state;
    if (!userInit && auth.loading) this.setState({userInit: true});
  }

  render() {
    const {auth, children, i18n, location} = this.props;
    const {userInit} = this.state;

    const routes = location.pathname.split("/");

    const authRoute = routes[1] === "login";
    const bareRoute = routes.includes("projects") && routes.length === 4;

    const meta = header.meta.slice();
    if (i18n.locale === "en") {
      meta.find(d => d.property === "og:image").content = "https://codelife.com/social/codelife-share-en.jpg";
      meta.find(d => d.property === "og:description").content = "Code School Brazil is a free online resource for high school students in Brazil to learn skills relevant to work in Brazil’s IT sector.";
    }

    return (
      <div id="app">
        <Helmet title={ header.title } link={ header.link } meta={ meta } />
        { userInit && !auth.loading || authRoute
        ? bareRoute ? children
        : <div className="container">
            <Clouds />
            <Nav logo={ !location.pathname.includes("login") } />
            { children }
            <Footer currentPath={location.pathname} className={ routes[1] === "lesson" && routes.length > 2 ? routes[2] : "" } />
          </div>
        : <div className="container">
            <Clouds />
            <Loading />
          </div> }
      </div>
    );

  }
}

const mapDispatchToProps = dispatch => ({
  isAuthenticated: () => {
    dispatch(isAuthenticated());
  }
});

export default connect(state => ({auth: state.auth, i18n: state.i18n}), mapDispatchToProps)(App);
