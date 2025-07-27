const tagTypeMap = {
    green: 'category',
    blue: 'label',
    red: 'discount'
};

const currencyTypeMap = {
    '₽': 'RUB',
    '$': 'USD',
    '€': 'EUR'
};

function shortTitle(title) {
    return title.split(' — ')[0];
}

function getPrice(priceObject) {
    const [priceStr, oldPriceStr] = priceObject.innerText.split(' ');
    const price = Number(priceStr.slice(1));
    const oldPrice = Number(oldPriceStr.slice(1));
    const currency = currencyTypeMap[priceStr[0]];

    return {
        price,
        oldPrice,
        currency
    };
}

function parseMeta(metaObject) {
    return {
        title: shortTitle(metaObject.querySelector('title')?.textContent.trim()),
        description: metaObject.querySelector('meta[name="description"]')?.content,
        keywords: metaObject.querySelector('meta[name="keywords"]')?.content.split(', '),
        language: metaObject.parentNode.lang || null,
        opengraph: Array.from(metaObject.querySelectorAll('meta[property^="og:"]'))
          .reduce((acc, metaTag) => {
              const key = metaTag.getAttribute('property').slice(3);
              const value = metaTag.getAttribute('content');
              acc[key] = key === 'title' ? shortTitle(value) : value;
              return acc;
          }, {})
    };
}

function parseProduct(productObject) {
    const priceData = getPrice(productObject.querySelector('div .price'));

    return {
        id: productObject.getAttribute('data-id'),
        name: productObject.querySelector('.title').textContent.trim(),
        isLiked: productObject.querySelector('.like').classList.contains('active'),
        tags: Array.from(productObject.querySelector('.tags').children)
          .reduce((acc, tag) => {
              const tagType = tagTypeMap[tag.className];
              const tagValue = tag.textContent.trim();
              tagType in acc ? acc[tagType].push(tagValue) : acc[tagType] = [tagValue];
              return acc;
          }, {}),
        price: priceData.price,
        oldPrice: priceData.oldPrice,
        discount: priceData.oldPrice - priceData.price,
        discountPercent: ((1 - priceData.price / priceData.oldPrice) * 100).toFixed(2) + '%',
        currency: priceData.currency,
        properties: Array.from(productObject.querySelectorAll('ul.properties li'))
          .reduce((acc, li) => {
              const [keyElem, valueElem] = Array.from(li.children);
              acc[keyElem.textContent.trim()] = valueElem.textContent.trim();
              return acc;
          }, {}),
        description: productObject.querySelector('.description').innerHTML.trim().replace(' class="unused"', ''),
        images: Array.from(productObject.querySelectorAll('nav button img'))
          .map(img => ({
              preview: img.src,
              full: img.dataset.src,
              alt: img.alt
          }))
    };
}

function parseSuggested(productsObjects) {
    return productsObjects.map(productObject => ({
        name: productObject.querySelector('h3').textContent.trim(),
        description: productObject.querySelector('p').textContent.trim(),
        image: productObject.querySelector('img').src,
        price: productObject.querySelector('b').textContent.trim().slice(1),
        currency: currencyTypeMap[productObject.querySelector('b').textContent.trim()[0]]
    }));
}

function parseReviews(reviewsObjects) {
    return reviewsObjects.map(reviewObject => ({
        rating: Array.from(reviewObject.querySelectorAll('span.filled')).length,
        author: {
            avatar: reviewObject.querySelector('img').src,
            name: reviewObject.querySelector('div[class="author"] span').textContent.trim()
        },
        title: reviewObject.querySelector('h3').textContent.trim(),
        description: reviewObject.querySelector('div p').textContent.trim(),
        date: reviewObject.querySelector('div[class="author"] i')
          .textContent.trim()
          .split('/')
          .join('.')
    }));
}

function parsePage() {
    const page = document;
    return {
        meta: parseMeta(page.head),
        product: parseProduct(page.querySelector('[data-id="product1"]')),
        suggested: parseSuggested(Array.from(page.querySelectorAll('.suggested article'))),
        reviews: parseReviews(Array.from(page.querySelectorAll('.reviews article')))
    };
}

window.parsePage = parsePage;