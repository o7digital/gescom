// Shared interactions run after the deferred template scripts have loaded.
(() => {
  let lastScrollTop = window.scrollY;
  const header = document.querySelector('#header.sticky-on-scrollup');
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    header?.classList.toggle('show-sticky-onscroll', scrollTop <= lastScrollTop);
    lastScrollTop = scrollTop;
  }, { passive: true });

  document.querySelectorAll('.services-grid .feature-box').forEach(box => {
    box.addEventListener('mouseenter', () => box.classList.add('dark'));
    box.addEventListener('mouseleave', () => box.classList.remove('dark'));
  });
})();
