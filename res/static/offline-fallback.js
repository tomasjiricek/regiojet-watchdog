function getPageChild() {
    var block = document.createElement('div');
    var description = document.createElement('p');
    var heading = document.createElement('h3');
    var image = document.createElement('img');

    block.style.cssText = 'text-align: center; font-family: Arial, sans-serif;';
    description.innerText = 'Bez internetu to fungovat nebude :(';
    heading.innerText = 'Aplikace nemá přístup k internetu.';
    image.src = '/static/images/icons/icon-256.png';

    block.appendChild(image);
    block.appendChild(heading);
    block.appendChild(description);

    return block;
}

document.getElementById('app').appendChild(getPageChild());
