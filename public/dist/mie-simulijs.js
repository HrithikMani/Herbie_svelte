(function(global) {
  const DEFAULT_BUTTON = 'left';
  const DEFAULT_DELAY = 100; // in milliseconds
  const DEFAULT_VIEW = window;

  function simulateClick(element, options = {}) {
    const { button = DEFAULT_BUTTON, callback, delay = DEFAULT_DELAY } = options;
    let buttonCode;

    switch (button) {
      case 'middle':
        buttonCode = 1;
        break;
      case 'right':
        buttonCode = 2;
        break;
      case 'left':
      default:
        buttonCode = 0;
    }

    setTimeout(() => {
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: DEFAULT_VIEW,
        button: buttonCode
      });
      element.dispatchEvent(event);

      if (typeof callback === 'function') {
        callback();
      }
    }, delay);
  }

  function simulateKeyPress(element, key, callback, delay = DEFAULT_DELAY) {
    setTimeout(() => {
      const inputEvent = new Event('input', {
        bubbles: true,
        cancelable: true,
        view: DEFAULT_VIEW
      });

      element.value += key;
      element.dispatchEvent(inputEvent);

      if (typeof callback === 'function') {
        callback();
      }
    }, delay);
  }

  function simulateKeyDown(keyCode, callback, delay = DEFAULT_DELAY) {
    setTimeout(() => {
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        view: DEFAULT_VIEW,
        keyCode: keyCode
      });
      document.dispatchEvent(event);

      if (typeof callback === 'function') {
        callback();
      }
    }, delay);
  }

  function simulateKeyUp(keyCode, callback, delay = DEFAULT_DELAY) {
    setTimeout(() => {
      const event = new KeyboardEvent('keyup', {
        bubbles: true,
        cancelable: true,
        view: DEFAULT_VIEW,
        keyCode: keyCode
      });
      document.dispatchEvent(event);

      if (typeof callback === 'function') {
        callback();
      }
    }, delay);
  }

  function simulateMouseEnter(element, callback, delay = DEFAULT_DELAY) {
    setTimeout(() => {
      const event = new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
        view: DEFAULT_VIEW
      });
      element.dispatchEvent(event);

      if (typeof callback === 'function') {
        callback();
      }
    }, delay);
  }

  function simulateMouseLeave(element, callback, delay = DEFAULT_DELAY) {
    setTimeout(() => {
      const event = new MouseEvent('mouseleave', {
        bubbles: true,
        cancelable: true,
        view: DEFAULT_VIEW
      });
      element.dispatchEvent(event);

      if (typeof callback === 'function') {
        callback();
      }
    }, delay);
  }

  function simulateFocus(element, callback, delay = DEFAULT_DELAY) {
    setTimeout(() => {
      const event = new FocusEvent('focus', {
        bubbles: true,
        cancelable: true,
        view: DEFAULT_VIEW
      });
      element.dispatchEvent(event);

      if (typeof callback === 'function') {
        callback();
      }
    }, delay);
  }

  function simulateChange(element, callback, delay = DEFAULT_DELAY) {
    setTimeout(() => {
      const event = new Event('change', {
        bubbles: true,
        cancelable: true,
        view: DEFAULT_VIEW
      });
      element.dispatchEvent(event);

      if (typeof callback === 'function') {
        callback();
      }
    }, delay);
  }

  function simulationSelector(value) {
    let element = document.getElementById(value) || 
                  document.querySelector(value) || 
                  document.querySelector(`.${value}`) || 
                  document.evaluate(value, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    return element;
  }

  global.simulijs = {
    simulateClick,
    simulateKeyPress,
    simulateKeyDown,
    simulateKeyUp,
    simulateMouseEnter,
    simulateMouseLeave,
    simulateFocus,
    simulateChange,
    simulationSelector
  };
})(window);
