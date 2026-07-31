const fs = require('fs');
const vars = fs.readFileSync('.dev.vars', 'utf-8').split('\n');
let key = '', cx = '';
for(let line of vars) {
  if (line.startsWith('GOOGLE_SEARCH_API_KEY=')) key = line.split('=')[1].replace(/"/g, '').trim();
  if (line.startsWith('GOOGLE_SEARCH_ENGINE_ID=')) cx = line.split('=')[1].replace(/"/g, '').trim();
}

async function test() {
  const q = encodeURIComponent("獎學金");
  const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${q}`;

  const searchRes = await fetch(searchUrl, {
    headers: {
      "Referer": "https://nutccsie.org"
    }
  });
  const searchData = await searchRes.json();
  if (searchData.error) {
    console.log(JSON.stringify(searchData, null, 2));
  } else {
    console.log("Success! Items:", searchData.items ? searchData.items.length : 0);
  }
}

test();
