import axios from "axios";
import {connect} from "react-redux";
import {browserHistory, Link} from "react-router";
import React, {Component} from "react";
import {translate} from "react-i18next";
import {Button, Dialog, Intent, Popover, Position, Tooltip, Collapse, PopoverInteractionKind} from "@blueprintjs/core";
import CodeBlock from "components/CodeBlock";
import CodeBlockCard from "components/CodeBlockCard";
import IslandLink from "components/IslandLink";

import "./Level.css";

import gemIcon from "icons/gem.svg";

import Loading from "components/Loading";

class Level extends Component {

  constructor(props) {
    super(props);
    this.state = {
      levels: null,
      currentIsland: null,
      nextIsland: null,
      prevIsland: null,
      userProgress: null,
      myCodeBlocks: null,
      likedCodeBlocks: null,
      unlikedCodeBlocks: null,
      loading: false,
      testOpen: false,
      winOpen: false,
      winMessage: "",
      firstWin: false,
      showMore: false
    };
  }

  loadFromDB() {
    const {params, t} = this.props;
    const {lid} = params;
    const lget = axios.get(`/api/levels?lid=${lid}`);
    const iget = axios.get("/api/islands");
    const uget = axios.get("/api/userprogress");
    const cbget = axios.get(`/api/codeBlocks/allbylid?lid=${lid}`);
    const lkget = axios.get("/api/likes");

    Promise.all([lget, iget, uget, cbget, lkget]).then(resp => {
      const levels = resp[0].data;
      const islands = resp[1].data;
      const userProgress = resp[2].data;
      const allCodeBlocks = resp[3].data;
      const likes = resp[4].data;

      const currentIsland = islands.find(i => i.id === lid);
      // TODO: after august test, change this from index to a new ordering field
      // ALSO: add an exception for level 10.
      const nextOrdering = Number(currentIsland.ordering) + 1;
      const nextIsland = islands.find(i => Number(i.ordering) === Number(nextOrdering));
      const prevOrdering = Number(currentIsland.index) - 1;
      const prevIsland = islands.find(i => Number(i.ordering) === Number(prevOrdering));

      const myCodeBlocks = [];
      const likedCodeBlocks = [];
      const unlikedCodeBlocks = [];

      currentIsland.codeBlock = null;

      levels.sort((a, b) => a.ordering - b.ordering);
      allCodeBlocks.sort((a, b) => b.likes - a.likes || b.id - a.id);
      // Fold over snippets and separate them into mine and others
      for (const cb of allCodeBlocks) {
        cb.likes = Number(cb.likes);
        if (cb.uid === this.props.auth.user.id) {
          cb.username = t("you!");
          cb.mine = true;
          currentIsland.codeBlock = cb;
          if (likes.find(l => l.likeid === cb.id)) cb.liked = true;
          myCodeBlocks.push(cb);
        }
        else {
          // TODO: do this in a database join, not here.
          if (likes.find(l => l.likeid === cb.id)) {
            cb.liked = true;
            likedCodeBlocks.push(cb);
          }
          else {
            cb.liked = false;
            unlikedCodeBlocks.push(cb);
          }
        }
      }

      this.setState({levels, currentIsland, nextIsland, prevIsland, userProgress, myCodeBlocks, likedCodeBlocks, unlikedCodeBlocks, loading: false});
    });
  }

  componentDidUpdate() {
    const {location} = this.props;
    const {currentIsland, loading} = this.state;
    if (!loading && !currentIsland || currentIsland && currentIsland.id !== location.pathname.split("/")[2]) {
      this.setState({currentIsland: null, levels: null, userProgress: null, loading: true}, this.loadFromDB);
    }
  }

  componentDidMount() {
    // TODO: why is this here?
    this.forceUpdate();
  }

  toggleTest() {
    this.setState({testOpen: !this.state.testOpen});

    /*
    // If I'm about to close the test successfully for the first time
    if (this.state.testOpen && this.state.firstWin) {
      this.setState({winOpen: true, firstWin: false, testOpen: !this.state.testOpen});
    }
    else {
      this.setState({testOpen: !this.state.testOpen});
    }
    */

  }

  handleSave(newCodeBlock) {
    // TODO: i think i hate this.  when CodeBlock saves, I need to change the state of the snippet
    // so that subsequent opens will reflect the newly saved code.  In a perfect world, a CodeBlock save would
    // reload the updated snippet freshly from the database, but I also want to minimize db hits.  revisit this.
    const {currentIsland} = this.state;
    if (!currentIsland.codeBlock) currentIsland.codeBlock = newCodeBlock;
    this.setState(currentIsland);
  }

  onFirstCompletion() {
    // TODO: i'm reloading everything here because after the first completion, we need to
    // unlock all codeblocks AND show your brand-new written one at the top of the list.
    // perhaps revisit if this is on the heavy DB-interaction side?
    this.loadFromDB();
    const winMessage = this.state.currentIsland.victory;
    this.setState({firstWin: true, winMessage, testOpen: false, winOpen: true});
  }

