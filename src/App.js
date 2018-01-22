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
  }
  
  componentDidMount() {
    //setInterval(this.loadVideoStats, 10000);
  }

  componentWillMount() {
    this.getCachedChannelInfo();
  }

  getCachedChannelInfo() {
    if (chrome) {
      chrome.storage.sync.get('channelInfo', function(items) {
        message('Settings retrieved', items);
        this.setState({items});
      });
    }
  }

  paginateNext() {
    const newPage = this.state.pageNumber + 1;
    console.log('next new page ', newPage)
    if (newPage <= this.state.numberOfPages) {
      this.setState({ pageNumber: newPage });
      this.loadVideoStats(newPage);
    }
  }

  paginatePrev() {
    const newPage = this.state.pageNumber - 1;
    console.log('prev new page ', newPage)
    if (newPage >= 0 && this.state.prevPageToken) {
      this.setState({ pageNumber: newPage });
      this.loadVideoStats(newPage);
    }
  }

  loadVideoStats(pageNumber) {
    retrieveVideoIds({
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
    return {};
  }
  
  loadPlaylistId() {
    if (!this.state.channelId) {
      return;
    }
     console.log('loading playlist id for channel ', this.state.channelId)
    return retrievePlaylistId(this.state.channelId)
      .then(playlistId => {
        if (playlistId) {
          console.log('found playlist ', playlistId);
          this.setState({channelFound: true, playlistId});
          if (chrome) {
            chrome.storage.sync.set({'channelInfo': {
              channelId: this.state.channelId,
              playlistId
            }}, function() {
              message('Settings saved');
            });
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
