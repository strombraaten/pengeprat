// Cache alle view-elementer én gang ved oppstart
let viewElements = null;

function hentViews() {
  if (!viewElements) {
    viewElements = document.querySelectorAll('.view');
  }
  return viewElements;
}

export function visView(id) {
  const mål = document.getElementById(id);
  if (!mål) {
    console.warn(`visView: fant ikke view med id "${id}"`);
    return;
  }
  hentViews().forEach((el) => el.classList.remove('aktiv'));
  mål.classList.add('aktiv');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