  closeOverlay() {
    // this.setState({winOpen: false});
    // TODO: take out island 4 catcher after august
    if (this.state.nextIsland && this.state.nextIsland.id && this.state.nextIsland.id !== "island-4") {
      window.location = `/island/${this.state.nextIsland.id}`;
    }
    else {
      this.setState({winOpen: false});
    }
  }

  hasUserCompleted(milestone) {
    return this.state.userProgress.find(up => up.level === milestone) !== undefined;
  }

  reportLike(codeBlock) {
    // TODO: array clone not necessary, fix this
    const likedCodeBlocks = this.state.likedCodeBlocks.slice(0);
    const unlikedCodeBlocks = this.state.unlikedCodeBlocks.slice(0);
    if (codeBlock.mine) return;
    if (codeBlock.liked) {
      likedCodeBlocks.push(codeBlock);
      unlikedCodeBlocks.splice(unlikedCodeBlocks.map(cb => cb.id).indexOf(codeBlock.id), 1);
    }
    else {
      unlikedCodeBlocks.push(codeBlock);
      likedCodeBlocks.splice(likedCodeBlocks.map(cb => cb.id).indexOf(codeBlock.id), 1);
    }
    likedCodeBlocks.sort((a, b) => b.likes - a.likes || b.id - a.id);
    unlikedCodeBlocks.sort((a, b) => b.likes - a.likes || b.id - a.id);
    this.setState({likedCodeBlocks, unlikedCodeBlocks});
  }

  allLevelsBeaten() {
    const {levels} = this.state;
    let missedLevels = 0;
    for (const l of levels) {
      if (!this.hasUserCompleted(l.id)) missedLevels++;
    }
    return missedLevels === 0;
  }

  promptFinalTest() {
    return this.allLevelsBeaten() && !this.state.currentIsland.codeBlock;
  }

  showMore() {
    this.setState({showMore: !this.state.showMore});
  }

  buildWinPopover() {

    const {t} = this.props;
    const {name, theme} = this.state.currentIsland;

    return (
      <Dialog
        className={ theme }
        isOpen={this.state.winOpen}
        onClose={this.closeOverlay.bind(this)}
        title={ t("{{island}} Complete", {island: name}) }
      >
        <div className="pt-dialog-body">
          <div className="island-icon" style={{backgroundImage: `url('/islands/${theme}-small.png')`}} />
          {this.state.winMessage}
        </div>
        <div className="pt-dialog-footer">
            <div className="pt-dialog-footer-actions">
                <Button
                    className="pt-fill"
                    intent={Intent.PRIMARY}
                    onClick={this.closeOverlay.bind(this)}
                    text={t("Keep Exploring")}
                />
            </div>
        </div>
      </Dialog>
    );
  }

  buildTestPopover() {
    const {t} = this.props;
    const {currentIsland} = this.state;
    let title = t("myCodeblock", {islandName: currentIsland.name});
    if (currentIsland.codeBlock) title = currentIsland.codeBlock.snippetname;

    if (!this.allLevelsBeaten()) {
      return (
        <div className="editor-popover">
          <div className="code-block" onClick={this.toggleTest.bind(this)}>
            <div className="side bottom"></div>
            <div className="side top"></div>
            <div className="side left"></div>
            <div className="side front"></div>
          </div>
        </div>
      );
    }

    const next = this.promptFinalTest();

    return (
      <div className="editor-popover">
        <Tooltip isOpen={ next ? true : undefined } position={ next ? Position.BOTTOM : Position.TOP } content={ next ? t("Earn your CodeBlock") : t("CodeBlock") } tooltipClassName={ currentIsland.theme }>
          <div className={ `code-block ${ next ? "next" : "done" }` } onClick={this.toggleTest.bind(this)}>
            <div className="side bottom"></div>
            <div className="side top"></div>
            <div className="side left"></div>
            <div className="side front"><span className={ `pt-icon-standard pt-icon-${ next ? "help" : "code-block" }` }></span></div>
          </div>
        </Tooltip>
        <Dialog
          className={ `codeBlock ${ currentIsland.theme }` }
          isOpen={this.state.testOpen}
          onClose={this.toggleTest.bind(this)}
          title={ title }
          style={{
            height: "80vh",
            maxHeight: "1000px",
            width: "90%"
          }}
        >
          <div className="pt-dialog-body">
            <CodeBlock
              island={currentIsland}
              handleSave={this.handleSave.bind(this)}
              onFirstCompletion={this.onFirstCompletion.bind(this)}
            />
          </div>
        </Dialog>
      </div>
    );
  }

