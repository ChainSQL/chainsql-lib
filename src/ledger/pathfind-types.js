/* @flow */
'use strict' // eslint-disable-line strict

import type {Amount, LaxLaxAmount, RippledAmount, Adjustment, MaxAdjustment,
  MinAdjustment} from '../common/types.js'


type Path = {
  source: Adjustment | MaxAdjustment,
  destination: Adjustment | MinAdjustment,
  paths: string
}

export type GetPaths = Array<Path>

export type PathFind = {
  source: {
    address: string,
    amount?: Amount,
    currencies?: Array<{currency: string, counterparty?:string}>
  },
  destination: {
    address: string,
    amount: LaxLaxAmount
  }
}

export type PathFindRequest = {
  command: string,
  source_account: string,
  destination_amount: RippledAmount,
  destination_account: string,
  source_currencies?: Array<string>,
  send_max?: RippledAmount
}

export type RippledPathsResponse = {
  alternatives: Array<{
    paths_computed: Array<Array<{
      type: number,
      type_hex: string,
      account?: string,
      issuer?: string,
      currency?: string
    }>>,
    source_amount: RippledAmount
  }>,
  type: string,
  destination_account: string,
  destination_amount: RippledAmount,
  destination_currencies?: Array<string>,
  source_account?: string,
  source_currencies?: Array<{currency: string}>,
  full_reply?: boolean
}
