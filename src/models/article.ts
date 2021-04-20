import TurndownService from "turndown";
import { ArticleData, extract as extractArticle } from "article-parser";
import { Entity, Column } from 'typeorm'
import { getStore } from '.'

@Entity()
export class Article {
  @Column({ type: 'text' })
  title!: string

  @Column({ type: 'text' })
  link!: string

  @Column({ type: 'text' })
  description!: string

  @Column({ type: 'text', unique: true, primary: true })
  guid!: string

  @Column({ type: 'boolean', default: 'false' })
  read!: boolean

  constructor (title: string, link: string, description: string, guid: string, read: boolean = false) {
    this.title = title
    this.link = link
    this.description = description
    this.guid = guid
    this.read = read
  }

  static async create (title: string, link: string, description: string, guid: string): Promise<Article> {
    const article = new Article(title, link, description, guid)
    await article.fetchContent()
    return article
  }

  async fetchContent (): Promise<void> {
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
    } catch(e) {}
    if (parsedArticle) {
      this.description = parsedArticle.content ?? this.description
      const ts = new TurndownService()
      this.description = ts.turndown(this.description)
      this.title = parsedArticle.title ?? this.title
    }
  }

  async markRead (): Promise<void> {
    const store = await getStore()
    this.read = true
    await store.articleRepository.save(this)
  }

  static async findOrCreate (title: string, link: string, description: string, guid: string): Promise<Article> {
    const store = await getStore()
    let article = await store.articleRepository.findOne({ guid })
    if (article != null) {
      return article
    }
    article = await Article.create(title, link, description, guid)
    await store.articleRepository.save(article)
    return article
  }

  static async unread (): Promise<Article[]> {
    const store = await getStore()
    return await store.articleRepository.find({ read: false })
  }
}