  render() {

    const {auth, t} = this.props;
    const {levels, currentIsland, nextIsland, prevIsland, userProgress, myCodeBlocks, likedCodeBlocks, unlikedCodeBlocks, showMore} = this.state;

    if (!auth.user) browserHistory.push("/login");
    if (!currentIsland || !levels || !userProgress) return <Loading />;

    const islandDone = this.hasUserCompleted(this.props.params.lid);
    const otherCodeBlocks = myCodeBlocks.concat(likedCodeBlocks, unlikedCodeBlocks);

    // Clone minilessons as to not mess with state
    // TODO: Clone not needed, fix this
    const levelStatuses = levels.slice(0);
    for (let l = 0; l < levelStatuses.length; l++) {
      const done = this.hasUserCompleted(levelStatuses[l].id);
      levelStatuses[l].isDone = done;
      // If i'm the first lesson and i'm not done, i'm next lesson
      // If i'm past the first lesson and i'm not done but my previous one is, i'm the next lesson
      levelStatuses[l].isNext = l === 0 && !done || l > 0 && !done && levelStatuses[l - 1].isDone;
    }

    const otherCodeBlockItemsBeforeFold = [];
    const otherCodeBlockItemsAfterFold = [];
    let top = 4;
    for (const cb of otherCodeBlocks) {
      const cbc = <CodeBlockCard theme={currentIsland.theme} icon={currentIsland.icon} codeBlock={cb} userProgress={userProgress} reportLike={this.reportLike.bind(this)}/>;
      top > 0 ? otherCodeBlockItemsBeforeFold.push(cbc) : otherCodeBlockItemsAfterFold.push(cbc);
      top--;
    }

    const levelItems = levelStatuses.map(level => {
      const {lid} = this.props.params;
      if (level.isDone) {
        const up = userProgress.find(p => p.level === level.id);
        const gems = up ? up.gems : 0;
        // const gemCount = gems > 1 ? `${gems} Gems` : `${gems} Gem`;
        return <Popover
          interactionKind={PopoverInteractionKind.HOVER}
          popoverClassName={ `stepPopover pt-popover pt-tooltip ${ currentIsland.theme }` }
          position={Position.TOP}
        >
          <Link className="stop done" to={`/island/${lid}/${level.id}`}></Link>
          <span>
            {level.name}
            <div className="gems"><img src={gemIcon} />{t("Gems")}: {gems}</div>
          </span>
        </Popover>;
      }
      else if (level.isNext) {
        return <Tooltip isOpen={true} position={ Position.BOTTOM } content={ level.name } tooltipClassName={ currentIsland.theme }>
          <Link className="stop next" to={`/island/${lid}/${level.id}`}></Link>
        </Tooltip>;
      }
      return <div className="stop"></div>;
    });

    return (
      <div id="island" className={ currentIsland.theme }>
        { this.buildWinPopover() }
        <div className="image">
          <h1 className="title">{ currentIsland.name }</h1>
          <p className="description">{ currentIsland.description }</p>
          <div id="path">
            { levelItems }
            { this.buildTestPopover() }
          </div>
        </div>
        { prevIsland ? <IslandLink done={true} width={250} island={prevIsland} description={false} /> : null}
        { /* TODO: RIP OUT THIS CRAPPY 3 BLOCKER AFTER AUGUST */}
        { nextIsland && Number(nextIsland.ordering) < 3  && this.hasUserCompleted(currentIsland.id) ? <IslandLink next={true} width={250} island={nextIsland} description={false} /> : null}
        { otherCodeBlocks.length
        ? <div>
            <h2 className="title">
              {t("Other Students' CodeBlocks")}&nbsp;
              { !islandDone
              ? <Popover
                interactionKind={PopoverInteractionKind.HOVER}
                popoverClassName="pt-popover-content-sizing user-popover"
                position={Position.TOP}
              >
              <span className="pt-icon pt-icon-lock"></span>
                <div>
                  { t("Earn your Codeblock for this Island to unlock the ability to view the source code of other codeblocks!") }
                </div>
              </Popover> : null }
            </h2>
            <div className="snippets">{otherCodeBlockItemsBeforeFold}</div>
            { otherCodeBlockItemsAfterFold.length
            ? <Collapse isOpen={showMore}><div className="snippets snippets-more">{otherCodeBlockItemsAfterFold}</div></Collapse>
            : null }
            { otherCodeBlockItemsAfterFold.length
            ? <div className="toggle-show" onClick={this.showMore.bind(this)}><span className={ `pt-icon-standard pt-icon-double-chevron-${ showMore ? "up" : "down" }` } />
                { showMore ? t("Show Less") : t("Show {{x}} More", {x: otherCodeBlockItemsAfterFold.length}) }
              </div>
            : null }
          </div>
        : null }
      </div>
    );
  }
}

Level = connect(state => ({
  auth: state.auth
}))(Level);
Level = translate()(Level);
export default Level;