/** Internal icon names to Fluent icon ids on Iconify. Add a name here before using it. */
export const fluent = {
  add: 'fluent:add-20-regular',
  check: 'fluent:checkmark-20-regular',
  'chevron-down': 'fluent:chevron-down-20-regular',
  'chevron-left': 'fluent:chevron-left-20-regular',
  'chevron-right': 'fluent:chevron-right-20-regular',
  'chevron-up': 'fluent:chevron-up-20-regular',
  close: 'fluent:dismiss-20-regular',
  error: 'fluent:error-circle-20-regular',
  info: 'fluent:info-20-regular',
  search: 'fluent:search-20-regular',
  spinner: 'fluent:spinner-ios-20-regular',
  warning: 'fluent:warning-20-regular',
} as const

export type IconName = keyof typeof fluent
