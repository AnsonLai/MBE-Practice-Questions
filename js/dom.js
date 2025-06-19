// js/dom.js - DOM element caching and access

/**
 * DOM element cache to avoid repeated document.getElementById calls
 */
const domElements = {};

/**
 * Selector cache for frequently used selectors
 */
const selectorCache = {};

/**
 * Get a DOM element by ID, caching the result for future use
 * @param {string} id - The ID of the element to retrieve
 * @returns {HTMLElement|null} - The DOM element or null if not found
 */
export function getElement(id) {
  if (!domElements[id]) {
    domElements[id] = document.getElementById(id);
  }
  return domElements[id];
}

/**
 * Get a DOM element by selector, with optional caching
 * @param {string} selector - CSS selector
 * @param {boolean} [cache=false] - Whether to cache the result
 * @returns {HTMLElement|null} - The first matching DOM element or null if not found
 */
export function querySelector(selector, cache = false) {
  if (cache) {
    if (!selectorCache[selector]) {
      selectorCache[selector] = document.querySelector(selector);
    }
    return selectorCache[selector];
  }
  return document.querySelector(selector);
}

/**
 * Get multiple DOM elements by selector, with optional caching
 * @param {string} selector - CSS selector
 * @param {boolean} [cache=false] - Whether to cache the result
 * @returns {NodeList|Array} - List of matching DOM elements
 */
export function querySelectorAll(selector, cache = false) {
  if (cache) {
    if (!selectorCache[selector]) {
      // Convert NodeList to Array for consistency and to prevent live updates
      selectorCache[selector] = Array.from(document.querySelectorAll(selector));
    }
    return selectorCache[selector];
  }
  return document.querySelectorAll(selector);
}

/**
 * Initialize all DOM element references at once
 * @param {Object} elementIds - Object mapping variable names to element IDs
 * @returns {Object} - Object with all the DOM elements
 */
export function initializeElements(elementIds) {
  const elements = {};
  
  for (const [name, id] of Object.entries(elementIds)) {
    elements[name] = getElement(id);
  }
  
  return elements;
}

/**
 * Initialize DOM elements using selectors
 * @param {Object} selectors - Object mapping variable names to CSS selectors
 * @param {boolean} [cache=false] - Whether to cache the selectors
 * @returns {Object} - Object with all the DOM elements
 */
export function initializeElementsBySelector(selectors, cache = false) {
  const elements = {};
  
  for (const [name, selector] of Object.entries(selectors)) {
    elements[name] = querySelector(selector, cache);
  }
  
  return elements;
}

/**
 * Clear the DOM element cache (useful for testing or when DOM changes)
 */
export function clearCache() {
  for (const key in domElements) {
    delete domElements[key];
  }
  
  for (const key in selectorCache) {
    delete selectorCache[key];
  }
}

/**
 * Create an element with optional attributes and children
 * @param {string} tagName - The HTML tag name
 * @param {Object} attributes - Optional attributes to set on the element
 * @param {Array|string} children - Optional children (string for text content)
 * @returns {HTMLElement} - The created element
 */
export function createElement(tagName, attributes = {}, children = []) {
  const element = document.createElement(tagName);
  
  // Set attributes
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      element[key] = value;
    }
  }
  
  // Add children
  if (typeof children === 'string') {
    element.textContent = children;
  } else if (Array.isArray(children)) {
    children.forEach(child => {
      if (child instanceof Node) {
        element.appendChild(child);
      } else if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      }
    });
  }
  
  return element;
}