import { LogType } from '../../types'
import { BaseParser } from './base.parser'
import { NginxParser } from './nginx.parser'
import { ZScalerParser } from './zscaler.parser'

const PARSER_MAP: Record<string, BaseParser> = {
  nginx: new NginxParser(),
  zscaler: new ZScalerParser(),
}

export function getParser(logType: LogType): BaseParser | null {
  return PARSER_MAP[logType] ?? null
}

export { detectLogType } from './detector'
export { BaseParser } from './base.parser'
export { NginxParser } from './nginx.parser'
export { ZScalerParser } from './zscaler.parser'
