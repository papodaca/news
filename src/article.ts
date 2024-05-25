import TurndownService from "turndown"
import { ArticleData, extract as extractArticle } from "@extractus/article-extractor"

export default class Article {
  title: string
  link: string
  description: string
  guid: string
  read: boolean = false

  constructor(title: string, link: string, description: string, guid: string, read: boolean = false) {
    this.title = title
    this.link = link
    this.description = description
    this.guid = guid
    this.read = read
  }

  static async create(title: string, link: string, description: string, guid: string): Promise<Article> {
    const article = new Article(title, link, description, guid)
    await article.fetchContent()
    return article
  }

  async fetchContent(): Promise<void> {
    const matches = /https:\/\/news.google.com\/__i\/rss\/rd\/articles\/((?:\w|\=)+)/.exec(this.link)
    if (matches) {
      let maybeUrl = Buffer.from(matches[1], 'base64').toString();
      const extractUrl = /((?:(?:https?:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)(?:(?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/.exec(maybeUrl)
      if (extractUrl) {
        this.link = extractUrl[1]
      }
    }
    let parsedArticle: ArticleData | null = null
    try {
      parsedArticle = await extractArticle(this.link)
    } catch (e) { }
    if (parsedArticle) {
      this.description = parsedArticle.content ?? this.description
      const ts = new TurndownService()
      ts.remove('img')
      ts.addRule('killlinks', {
        filter: ['a'],
        replacement: (_content, node) => {
          return node.textContent || ""
        }
      })
      this.description = ts.turndown(this.description)
      this.title = parsedArticle.title ?? this.title
    }
  }
}
