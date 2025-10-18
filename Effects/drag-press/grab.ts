export const grab = {
  start: () => document.body.classList.add("gesture-grabbing"),
  end: () => document.body.classList.remove("gesture-grabbing"),
};

export const resize = {
  start: () => document.body.classList.add("gesture-resizing"),
  end: () => document.body.classList.remove("gesture-resizing"),
};
