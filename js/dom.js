// js/dom.js - DOM element caching and access

/**
 * DOM element cache to avoid repeated document.getElementById calls
 */
const domElements = {};

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
 * Get a DOM element by selector, without caching (for one-time use)
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null} - The first matching DOM element or null if not found
 */
export function querySelector(selector) {
  return document.querySelector(selector);
}

/**
 * Get multiple DOM elements by selector, without caching (for one-time use)
 * @param {string} selector - CSS selector
 * @returns {NodeList} - List of matching DOM elements
 */
export function querySelectorAll(selector) {
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
 * Clear the DOM element cache (useful for testing or when DOM changes)
 */
export function clearCache() {
  for (const key in domElements) {
    delete domElements[key];
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