import { promisify } from "node:util"

import cron from 'node-cron'
import { parseString } from 'xml2js'

import Article from "./article"

interface ParsedItem {
  title: string[],
  link: string[],
  description: string[],
  guid: [{
    '_': string
    isPermaLink: boolean
  }]
}

interface ParsedRss {
  rss: {
    channel: [
      {
        title: string[],
        link: string[],
        description: string[],
        item: ParsedItem[]
      }
    ]
  }
}

const parseXml = promisify(parseString)

const urls = [
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
  'https://feeds.bbci.co.uk/news/technology/rss.xml',
  'https://feeds.bbci.co.uk/news/business/rss.xml',
]

const articles: Article[] = []
const readArticles: string[] = []

function sleep(time: number): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(res, time);
  })
}

async function maybeCreate(title: string, link: string, description: string, guid: string): Promise<void> {
  if (readArticles.includes(guid)) {
    return
  }
  if (articles.map(a => a.guid).includes(guid)) {
    return
  }

  articles.push(await Article.create(title, link, description, guid))
}

async function getLink(link: string): Promise<string> {
  let newLink: string | null = link
  while (link.includes("news.google.com")) {
    let res = await fetch(link, { redirect: "manual" })
    newLink = res.headers.get("location")
  }
  return newLink || link
}

type PasredItemField = 'title' | 'link' | 'description' | 'guid'

function extractItem(item: ParsedItem, name: PasredItemField) {
  const maybeItem = item[name][0]
  if (typeof maybeItem === 'string') {
    return maybeItem;
  } else if (typeof maybeItem === 'object' && typeof maybeItem['_'] === 'string') {
    return maybeItem['_']
  } else {
    return ''
  }
}

async function update() {
  for (let url of urls) {
    const res = await fetch(url)
    const parsed = await parseXml(await res.text()) as ParsedRss
    for (let item of parsed.rss.channel[0].item) {
      await maybeCreate(
        extractItem(item, 'title'),
        await getLink(extractItem(item, 'link')),
        extractItem(item, 'description'),
        extractItem(item, 'guid')
      )
    }
  }
}

cron.schedule('*/1 * * * *', update);
cron.schedule('*/5 * * * *', print);

async function print() {
  for (let step = 0; step < 10; step++) {
    let article = articles.pop()
    if (article != null) {
      console.log(`## ${article.title}`)
      console.log('')
      console.log(article.description)
      console.log('')
      console.log(`[1]: ${article.link}`)
      console.log('')
      console.log('')
    }
    await sleep(30 * 1000)
  }
}

update().then(print)
