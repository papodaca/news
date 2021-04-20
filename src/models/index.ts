import { createConnection, Connection, Repository, EntityManager } from 'typeorm'

import { Article } from './article'

export * from './article'

export interface DI {
  connection: Connection
  em: EntityManager
  articleRepository: Repository<Article>
};

let DataStore: DI | null = null

export async function getStore (): Promise<DI> {
  if (DataStore === null) {
    const connection = await createConnection()
    DataStore = {
      connection,
      em: connection.manager,
      articleRepository: connection.getRepository(Article)
    }
  }
  return DataStore
}
