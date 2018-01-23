import 'whatwg-fetch';
import _ from 'lodash';
import config from '../config.js';

const UPLOAD_PLAYLIST_ID = `UUJv5T2W-D3K3fYO0prgv5uw`;
const CHANNEL_INFO = `https://www.googleapis.com/youtube/v3/channels?id={0}&key=${config.API_KEY}&part=contentDetails`;
const VIDEO_STATS = `https://www.googleapis.com/youtube/v3/videos?part=statistics&key=${config.API_KEY}&id=`;
const PLAYLIST_VIDEOS = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId={0}&key=${config.API_KEY}&part=snippet&maxResults=50`;

const EMPTY_RESP = {
  nextPageToken: '',
  prevPageToken: '',
  numberOfPages: 0,
  videoStats: {}
}

let paginatedURL;
let cachedVideoStats;

function retrievePlaylistId(channelId) {
  if (!channelId) {
    return Promise.resolve('');
  }

  const url = CHANNEL_INFO.replace('{0}', channelId);

  return fetch(url)
    .then((resp) => resp.json())
    .then(data => {
      if (!data || !data.items || !data.items.length) {
        return;
      }

      return data.items[0].contentDetails.relatedPlaylists.uploads || '';
    });
}

function retrieveVideoIds({playlistId, useCache, nextPageToken, prevPageToken}) {
  if (!playlistId) {
    console.log('Error: no playlistId provided ', playlistId);
    return Promise.resolve(EMPTY_RESP);
  }

  if (nextPageToken) {
    paginatedURL = PLAYLIST_VIDEOS + `&pageToken=${nextPageToken}`;
  }

  if (prevPageToken) {
    paginatedURL = PLAYLIST_VIDEOS + `&pageToken=${prevPageToken}`;
  }

  const url = (paginatedURL || PLAYLIST_VIDEOS).replace('{0}', playlistId);
  return fetch(url)
    .then((resp) => resp.json()) // Transform the data into json
    .then(function (data) {
      if (!data || !data.items) {
        return EMPTY_RESP;
      }

      const videoInfo = data.items.reduce((videos, video) => {
        const snippet = video.snippet;
        const videoId = snippet.resourceId.videoId;
        const title = snippet.title;
        const thumbnails = snippet.thumbnails
        const url = 'https://www.youtube.com/watch?v=' + videoId;
        videos.videoData[videoId] = {
          videoId,
          title,
          thumbnails,
          url
        }

        videos.videoIds.push(videoId);

        return videos;
      }, { videoData: {}, videoIds: [] });
      const nextPageToken = data.nextPageToken;
      const prevPageToken = data.prevPageToken;
      const pageInfo = data.pageInfo;
      const numberOfPages = pageInfo.totalResults % pageInfo.resultsPerPage;

      videoInfo.numberOfPages = numberOfPages;
      videoInfo.nextPageToken = nextPageToken;
      videoInfo.prevPageToken = prevPageToken;

      return retrieveVideoStats(videoInfo);
    })
}

function retrieveVideoStats(videoInfo) {
  const url = VIDEO_STATS + videoInfo.videoIds.join();

  return fetch(url)
    .then(resp => resp.json())
    .then(data => {
      if (!data || !data.items) {
        return EMPTY_RESP;
      }

      const videoData = {};
      
      const videoStats = data.items.reduce((stats, video) => {
        stats[video.id] = {
          statistics: video.statistics,
          title: videoInfo.videoData[video.id].title,
          thumbnails: videoInfo.videoData[video.id].thumbnails,
          url: videoInfo.videoData[video.id].url
        }

        return stats;
      }, {});

      cachedVideoStats = videoStats;

      videoData.videoStats = cachedVideoStats;
      videoData.numberOfPages = videoInfo.numberOfPages;
      videoData.nextPageToken = videoInfo.nextPageToken;
      videoData.prevPageToken = videoInfo.prevPageToken;
      console.log('loc1 ', videoData);
      return videoData;
    });
}

export {retrievePlaylistId, retrieveVideoIds};