import axios from "axios";
import React, {Component} from "react";
import {translate} from "react-i18next";
import CodeBlockCard from "components/CodeBlockCard";
import "./Profile.css";

/**
 * Class component for displaying lists of user's snippets.
 * This is shown on the public profile for a user and requires sending
 * 1 prop: a ref to the user
 */
class UserSnippets extends Component {

  /**
   * Creates the UserSnippets component with initial state.
   * @param {boolean} loading - true by defaults gets flipped post AJAX.
   * @param {array} snippets - Gets set by AJAX call from DB call.
   */
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      snippets: [],
      likes: null
    };
  }

  /**
   * Grabs user id from user prop, makes AJAX call to server and returns
   * the list of snippets.
   */
  componentDidMount() {
    const {user} = this.props;
    const sget = axios.get(`/api/snippets/byuser?uid=${user.id}`);
    const lkget = axios.get("/api/likes");
    
    Promise.all([sget, lkget]).then(resp => {
      const snippets = resp[0].data;
      const likes = resp[1].data;
      snippets.sort((a, b) => a.id - b.id);
      this.setState({loading: false, snippets, likes});
    });
  }

  render() {
    const {t} = this.props;
    const {loading, snippets, likes} = this.state;

    if (loading) return <h2>{ t("Loading codeblocks") }...</h2>;

    return (
      <div className="user-section">
        <h2>{ t("Code Blocks") }</h2>
        <div className="flex-row">
          { snippets.length
            ? snippets.map(cb => {
              if (likes.find(l => l.likeid === cb.id)) cb.liked = true;
              return <CodeBlockCard codeBlock={cb} />;
            })
            : <p>{ t("This user doesn't have any code blocks yet.") }</p>}
        </div>
      </div>
    );
  }
}

export default translate()(UserSnippets);
