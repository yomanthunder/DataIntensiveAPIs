const {format,write} = require('fast-csv');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const videoDataModel = require('../Modals/video.model');

const API_KEY = process.env.YOUTUBE_API_KEY;
// defined globally as we will be using this data for fetching video related data 

async function fetchVideoId(genre,totalNoVideos){
    let videoIds = [];
    let nextPageToken = '';
    let retry_count = 0;
    while(videoIds.length<totalNoVideos){
        try{
            const searchResponse = await axios({
                url:'https://www.googleapis.com/youtube/v3/search',
                method:'get',
                params:{
                    part: 'snippet', // to avoid overfetching data and reducing  bandwidth 
                    q: genre, // specifies the term for search 
                    type:'video',
                    maxResults: 50,
                    key:API_KEY,
                    order:'viewCount',// to get the data which has more value and audiance friendly
                    pageToken:nextPageToken, // to get distinct set of page data evey time 
                }, 
            })
            videoIds.push(...searchResponse.data.items.map((item)=>item.id.videoId));
            nextPageToken = searchResponse.data.nextPageToken;
            if(!nextPageToken) break;
        }
        catch(error){
            retry_count++;
            if(retry_count>20){
                return -1;
            }
            continue;
        }
    }
    console.log('Data fetched successfully ')
    return videoIds;
}
//writing data to a csv file 

async function fetchVideoData(videoIds,s,e){
    try{
        const videoResponse = await axios({
            url:'https://www.googleapis.com/youtube/v3/videos',
            method:'get',
            params:{
                part:'snippet,statistics,contentDetails,topicDetails',
                id: videoIds.slice(s,e).join(','), // make sure check the boundary condition
                key:API_KEY,
            }
        })
        return videoResponse.data.items.map((item)=>{
            let data = {...videoDataModel};
            data.videoUrl =`https://www.youtube.com/watch?v=${item.id}`;
            data.title = item.snippet.title;
            data.description = item.snippet.description;
            data.channelTitle = item.snippet.channelTitle;
            data.tags = item.snippet.tags || [];
            data.category = item.topicDetails?.topicCategories?.[0] || 'Unknown';
            data.topicDetails = item.topicDetails?.topicCategories || [];
            data.publishedAt = item.snippet.publishedAt;
            data.duration = item.contentDetails.duration;
            data.viewCount = parseInt(item.statistics.viewCount, 10) || 0;
            data.commentCount = parseInt(item.statistics.commentCount, 10) || 0;
            if(item.contentDetails.caption!=''){
                data.captionsAvailable = true;
                data.captionText = item.contentDetails.caption;
            }
            if (item.recordingDetails?.location) {
                data.location.latitude = item.recordingDetails.location.latitude;
                data.location.longitude = item.recordingDetails.location.longitude;
            }
            return data;
        });
    }
    catch(error){
        console.log(`Error fetching video data ${error}`)
        return -1; // requestion failed 
    } 
}
async function writeDataToCSV(req,res){
    let {genre,totalNoVideos} = req.query;
    let videoIds = await fetchVideoId(genre,totalNoVideos);
    if(videoIds==-1){
        return res.status(503).send(`Error fetching data from the server,may be the daily limit has reached`);
    }
     const filePath = path.resolve(__dirname,'tmp.csv');
     const fileExists = fs.existsSync(filePath);
     const stream = fs.createWriteStream(filePath, { flags: 'a' });// flag used for appending data into the csv file 
     const chunksize = 50;
     const k = Math.ceil(videoIds.length/chunksize);
     for(let i=0;i<k;i++){
        let s = chunksize*i;
        let e = Math.min(chunksize * (i + 1), videoIds.length);
        let videoData = await fetchVideoData(videoIds,s,e);
        if(videoData==-1){
            console.log(`Failed to fetch Video data of ${i}th chunck data`);
            continue;// skip the data chunk and move on 
        }
        console.log(`processing index ${i+1}`);
        await new Promise((resolve, reject) => {
            const csvStream = format({ headers: !fileExists && i === 0, includeEndRowDelimiter: true });
            csvStream
                .on('error', reject)
                .on('end', resolve);
            csvStream.pipe(stream, { end: false });
            videoData.forEach((row) => csvStream.write(row));
            csvStream.end();
        });
     }
     stream.end(() => {
        res.status(200).send(`All data written to CSV`);
    });
}
module.exports = {
    writeDataToCSV,
}