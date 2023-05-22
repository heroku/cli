function describeAcceptance(name, ...rest) {
  const describeName = `@acceptance ${name}`

  let describeOrSkip = describe

  if (process.env.CI && process.env.RUN_ACCEPTANCE_TESTS !== 'true') {
    describeOrSkip = describe.skip.bind(describe)
  }

  return describeOrSkip(describeName, ...rest)
}

exports.describeAcceptance = describeAcceptance
