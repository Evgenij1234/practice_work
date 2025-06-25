import React from 'react';
import './System.css';
import { OpenSidebar } from '../store/store';
import {connect} from 'react-redux';



class System extends React.Component {
    constructor(props) {
        super(props);
      }
      min = ()=>{
        this.sustem("min");
      }
      max = ()=>{
        this.sustem("max");
      }
      close = ()=>{
        this.sustem("close");
      }
      sustem = (cifra) => {
        let win = window.electron.common(cifra);
      }
      openSidebar =()=>{
        this.props.OpenSidebar(true);
      }
    render() {
        return (
            <div className='System'>
                <div className='System-Top'>
                    <div className='System-Top-sp'>
                    </div>
                    <div className='System-Top-title'></div>
                    <div onClick={this.min} id='show_hide' className='win-btn btn-min'>
                        <svg width="13" height="3" viewBox="0 0 15 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line y1="1.5" x2="15" y2="1.5" stroke="white" stroke-width="3" />
                        </svg>
                    </div>
                    <div onClick={this.max} id='maximize' className='win-btn btn-max'>
                        <svg width="13" height="13" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1.5" y="1.5" width="12" height="12" stroke="white" stroke-width="3" />
                        </svg>
                    </div>
                    <div onClick={this.close} id='myId' className='win-btn btn-close1'>
                        <svg width="13" height="13" viewBox="0 0 20 20"  >
                            <path d="M1.64648 16.4957L16.4957 1.64642M2.35359 1.64642L17.2028 16.4957" stroke="white" stroke-width="3" />
                        </svg>
                    </div>
                    <div className='System-Top-sp'></div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        openClose: state.openClose
    }
  }

export default connect(mapStateToProps, { OpenSidebar }) (System)