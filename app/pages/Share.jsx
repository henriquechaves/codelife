import React, {Component} from "react";
import {translate} from "react-i18next";
import axios from "axios";
import "./Share.css";

import Loading from "components/Loading";

class Share extends Component {

  constructor(props) {
    super(props);
    this.state = {
      content: null,
      user: null
    };
  }

  renderPage() {
    if (this.refs.rc) {
      const doc = this.refs.rc.contentWindow.document;
      doc.open();
      doc.write(this.state.content.studentcontent);
      doc.close();
      const {uid} = this.state.content;
      axios.get(`/api/user/${uid}/`).then(resp => {
        this.setState({user: resp.data});
      });
    }
  }

  componentDidMount() {
    const {username, filename} = this.props.params;
    let type = "";
    if (this.props.location.pathname.includes("/snippets/")) type = "snippet";
    if (this.props.location.pathname.includes("/projects/")) type = "project";
    if (type === "snippet") {
      console.log(username, filename);
      axios.get(`/api/snippets/byUsernameAndFilename?username=${username}&filename=${filename}`).then(resp => {
        console.log(resp);
        this.setState({content: resp.data[0]}, this.renderPage.bind(this));
      });
    }
    if (type === "project") {
      axios.get(`/api/projects/byUsernameAndFilename?username=${username}&filename=${filename}`).then(resp => {
        this.setState({content: resp.data[0]}, this.renderPage.bind(this));
      });
    }
  }

  render() {
    const {content, user} = this.state;

    if (!content) return <Loading />;

    const {t} = this.props;
    const {name} = content;

    return (
      <div id="share">
        <iframe id="iframe" ref="rc" />
        <div id="tag">
          <div className="info">
            <span className="pt-icon-standard pt-icon-code"></span>
            { name }{ user ? ` ${ t("by") } ` : "" }{ user ? <a className="user-link" href={ `/profile/${ user.username }` }>{ user.name || user.username }</a> : null }
          </div>
          <div className="logo">
            { t("Hosted by") } <a href="/"><img src="/logo/logo-sm.png" /></a>
          </div>
        </div>
      </div>
    );
  }
}

export default translate()(Share);
