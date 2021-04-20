import { promisify } from "util"

import cron from 'node-cron'
import fetch from "node-fetch"
import { parseString } from 'xml2js'

import { Article } from "./models"
import { ParsedItem, ParsedRss } from "./interfaces"

const parseXml = promisify(parseString)

const urls = [
  'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en', // world
  'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen', // science
  'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen', // technology
  'https://news.google.com/rss/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNRGxqTjNjd0VnSmxiaWdBUAE?hl=en-US&gl=US&ceid=US%3Aen', // us
]

type PasredItemField = 'title' | 'link' | 'description' | 'guid'

function extractItem(item: ParsedItem) {
  return  (name: PasredItemField) => {
    const maybeItem = item[name][0]
    if (typeof maybeItem === 'string') {
      return maybeItem;
    } else if (typeof maybeItem === 'object' && typeof maybeItem['_'] === 'string') {
      return maybeItem['_']
    } else {
      return ''
    }
  }
}

async function update() {
  for(let url of urls) {
    const res = await fetch(url)
    const parsed = await parseXml(await res.text()) as ParsedRss
    for(let item of parsed.rss.channel[0].item) {
      const extract = extractItem(item)
      await Article.findOrCreate(
        extract('title'),
        extract('link'),
        extract('description'),
        extract('guid')
      )
    }
  }
}

cron.schedule('*/1 * * * *', updateAndPrint);

async function updateAndPrint() {
  await update()

  for(let article of await Article.unread()) {
    console.log(`## ${article.title}`)
    console.log('')
    console.log(article.description)
    console.log('')
    console.log(`[1]: ${article.link}`)
    console.log('')
    console.log('')
    await article.markRead()
  }
};

updateAndPrint()