window.addEventListener('DOMContentLoaded', () => {
  const { Titlebar } = require("custom-electron-titlebar");

  new Titlebar({
    backgroundColor: 'rgb(172, 22, 22)',
    icon: "./icon.png",
    menu: null
  });

  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  };
});