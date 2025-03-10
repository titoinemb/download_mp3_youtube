const { exec, } = require('child_process');
const path = require('path');
const NodeID3 = require('node-id3');
const fs = require('fs');
const iconv = require('iconv-lite');
const axios = require('axios');
const puppeteer = require('puppeteer');

const scrollDiv = document.getElementById('menu1-log-content');
let scrollAmount = 0;

function autoScroll() {
  scrollAmount += 100;
  scrollDiv.scrollTop = scrollAmount;

  if (scrollAmount >= scrollDiv.scrollHeight - scrollDiv.clientHeight) {
    scrollAmount = 0;
  }
}
setInterval(autoScroll, 50);

function logMsg(msg, type) {
  if (type == 0) {
    var color = 'red';
  } else if (type == 1) {
    var color = 'green';
  };
  document.getElementById('menu1-log-content').innerHTML += `<div style="color:${color};">${msg}</div>`;
};

function download(url, title, callback) {
  let command = `${__dirname}\\bin\\yt-dlp.exe -x --audio-format mp3 -o "${__dirname}\\dwn-tmp\\${title}.%(ext)s" "${url}"`;

  exec(command, { encoding: 'buffer' }, (err, stdout, stderr) => {
    if (err) {
      console.error('Erreur:', iconv.decode(stderr, 'utf-8'));
      return callback(err);
    }
    return callback(null, iconv.decode(stdout, 'utf-8'));
  });
};

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

async function metadata(file, url) {
  try {
    const response = await axios.get("https://www.youtube.com/oembed?format=json&url=" + url);
    let data = response.data;

    let mp3Buffer = fs.readFileSync(file);

    let tags = {
      title: data.title,
      artist: data.author_name,
      album: data.author_name,
      year: new Date().getFullYear(),
    };

    NodeID3.write(tags, mp3Buffer);
  } catch (error) {

  };
};

async function getYtInitialData(playlistUrl) {
  console.log(playlistUrl)
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
    logMsg('Error: all information is not valide', 0);
    await browser.close();
    return null;
  };
};

function transformUrls(urls) {
  return urls.map(url => {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const listId = urlParams.get('list');
    if (listId && url.startsWith('https://www.youtube.com/watch?v=')) {
      return `https://www.youtube.com/playlist?list=${listId}`;
    };
    return url;
  });
};

function removeYouTubePlaylistUrls(url) {
  const regex = /^https:\/\/www\.youtube\.com\/playlist\?list=/;
  return url.filter(url => !regex.test(url));
};

document.getElementById('menu1-button').addEventListener('click', () => {
  logMsg('Download started', 1);
  const list1 = transformUrls(document.getElementById('menu1-text').value.split('\n'));
  console.log(list1)
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

  for (i = 0; i <= playlistUrls.length - 1; i++) {
    getYtInitialData(playlistUrls[i])
      .then(data => {
        if (data) {
          for (i = 0; i <= data.length - 1; i++) {
            list.push("https://www.youtube.com/watch?v=" + data[i].playlistVideoRenderer.videoId);
          };
        };
      });
  };

  setTimeout(() => {
    async function processUrl(url) {
      const response = await axios.get('https://www.youtube.com/oembed?format=json&url=' + url);
      const title = response.data.title.replace(/[<>:"/\\|?*]/g, '');
      const url_file = path.join(__dirname, 'dwn-tmp', `${title}.mp3`);
      const final_url = path.join(__dirname, 'download', `${title}.mp3`);

      download(url, title, async (err, result) => {
        if (err) {
          reject(err);
        } else {
          console.log(result);

          try {
            if (fs.existsSync(final_url)) {
              deleteFile(final_url);
            };

            await new Promise((resolve, reject) => {
              convert(url_file, (err) => {
                if (!err) {
                  deleteFile(url_file, resolve);
                  metadata(final_url, url);
                  logMsg(final_url + ' Downloaded', 1);
                } else {
                  reject(err);
                }
              });;
            });

            resolve();
          } catch (error) {
            reject(error);
          };
        };
      });
    };

    async function processList(list) {
      for (let i = 0; i <= list.length - 1; i++) {
        const url = list[i];
        if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(url)) {
          try {
            await processUrl(url);
          } catch (error) {
            console.error(error);
          };
        };
      };
    };

    processList(list);
  }, 10000);
});

document.getElementById('button-folder').addEventListener('click', () => {
  exec(`start "" "${__dirname}\\download\\"`)
});