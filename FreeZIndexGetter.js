export default (_class, zIndex) => {
  const elements = [...document.querySelectorAll(_class)];
  elements.forEach(el => {
    if (el.style.zIndex >= zIndex) {
      zIndex = el.style.zIndex + 1;
    }
  });
  return zIndex;
};
