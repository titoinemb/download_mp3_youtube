const { exec, } = require('child_process');
const path = require('path');
const NodeID3 = require('node-id3');
const fs = require('fs');
const iconv = require('iconv-lite');
const axios = require('axios');
const puppeteer = require('puppeteer');

function download(url, callback) {
  let command = `${__dirname}\\bin\\yt-dlp.exe -x --audio-format mp3 -o "${__dirname}\\dwn-tmp\\%(title)s.%(ext)s" "${url}"`;

  exec(command, { encoding: 'buffer' }, (err, stdout, stderr) => {
    if (err) {
      console.error('Erreur:', iconv.decode(stderr, 'utf-8'));
      return callback(err);
    }
    return callback(null, iconv.decode(stdout, 'utf-8'));
  });
}

function convert(url, callback) {
  return exec(__dirname + `\\bin\\ffmpeg.exe -i "${url}" -codec:a libmp3lame -qscale:a 0 "${__dirname}\\download\\${url.split('\\').pop().replace('.mp3', '').trim()}.mp3"`, 'utf8', (err, stdout, stderr) => {
    if (err) {
      console.error(`err : ${err}`);
      return callback(err)
    };
    if (stderr) {
      console.error(`Stderr : ${stderr}`);
    };

    return callback(null, stdout);
  });
};

function deleteFile(url, callback) {
  return exec(`del "${url}"`, (err, stdout, stderr) => {
    if (err) {
      console.error(`err : ${err}`);
      return callback(err)
    };
    if (stderr) {
      console.error(`Stderr : ${stderr}`);
    };

    return callback(null, stderr);
  });
};

function metadata(file, url) {
  axios.get("https://www.youtube.com/oembed?format=json&url=" + url)
  .then(response => {
    let data = response.data;

    NodeID3.write({
      title: data.title,
      artist: data.author_name,
      album: data.author_name,
      year: new Date().getFullYear(),
    });

    console.log(data);
  });
};

async function getYtInitialData(playlistUrl) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  try {
    await page.goto(playlistUrl, { waitUntil: 'networkidle2' });
    await page.waitForSelector('body');
    const ytInitialData = await page.evaluate(() => {
      return window.ytInitialData;
    });
    await browser.close();
    return ytInitialData.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;

  } catch (error) {
    console.error('Erreur:', error);
    await browser.close();
    return null;
  };
};

function removeYouTubePlaylistUrls(url) { 
  const regex = /^https:\/\/www\.youtube\.com\/playlist\?list=/; 
  return url.filter(url => !regex.test(url));
};

document.getElementById('menu1-button').addEventListener('click', () => {
  document.getElementById("load").style.display = "block";
  const list1 = document.getElementById('menu1-text').value.split('\n');
  const list = removeYouTubePlaylistUrls(list1);

  function getYouTubePlaylistUrls(urls) {
      const regex = /^https:\/\/www\.youtube\.com\/playlist\?list=/;
      let playlistUrls = [];

      for (let i = 0; i < urls.length; i++) {
          if (regex.test(urls[i])) {
              playlistUrls.push(urls[i]);
          };
      };

      return playlistUrls;
  };

  const playlistUrls = getYouTubePlaylistUrls(list1);

  for(i=0;i<=playlistUrls.length-1;i++) {
    getYtInitialData(playlistUrls[i])
    .then(data => {
      if (data) {
        for(i=0;i<=data.length-1;i++) {
          list.push("https://www.youtube.com/watch?v="+data[i].playlistVideoRenderer.videoId);
        };
      };
    });
  };


  setTimeout(() => {
    var ll = list.length - 1;
    for (i = 0; i <= ll; i++) {
      if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(list[i])) {
        let url = list[i];
        download(url, (err, result) => {
          console.log(result)
          if (!err) {
            axios.get('https://www.youtube.com/oembed?format=json&url=' + url)
              .then(response => {
                let url_file = `${__dirname}\\dwn-tmp\\${response.data.title}.mp3`;
                let final_url = `${__dirname}\\download\\${response.data.title}.mp3`
                if (fs.existsSync(final_url)) {
                  deleteFile(final_url);
                };
                convert(url_file, (err) => {
                  if (!err) {
                    deleteFile(url_file, () => {
                      // metadata(final_url, url);
                      if (ll == 0) {
                        document.getElementById("load").style.display = "none";
                      };
                      if (i == list.length) {
                        document.getElementById("load").style.display = "none";
                      };
                    });
                  };
                });
              });
          };
        });
      } else {
        if (ll == 0) {
          document.getElementById("load").style.display = "none";
        };
      };
      if (i == list.length) {
        document.getElementById("load").style.display = "none";
      };
    };
  }, 10000);
});

document.getElementById('button-folder').addEventListener('click', () => {
  exec(`start "" "${__dirname}\\download\\"`)
});