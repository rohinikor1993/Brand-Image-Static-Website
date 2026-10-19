const React = require('react');
const { hydrateRoot } = require('react-dom/client');
const HeroSlider = require('../components/hero-slider');

const root = document.getElementById('homepage-hero-root');
if (root) {
  const slides = JSON.parse(root.getAttribute('data-slides'));
  hydrateRoot(root, React.createElement(HeroSlider, { slides }));
}
