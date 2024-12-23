const { exec, } = require('child_process');
const path = require('path');
const NodeID3 = require('node-id3');
const fs = require('fs');
const iconv = require('iconv-lite');
const axios = require('axios');

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


// function metadata(file, url, callback) {
//   axios.get("https://www.youtube.com/oembed?format=json&url=" + url)
//     .then(response => {
//       let data = response.data;

//       // Mettre à jour les métadonnées du fichier MP3
//       NodeID3.write({
//         title: data.title,
//         artist: data.author_name,
//         album: "YouTube",
//         year: new Date().getFullYear(),
//       }, file, (err) => {
//         if (err) {
//           console.error(`Erreur : ${err}`);
//           return callback(err);
//         } else {
//           return callback(null);
//         }
//       });

//       console.log(data);
//     })
//     .catch(err => {
//       console.error(`Erreur : ${err}`);
//       return callback(err);
//     });
// }


document.getElementById('menu1-button').addEventListener('click', () => {
  document.getElementById("load").style.display = "block";
  const list = document.getElementById('menu1-text').value.split('\n');

  var ll = list.length -1;

  for(i = 0; i <= ll; i++) {
    if(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(list[i])) {
      let url = list[i];
      download(url, (err, result) => {
        if (!err) {
          axios.get('https://www.youtube.com/oembed?format=json&url='+url) 
          .then(response => {
            let url_file = `${__dirname}\\dwn-tmp\\${response.data.title}.mp3`;
            
            if(fs.existsSync(`${__dirname}\\download\\${response.data.title}.mp3`)) {
              deleteFile(`${__dirname}\\download\\${response.data.title}.mp3`);
            };

            convert(url_file, (err) => {
              if (!err) {
                deleteFile(url_file, () => {
                  // metadata(__dirname+"\\download\\"+extractedFile.split('\\').pop().replace('.mp3', '').trim()+".mp3", url);
                  if(ll == 0) {
                    document.getElementById("load").style.display = "none";
                  };
                });
              };
            });
          }) ;
        };
      });
    } else {
      if(ll == 0) {
        document.getElementById("load").style.display = "none";
      };
    };

    if(i == list.length) {
      document.getElementById("load").style.display = "none";
    };
  };
});

document.getElementById('button-folder').addEventListener('click', () => {
  exec(`start "" "${__dirname}\\download\\"`)
});