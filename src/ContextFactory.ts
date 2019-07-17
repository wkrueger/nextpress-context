import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { ContextMapper } from 'ContextMapper'

export function ContextFactory(i: {
  withPrefix?: string
  projectRoot: string
  mappers: ContextMapper[]
}) {
  const prefix = i.withPrefix || ''
  const prefixUpper = prefix.toUpperCase()
  const pluginKeys = (i.mappers || []).reduce(
    (out, item) => {
      const envKeys = item.envKeys.map(key => prefixUpper + key)
      return [...out, ...envKeys]
    },
    [] as string[]
  )
  const pluginOptional = (i.mappers || []).reduce(
    (out, item) => {
      const optionalKeys = item.optionalKeys.map(key => prefixUpper + key)
      return [...out, ...optionalKeys]
    },
    [] as string[]
  )
  const required = pluginKeys.filter(k => pluginOptional.indexOf(k) === -1)
  if (!process.env.NO_ENVFILE) {
    const envfilePath = path.resolve(i.projectRoot, prefix + 'envfile.env')
    try {
      fs.statSync(envfilePath)
    } catch (err) {
      const scaffold = required.reduce((out, item) => {
        return out + `${item}=fill\n`
      }, '')
      fs.writeFileSync(envfilePath, scaffold)
      throw Error('envfile not found. Fill up the generated one.')
    }
    dotenv.config({
      path: path.resolve(i.projectRoot, prefix + 'envfile.env'),
    })
  }
  for (let x = 0; x < required.length; x++) {
    const key = required[x]
    if (process.env[key] === undefined) throw Error(`Required env key ${key} not defined.`)
  }
  const getKey = (key: string) => process.env[prefixUpper + key]
  const pluginContext = (i.mappers || []).reduce(
    (out, item) => {
      return {
        ...out,
        ...item.envContext({ getKey }),
      }
    },
    {} as any
  )
  return {
    projectRoot: i.projectRoot,
    pathFromRoot(...args: string[]) {
      return path.resolve(i.projectRoot, ...args)
    },
    loadedContexts: new Set<string>((i.mappers || []).map(m => m.id)),
    ...pluginContext,
    requireContext(...contextIds: string[]) {
      for (let i = 0; i < contextIds.length; i++) {
        const contextId = contextIds[i]
        if (!this.loadedContexts.has(contextId)) {
          throw Error(`context mapper with id: ${contextId} required but not found.`)
        }
      }
    },
  } as Nextpress.Context
}

declare global {
  namespace Nextpress {
    interface DefaultContext {
      projectRoot: string
      pathFromRoot: (...i: string[]) => string
      loadedContexts: Set<string>
      requireContext: (...contextIds: string[]) => void
    }
    interface CustomContext {}
    interface Context extends DefaultContext, CustomContext {}
  }
}
