import "./null.css";
import "./App.css";
import React from "react";
import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import System from "./System/System";
import Exercise from "./Exercise/Exercise";
import { OpenSidebar } from "./store/store";
import { connect } from "react-redux";

class App extends React.Component {
  constructor(props) {
    super(props);
  }
  closeSidebar = () => {
    this.props.OpenSidebar(false);
  };
  render() {
    return (
      <div className="App">
        <System></System>
        <div className="top-gap"></div>
        <div className="App-content" onClick={this.closeSidebar}>
          <Exercise />
          
        </div>
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    openClose: state.openClose,
  };
};
export default connect(mapStateToProps, { OpenSidebar })(App);
