export type ErrorInfo = {
  level: string
  name: string
  title: string
}

const ERROR_INFO: ErrorInfo[] = [
  {
    level: 'critical',
    name: 'H10',
    title: 'App Crashed',
  },
  {
    level: 'critical',
    name: 'H11',
    title: 'Backlog too deep',
  },
  {
    level: 'critical',
    name: 'H12',
    title: 'Request Timeout',
  },
  {
    level: 'critical',
    name: 'H13',
    title: 'Connection closed without response',
  },
  {
    level: 'critical',
    name: 'H14',
    title: 'No web dynos running',
  },
  {
    level: 'warning',
    name: 'H15',
    title: 'Idle connection',
  },
  {
    level: 'warning',
    name: 'H16',
    title: 'Redirect to herokuapp.com',
  },
  {
    level: 'warning',
    name: 'H17',
    title: 'Poorly formatted HTTP response',
  },
  {
    level: 'critical',
    name: 'H18',
    title: 'Server Request Interrupted',
  },
  {
    level: 'critical',
    name: 'H19',
    title: 'Backend connection timeout',
  },
  {
    level: 'critical',
    name: 'H20',
    title: 'App boot timeout',
  },
  {
    level: 'critical',
    name: 'H21',
    title: 'Backend connection refused',
  },
  {
    level: 'critical',
    name: 'H22',
    title: 'Connection limit reached',
  },
  {
    level: 'critical',
    name: 'H23',
    title: 'Endpoint misconfigured',
  },
  {
    level: 'critical',
    name: 'H24',
    title: 'Forced close',
  },
  {
    level: 'critical',
    name: 'H25',
    title: 'HTTP Restriction',
  },
  {
    level: 'critical',
    name: 'H26',
    title: 'Request Error',
  },
  {
    level: 'info',
    name: 'H27',
    title: 'Client Request Interrupted',
  },
  {
    level: 'warning',
    name: 'H28',
    title: 'Client Connection Idle',
  },
  {
    level: 'critical',
    name: 'H31',
    title: 'Misdirected Request',
  },
  {
    level: 'warning',
    name: 'H80',
    title: 'Maintenance Mode',
  },
  {
    level: 'info',
    name: 'H81',
    title: 'Blank app',
  },
  {
    level: 'info',
    name: 'H82',
    title: "You've used up your dyno hour pool",
  },
  {
    level: 'critical',
    name: 'H99',
    title: 'Platform error',
  },
  {
    level: 'critical',
    name: 'R10',
    title: 'Boot timeout',
  },
  {
    level: 'warning',
    name: 'R12',
    title: 'Exit timeout',
  },
  {
    level: 'warning',
    name: 'R13',
    title: 'Attach error',
  },
  {
    level: 'critical',
    name: 'R14',
    title: 'Memory quota exceeded',
  },
  {
    level: 'critical',
    name: 'R15',
    title: 'Memory quota vastly exceeded',
  },
  {
    level: 'warning',
    name: 'R151',
    title: 'Memory quota vastly exceeded',
  },
  {
    level: 'warning',
    name: 'R16',
    title: 'Detached',
  },
  {
    level: 'warning',
    name: 'R99',
    title: 'Platform error',
  },
  {
    level: 'warning',
    name: 'L10',
    title: 'Drain buffer overflow',
  },
  {
    level: 'warning',
    name: 'L11',
    title: 'Tail buffer overflow',
  },
  {
    level: 'warning',
    name: 'L12',
    title: 'Local buffer overflow',
  },
  {
    level: 'critical',
    name: 'L13',
    title: 'Local delivery error',
  },
]

export default ERROR_INFO
