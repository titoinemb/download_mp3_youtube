const { exec } = require('child_process');
const path = require('path');
const NodeID3 = require('node-id3');
const axios = require('axios')

function dowload(url, callback) {
  return exec(__dirname + `\\bin\\yt-dlp.exe -x --audio-format mp3 -o "${__dirname}\\dwn-tmp\\%(title)s.%(ext)s" "${url}"`, (err, stdout, stderr) => {
    if (err) {
      return callback(err)
    };
    return callback(null, stdout);
  });
};

function convert(url, callback) {
  return exec(__dirname + `\\bin\\ffmpeg.exe -i "${url}" -codec:a libmp3lame -qscale:a 0 "${__dirname}\\download\\${url.split('\\').pop().replace('.mp3', '').trim()}.mp3"`, (err, stdout, stderr) => {
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
  let list = document.getElementById('menu1-text').value.split('\n');

  for (i = 0; i <= list.length - 1; i++) {
    if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(list[i])) {
      let url = list[i];
      dowload(list[i], (err, result) => {
        if (!err) {
          let extractedFile = (result.split('[ExtractAudio] Destination: ')[1] || '').split('\n')[0].trim();
          convert(extractedFile, (err) => {
            if (!err) {
              deleteFile(extractedFile, (err) => {
                if (!err) {
                  // metadata(__dirname+"\\download\\"+extractedFile.split('\\').pop().replace('.mp3', '').trim()+".mp3", url);
                  if(i = list.length-1) {
                    document.getElementById("load").style.display = "none";
                    document.getElementById("file").style.display = "block";
                  };
                };
              });
            };
          });
        };
      });
    };
  };

});

document.getElementById('button-folder').addEventListener('click', () => {
  exec(`start "" "${__dirname}\\download\\"`)
});