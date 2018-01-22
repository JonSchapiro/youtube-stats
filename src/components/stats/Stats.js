import React, { Component } from 'react';
import _ from 'lodash';

export default class Stats extends Component {
  constructor(props) {
    super(props);
    this.state = {
      videoStats: props.videoStats || {}
    };
  }

  componentWillReceiveProps(props) {
    this.setState({videoStats: props.videoStats || {}});
  }

  render() {
    return (_.map(this.state.videoStats, (video => {
      return <tr>
              <td><a href={video.url} target="_blank"><img src={video.thumbnails.default.url} alt={video.title} height="52" width="52"/></a></td>
              <td>{video.statistics.viewCount}</td>
              <td>{video.statistics.likeCount}</td>
              <td>{video.statistics.commentCount}</td>
            </tr>
    })))
  }
}