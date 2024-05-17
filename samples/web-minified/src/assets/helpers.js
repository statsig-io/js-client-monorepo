function addResult(name, didPass) {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.marginBottom = '2px';
  container.setAttribute('x-test-did-pass', String(didPass));
  container.setAttribute('data-testid', name);

  const colorBox = document.createElement('div');
  colorBox.style.backgroundColor = didPass ? 'green' : 'red';
  colorBox.style.width = '20px';
  colorBox.style.height = '20px';
  colorBox.style.marginRight = '4px';

  const textElement = document.createElement('p');
  textElement.style.margin = '0';
  textElement.textContent = name;

  container.appendChild(colorBox);
  container.appendChild(textElement);

  document.body.appendChild(container);
}

function test(name, action) {
  let pass = false;
  try {
    pass = action();
  } catch (error) {
    console.error(`Error (${name}):`, error);
  }

  addResult(name, pass);
}

if (typeof module !== 'undefined') {
  module.exports = {
    test,
  };
}
