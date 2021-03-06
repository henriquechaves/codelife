import React, {Component} from "react";
import {connect} from "react-redux";
import {translate} from "react-i18next";
import himalaya from "himalaya";

import CodeEditor from "components/CodeEditor";

import {cvContainsTag, cvContainsStyle, cvContainsSelfClosingTag} from "utils/codeValidation.js";

import {Toaster, Position, Intent, Alert} from "@blueprintjs/core";

class InputCode extends Component {

  constructor(props) {
    super(props);
    this.state = {
      mounted: false,
      currentText: "",
      titleText: "",
      baseText: "",
      resetAlert: false,
      gemEarned: false
    };
  }

  componentDidMount() {
    this.setState({mounted: true, baseText: this.props.htmlcontent2 ? this.props.htmlcontent2 : ""});
  }

  componentDidUpdate() {
    const newText = this.props.htmlcontent2 ? this.props.htmlcontent2 : "";
    if (this.state.baseText !== newText) {
      this.setState({baseText: newText, gemEarned: false});
      this.editor.getWrappedInstance().setEntireContents(newText);
    }
  }

  submitAnswer() {
    const {t, updateGems} = this.props;
    const {gemEarned} = this.state;
    const contents = this.editor.getWrappedInstance().getEntireContents();
    const jsonArray = himalaya.parse(contents);
    let errors = 0;
    const rulejson = JSON.parse(this.props.rulejson);
    const toast = Toaster.create({className: "submitToast", position: Position.TOP_CENTER});
    for (const r of rulejson) {
      if (r.type === "CONTAINS" && r.needle.substring(0, 1) !== "/") {
        if (!cvContainsTag(r, contents)) {
          errors++;
          toast.show({message: r.error_msg, timeout: 2000, intent: Intent.DANGER});
        }
      }
      if (r.type === "CSS_CONTAINS") {
        if (!cvContainsStyle(r, jsonArray)) {
          errors++;
          toast.show({message: r.error_msg, timeout: 2000, intent: Intent.DANGER});
        }
      }
      if (r.type === "CONTAINS_SELF_CLOSE") {
        if (!cvContainsSelfClosingTag(r, contents)) {
          errors++;
          toast.show({message: r.error_msg, timeout: 2000, intent: Intent.DANGER});
        }
      }
    }
    if (errors === 0) {
      toast.show({message: t("You got it right!"), timeout: 2000, intent: Intent.SUCCESS});
      this.props.unblock();
      if (!gemEarned) updateGems(1);
    }
    else {
      if (!gemEarned) updateGems(-1);
    }
    this.setState({gemEarned: true});
  }

  // TODO: sanitize htmlcontent to not be null so I don't have to do these tests
  resetAnswer() {
    this.editor.getWrappedInstance().setEntireContents(this.props.htmlcontent2 ? this.props.htmlcontent2 : "");
    this.setState({resetAlert: false});
  }

  attemptReset() {
    this.setState({resetAlert: true});
  }

  executeCode() {
    this.editor.getWrappedInstance().executeCode();
  }

  render() {
    const {t, htmlcontent1, htmlcontent2, island} = this.props;
    const {titleText} = this.state;

    const initialContent = htmlcontent2 ? htmlcontent2 : "";

    return (
      <div id="slide-container" className="renderCode flex-column">
        <Alert
            isOpen={ this.state.resetAlert }
            cancelButtonText={ t("Cancel") }
            confirmButtonText={ t("Reset") }
            intent={ Intent.DANGER }
            onCancel={ () => this.setState({resetAlert: false}) }
            onConfirm={ () => this.resetAnswer() }>
            <p>{t("Are you sure you want to reset the code to its original state?")}</p>
        </Alert>
        <div className="title-tab">{titleText}</div>
        <div className="flex-row">
          <div className="slide-text" dangerouslySetInnerHTML={{__html: htmlcontent1}} />
          { this.state.mounted ? <CodeEditor island={island} className="slide-editor" ref={c => this.editor = c} initialValue={initialContent} /> : <div className="slide-editor"></div> }
        </div>
        <div className="validation">
          <button className="pt-button" onClick={this.attemptReset.bind(this)}>{t("Reset")}</button>
          { this.props.exec ? <button className="pt-button pt-intent-warning" onClick={this.executeCode.bind(this)}>{t("Execute")}</button> : null}
          <button className="pt-button pt-intent-success" onClick={this.submitAnswer.bind(this)}>{t("Submit")}</button>
        </div>
      </div>
    );
  }
}

InputCode = connect(state => ({
  user: state.auth.user
}))(InputCode);
InputCode = translate()(InputCode);
export default InputCode;
