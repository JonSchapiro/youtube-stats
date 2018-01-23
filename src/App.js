import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import 'whatwg-fetch';
import _ from 'lodash';
import {retrievePlaylistId, retrieveVideoIds} from './services/stats';
import mockData from './mock-data.json';
import Stats from './components/stats/Stats';
import {unregister} from './registerServiceWorker';
unregister();

let chrome = chrome || null;
let message = message || console.log;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      channelId: '',
      channelFound: false,
      videoStats: {},
      pageNumber: 0,
      numberOfPages: 0,
      nextPageToken: '',
      prevPageToken: '',
      playlistId: ''
    }

    this.loadVideoStats = this.loadVideoStats.bind(this);
    this.loadPlaylistId = this.loadPlaylistId.bind(this);
    this.paginatePrev = this.paginatePrev.bind(this);
    this.paginateNext = this.paginateNext.bind(this);
    this.updateChannelId= this.updateChannelId.bind(this);
    this.getCachedChannelInfo = this.getCachedChannelInfo.bind(this);
    this.logout = this.logout.bind(this);
  }

  componentWillMount() {
    this.getCachedChannelInfo();
  }

  getCachedChannelInfo() {
    if (window && window.localStorage) {
      const channelInfoString = window.localStorage.getItem('channelInfo');
      let channelInfo = null;
      try {
        channelInfo = JSON.parse(channelInfoString);
      } catch(e) {
        console.log('Error while reading channelInfo from local storage ', e);
      }

      if (channelInfo) {
        this.setState({channelId: channelInfo.channelId, playlistId: channelInfo.playlistId}, () => {
          this.loadVideoStats()
            .then(() => {
              this.setState({channelFound: true});
            });
        });
      }
    }
  }

  logout() {
    if (window && window.localStorage) {
      window.localStorage.clear();
      this.setState({
        channelId: '',
        channelFound: false,
        videoStats: {},
        pageNumber: 0,
        numberOfPages: 0,
        nextPageToken: '',
        prevPageToken: '',
        playlistId: ''
      });
    }
  }
  paginateNext() {
    const newPage = this.state.pageNumber + 1;

    if (newPage <= this.state.numberOfPages) {
      this.setState({ pageNumber: newPage });
      this.loadVideoStats(newPage);
    }
  }

  paginatePrev() {
    const newPage = this.state.pageNumber - 1;

    if (newPage >= 0 && this.state.prevPageToken) {
      this.setState({ pageNumber: newPage });
      this.loadVideoStats(newPage);
    }
  }

  loadVideoStats(pageNumber) {
    return retrieveVideoIds({
      useCache: false,
      pageNumber,
      nextPageToken: this.state.nextPageToken,
      prevPageToken: this.state.prevPageToken,
      playlistId: this.state.playlistId
    })
      .then(videoData => {
        this.setState({
          videoStats: videoData.videoStats,
          numberOfPages: videoData.numberOfPages,
          nextPageToken: videoData.nextPageToken || '',
          prevPageToken: videoData.prevPageToken || ''
        });
      });
  }
  
  loadPlaylistId() {
    if (!this.state.channelId) {
      return;
    }

    return retrievePlaylistId(this.state.channelId)
      .then(playlistId => {
        if (playlistId) {
          this.setState({playlistId}, () => {
            this.loadVideoStats()
              .then(() => {
                this.setState({channelFound: true, playlistId});
              });
          })
          if (window && window.localStorage) {
            const channelInfo = JSON.stringify({
              channelId: this.state.channelId,
              playlistId
            });
            try {
              window.localStorage.setItem('channelInfo', channelInfo);
            } catch(e) {
              console.log('Error while storing channelInfo in local storage', e);
            }
          }
        }
      })
  }

  updateChannelId(evt) {
    this.setState({channelId: evt.target.value});
  }
  render() {
    return this.state.channelFound ? (
      <div className="App">
        <table>
          <tbody>
            <th colSpan="9" id="stats-header">
              <td> YOUTUBE STATISTICS  </td>
            </th>
            <tr>
              <td>VIDEO</td>
              <td>VIEWS</td>
              <td>LIKES</td>
              <td>COMMENTS</td>
              <td>
                <button onClick={this.loadVideoStats}>refresh</button>
              </td>
              <td>
                <button onClick={this.logout}>logout</button>
              </td>
            </tr>
            <Stats videoStats={this.state.videoStats} />
            <tr>
              <td align="left" colSpan="4">
                <button onClick={this.paginatePrev}>Prev</button>
              </td>
              <td align="right" colSpan="4">
                <button onClick={this.paginateNext}>Next</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    ) : (
        <div className="App">
          Please, Enter Your Channel Id:
          <br/>
          <input value={this.state.channelId} onChange={evt => this.updateChannelId(evt)}/>
          <button onClick={this.loadPlaylistId}> Find Channel </button>
        </div>
      );
  }
}

export default App;
