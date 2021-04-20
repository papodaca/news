export interface ParsedItem {
  title: string[],
  link: string[],
  description: string[],
  guid: [{
    '_': string
    isPermaLink: boolean
  }]
}

export interface ParsedRss {
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
