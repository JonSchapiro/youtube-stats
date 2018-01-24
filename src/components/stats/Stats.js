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
              <td><a className="thumbnail-link" href={video.url} target="_blank"><img className="thumbnail" src={video.thumbnails.high.url} alt={video.title}/></a></td>
              <td>{video.statistics.viewCount}</td>
              <td>{video.statistics.likeCount}</td>
              <td>{video.statistics.commentCount}</td>
            </tr>
    })))
  }
}